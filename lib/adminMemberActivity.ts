import 'server-only'
import { getLibrary } from './bunnyStorage'
import { getTrainingLibraryVideos } from './bunnyStream'
import {
  ACTIVE_NOW_MS,
  listMemberPresence,
  type MemberActivityKind,
  type MemberPresence,
} from './memberPresence'
import {
  listRecentlyUpdatedMemberIds,
  readMemberHistory,
  type AudioHistoryEntry,
  type PdfHistoryEntry,
} from './memberHistory'
import type { LibraryGroup, LibraryView } from './libraryTypes'

const MAX_HISTORY_FILES = 40

export type AdminActivityMember = {
  memberId: string
  displayName?: string
  shortId: string
  role: 'admin' | 'member'
  lastSeenAt: string
  path: string
  activityLabel: string
  activityKind: MemberActivityKind | 'unknown'
}

export type AdminRecentActivity = {
  memberId: string
  displayName?: string
  shortId: string
  kind: 'audio' | 'pdf' | 'video'
  title: string
  subtitle: string
  at: string
}

export type AdminActivityReport = {
  generatedAt: string
  activeNow: AdminActivityMember[]
  recent: AdminRecentActivity[]
  historyMembersScanned: number
}

export function shortenMemberId(memberId: string): string {
  if (memberId.length <= 12) return memberId
  return `${memberId.slice(0, 8)}…${memberId.slice(-4)}`
}

function activityLabel(presence: MemberPresence): { label: string; kind: MemberActivityKind | 'unknown' } {
  const activity = presence.activity
  if (!activity) return { label: 'Browsing the vault', kind: 'browsing' }
  if (activity.title) {
    const prefix =
      activity.kind === 'video'
        ? 'Watching'
        : activity.kind === 'audio'
          ? 'Listening'
          : activity.kind === 'pdf'
            ? 'Reading'
            : 'On'
    return { label: `${prefix}: ${activity.title}`, kind: activity.kind }
  }
  if (activity.detail) return { label: activity.detail, kind: activity.kind }
  if (activity.kind === 'browsing') return { label: 'Browsing the vault', kind: 'browsing' }
  return { label: 'In the portal', kind: activity.kind }
}

type TitleIndex = {
  audioByRecording: Map<string, { track: string; album: string }>
  pdfByKey: Map<string, { title: string; section: string }>
  videoById: Map<string, string>
}

async function buildTitleIndex(): Promise<TitleIndex> {
  const [audioView, documentsView, booksView, videos] = await Promise.all([
    getLibrary('audio'),
    getLibrary('documents'),
    getLibrary('books'),
    getTrainingLibraryVideos(),
  ])

  const audioByRecording = new Map<string, { track: string; album: string }>()
  indexAudio(audioView, audioByRecording)

  const pdfByKey = new Map<string, { title: string; section: string }>()
  indexPdfs(documentsView, 'documents', pdfByKey)
  indexPdfs(booksView, 'books', pdfByKey)

  const videoById = new Map<string, string>()
  for (const video of videos) {
    videoById.set(video.bunnyVideoId, video.title)
    videoById.set(video.id, video.title)
  }

  return { audioByRecording, pdfByKey, videoById }
}

function indexAudio(view: LibraryView, map: Map<string, { track: string; album: string }>) {
  const visit = (albumId: string, albumName: string, files: typeof view.unsorted) => {
    for (const file of files) {
      map.set(file.id, { track: file.title, album: albumName })
    }
  }
  for (const section of view.sections) {
    visit(section.id, section.name, section.files)
    for (const child of section.children) {
      visit(child.id, child.name, child.files)
    }
  }
  visit('other', 'Other', view.unsorted)
}

function indexPdfs(
  view: LibraryView,
  library: 'documents' | 'books',
  map: Map<string, { title: string; section: string }>,
) {
  const visit = (group: LibraryGroup) => {
    for (const file of group.files) {
      map.set(`${library}:${file.name}`, { title: file.title, section: group.name })
    }
    for (const child of group.children) visit(child)
  }
  for (const section of view.sections) visit(section)
}

function latestAudio(entries: Record<string, AudioHistoryEntry>): AudioHistoryEntry | null {
  let best: AudioHistoryEntry | null = null
  for (const entry of Object.values(entries)) {
    if (!best || entry.lastPlayedAt > best.lastPlayedAt) best = entry
  }
  return best
}

function latestPdf(entries: Record<string, PdfHistoryEntry>): PdfHistoryEntry | null {
  let best: PdfHistoryEntry | null = null
  for (const entry of Object.values(entries)) {
    if (!best || entry.lastOpenedAt > best.lastOpenedAt) best = entry
  }
  return best
}

function buildNameByMemberId(presence: MemberPresence[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const row of presence) {
    if (row.displayName && !map.has(row.memberId)) {
      map.set(row.memberId, row.displayName)
    }
  }
  return map
}

export async function buildAdminActivityReport(): Promise<AdminActivityReport> {
  const now = Date.now()
  const [presence, titles] = await Promise.all([listMemberPresence(), buildTitleIndex()])
  const nameByMemberId = buildNameByMemberId(presence)

  const activeNow: AdminActivityMember[] = []
  for (const row of presence) {
    const age = now - new Date(row.lastSeenAt).getTime()
    if (Number.isNaN(age) || age > ACTIVE_NOW_MS) continue
    const { label, kind } = activityLabel(row)
    activeNow.push({
      memberId: row.memberId,
      displayName: row.displayName ?? nameByMemberId.get(row.memberId),
      shortId: shortenMemberId(row.memberId),
      role: row.role,
      lastSeenAt: row.lastSeenAt,
      path: row.path,
      activityLabel: label,
      activityKind: kind,
    })
  }

  const memberIds = await listRecentlyUpdatedMemberIds(MAX_HISTORY_FILES)
  const recent: AdminRecentActivity[] = []

  await Promise.all(
    memberIds.map(async (memberId) => {
      const history = await readMemberHistory(memberId)
      const audio = latestAudio(history.audio)
      if (audio) {
        const meta = titles.audioByRecording.get(audio.recordingId)
        recent.push({
          memberId,
          displayName: nameByMemberId.get(memberId),
          shortId: shortenMemberId(memberId),
          kind: 'audio',
          title: meta?.track ?? audio.recordingId,
          subtitle: meta?.album ?? audio.albumId,
          at: audio.lastPlayedAt,
        })
      }
      const pdf = latestPdf(history.pdfs)
      if (pdf) {
        const key = `${pdf.library}:${pdf.documentId}`
        const meta = titles.pdfByKey.get(key)
        recent.push({
          memberId,
          displayName: nameByMemberId.get(memberId),
          shortId: shortenMemberId(memberId),
          kind: 'pdf',
          title: meta?.title ?? pdf.documentId,
          subtitle: meta?.section ?? pdf.albumId,
          at: pdf.lastOpenedAt,
        })
      }
    }),
  )

  recent.sort((a, b) => b.at.localeCompare(a.at))
  const bounded = recent.slice(0, 50)

  return {
    generatedAt: new Date().toISOString(),
    activeNow,
    recent: bounded,
    historyMembersScanned: memberIds.length,
  }
}