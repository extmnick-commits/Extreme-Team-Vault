import 'server-only'
import { getLibrary } from './bunnyStorage'
import { getAdminVideos } from './bunnyStream'
import {
  END_BUFFER_SEC,
  MIN_RESUME_SEC,
  emptyMemberHistory,
  readMemberHistory,
  type AudioHistoryEntry,
  type MemberHistory,
} from './memberHistory'
import type { LibraryFile, LibraryGroup, LibraryView, PdfLibrary } from './libraryTypes'
import { portalVideoWatchPath } from './portalVideoWatch'
import { VIDEO_STATUS, videoCategoryLabel, type VideoItem } from './videoTypes'
import { getSession, resolveMemberId } from '@/app/lib/session'
import { readCustomVideoCategories } from './videoCategoryStore'
import type {
  ContinueAudio,
  DashboardPayload,
  FreshItem,
  RecentPdf,
  SearchHit,
} from './vaultTypes'

export type { ContinueAudio, DashboardPayload, FreshItem, RecentPdf, SearchHit } from './vaultTypes'

export const FRESH_LIMIT = 12
export const CONTINUE_LIMIT = 4
export const RECENT_PDF_LIMIT = 4
const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000
const EDIT_GAP_MS = 2 * 60 * 1000

export type AudioProgressMap = Record<
  string,
  { positionSec: number; durationSec: number; lastPlayedAt: string; albumId: string }
>

type AudioRef = {
  recordingId: string
  albumId: string
  albumName: string
  trackTitle: string
  trackNumber: number
  trackCount: number
  artworkUrl?: string
  dateCreated?: string
  lastChanged?: string
  file: LibraryFile
}

type PdfRef = {
  documentId: string
  library: PdfLibrary
  albumId: string
  albumName: string
  title: string
  file: LibraryFile
  href: string
}

function isUnfinished(entry: AudioHistoryEntry): boolean {
  if (entry.completed) return false
  if (entry.positionSec < MIN_RESUME_SEC) return false
  if (entry.durationSec > 0 && entry.positionSec >= entry.durationSec - END_BUFFER_SEC) {
    return false
  }
  return true
}

function freshness(publishedAt?: string, updatedAt?: string): { isNew: boolean; isUpdated: boolean } {
  if (!publishedAt) return { isNew: false, isUpdated: false }
  const published = new Date(publishedAt).getTime()
  if (Number.isNaN(published)) return { isNew: false, isUpdated: false }
  const now = Date.now()
  const isNew = now - published <= NEW_WINDOW_MS
  if (!updatedAt) return { isNew, isUpdated: false }
  const updated = new Date(updatedAt).getTime()
  if (Number.isNaN(updated)) return { isNew, isUpdated: false }
  const isUpdated =
    !isNew &&
    now - updated <= NEW_WINDOW_MS &&
    updated - published >= EDIT_GAP_MS
  return { isNew, isUpdated }
}

function walkAudio(view: LibraryView): AudioRef[] {
  const out: AudioRef[] = []

  const addFiles = (
    files: LibraryFile[],
    albumId: string,
    albumName: string,
    artworkUrl?: string,
  ) => {
    files.forEach((file, index) => {
      out.push({
        recordingId: file.id,
        albumId,
        albumName,
        trackTitle: file.title,
        trackNumber: index + 1,
        trackCount: files.length,
        artworkUrl,
        dateCreated: file.dateCreated,
        lastChanged: file.lastChanged,
        file,
      })
    })
  }

  for (const section of view.sections) {
    const artwork = section.coverUrl ?? section.artworkUrl
    addFiles(section.files, section.id, section.name, artwork)
    for (const album of section.children) {
      addFiles(album.files, album.id, album.name, album.coverUrl ?? album.artworkUrl ?? artwork)
    }
  }
  addFiles(view.unsorted, 'other', 'Other')
  return out
}

function walkPdfs(view: LibraryView, library: PdfLibrary, basePath: string): PdfRef[] {
  const out: PdfRef[] = []

  const visit = (group: LibraryGroup) => {
    for (const file of group.files) {
      out.push({
        documentId: file.name,
        library,
        albumId: group.id,
        albumName: group.name,
        title: file.title,
        file,
        href: `${basePath}/${group.id}?doc=${encodeURIComponent(file.name)}`,
      })
    }
    for (const child of group.children) visit(child)
  }

  for (const section of view.sections) visit(section)
  return out
}

function audioHref(albumId: string, recordingId: string, play = false): string {
  const params = new URLSearchParams({ track: recordingId })
  if (play) params.set('play', '1')
  return `/portal/audio/${albumId}?${params.toString()}`
}

function pdfHref(ref: PdfRef, page: number | null): string {
  const url = new URL(ref.href, 'https://vault.local')
  if (page && page >= 1) url.searchParams.set('page', String(page))
  return `${url.pathname}${url.search}`
}

function videoHref(video: VideoItem): string {
  const path = portalVideoWatchPath(video.bunnyVideoId || video.id)
  return video.category === 'archive' ? `${path}?from=archive` : path
}

export function buildSearchIndex(
  audio: AudioRef[],
  documents: PdfRef[],
  books: PdfRef[],
  videos: VideoItem[],
): SearchHit[] {
  const hits: SearchHit[] = []

  for (const video of videos) {
    hits.push({
      id: `video:${video.id}`,
      kind: 'video',
      title: video.title,
      subtitle: video.description || 'Training video',
      href: videoHref(video),
    })
  }

  const albums = new Map<string, AudioRef>()
  for (const track of audio) {
    if (!albums.has(track.albumId)) albums.set(track.albumId, track)
    hits.push({
      id: `audio-track:${track.recordingId}`,
      kind: 'audio',
      title: track.trackTitle,
      subtitle: track.albumName,
      href: audioHref(track.albumId, track.recordingId),
    })
  }
  for (const track of albums.values()) {
    hits.push({
      id: `audio-album:${track.albumId}`,
      kind: 'audio',
      title: track.albumName,
      subtitle: `${track.trackCount} ${track.trackCount === 1 ? 'track' : 'tracks'}`,
      href: `/portal/audio/${track.albumId}`,
    })
  }

  for (const doc of [...documents, ...books]) {
    hits.push({
      id: `pdf:${doc.library}:${doc.documentId}`,
      kind: 'pdf',
      title: doc.title,
      subtitle: doc.albumName,
      href: doc.href,
    })
  }

  return hits
}

function buildFreshItems(
  audio: AudioRef[],
  documents: PdfRef[],
  books: PdfRef[],
  videos: VideoItem[],
): FreshItem[] {
  const items: FreshItem[] = []

  for (const video of videos) {
    if (!video.dateUploaded) continue
    const { isNew, isUpdated } = freshness(video.dateUploaded)
    items.push({
      id: `video:${video.id}`,
      kind: 'video',
      title: video.title,
      subtitle: video.description || 'Training video',
      href: videoHref(video),
      artworkUrl: video.thumbnailUrl,
      badge: 'Video training',
      meta: video.duration,
      publishedAt: video.dateUploaded,
      isNew,
      isUpdated,
    })
  }

  const albums = new Map<
    string,
    { track: AudioRef; publishedAt: string; updatedAt?: string }
  >()
  for (const track of audio) {
    const publishedAt = track.dateCreated
    if (!publishedAt) continue
    const current = albums.get(track.albumId)
    const updatedAt = track.lastChanged
    if (!current || publishedAt > current.publishedAt) {
      albums.set(track.albumId, { track, publishedAt, updatedAt })
    } else if (updatedAt && (!current.updatedAt || updatedAt > current.updatedAt)) {
      current.updatedAt = updatedAt
    }
  }
  for (const { track, publishedAt, updatedAt } of albums.values()) {
    const { isNew, isUpdated } = freshness(publishedAt, updatedAt)
    items.push({
      id: `audio:${track.albumId}`,
      kind: 'audio',
      title: track.albumName,
      subtitle: 'Audio series',
      href: `/portal/audio/${track.albumId}`,
      artworkUrl: track.artworkUrl,
      badge: 'Audio series',
      meta: `${track.trackCount} ${track.trackCount === 1 ? 'track' : 'tracks'}`,
      publishedAt,
      isNew,
      isUpdated,
    })
  }

  for (const doc of [...documents, ...books]) {
    const publishedAt = doc.file.dateCreated
    if (!publishedAt) continue
    const { isNew, isUpdated } = freshness(publishedAt, doc.file.lastChanged)
    items.push({
      id: `pdf:${doc.library}:${doc.documentId}`,
      kind: 'pdf',
      title: doc.title,
      subtitle: doc.albumName,
      href: doc.href,
      artworkUrl: doc.file.thumbnailUrl,
      badge: doc.library === 'books' ? 'PDF book' : 'Field guide / PDF',
      meta: `${doc.file.fileType} · ${doc.file.fileSize}`,
      publishedAt,
      isNew,
      isUpdated,
    })
  }

  items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const take = (kind: FreshItem['kind']) => items.filter((item) => item.kind === kind).slice(0, FRESH_LIMIT)
  const bounded = [...take('video'), ...take('audio'), ...take('pdf')]
  bounded.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  return bounded
}

function resolveContinueListening(
  history: MemberHistory,
  audio: AudioRef[],
): ContinueAudio[] {
  const byId = new Map(audio.map((track) => [track.recordingId, track]))
  return Object.values(history.audio)
    .filter(isUnfinished)
    .sort((a, b) => b.lastPlayedAt.localeCompare(a.lastPlayedAt))
    .flatMap((entry) => {
      const track = byId.get(entry.recordingId)
      if (!track) return []
      return [
        {
          recordingId: track.recordingId,
          albumId: track.albumId,
          title: track.trackTitle,
          albumName: track.albumName,
          artworkUrl: track.artworkUrl,
          trackNumber: track.trackNumber,
          trackCount: track.trackCount,
          positionSec: entry.positionSec,
          durationSec: entry.durationSec,
          lastPlayedAt: entry.lastPlayedAt,
          href: audioHref(track.albumId, track.recordingId),
          resumeHref: audioHref(track.albumId, track.recordingId, true),
        } satisfies ContinueAudio,
      ]
    })
    .slice(0, CONTINUE_LIMIT)
}

function resolveRecentPdfs(history: MemberHistory, pdfs: PdfRef[]): RecentPdf[] {
  const byKey = new Map(pdfs.map((doc) => [`${doc.library}:${doc.documentId}`, doc]))
  return Object.values(history.pdfs)
    .sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt))
    .flatMap((entry) => {
      const ref = byKey.get(`${entry.library}:${entry.documentId}`)
      if (!ref) return []
      const page = entry.page && entry.page >= 1 ? entry.page : null
      return [
        {
          documentId: ref.documentId,
          library: ref.library,
          albumId: ref.albumId,
          title: ref.title,
          lastOpenedAt: entry.lastOpenedAt,
          page,
          href: pdfHref(ref, page),
          thumbnailUrl: ref.file.thumbnailUrl,
          canRestorePage: page != null,
        } satisfies RecentPdf,
      ]
    })
    .slice(0, RECENT_PDF_LIMIT)
}

export function audioProgressMap(history: MemberHistory): AudioProgressMap {
  const map: AudioProgressMap = {}
  for (const entry of Object.values(history.audio)) {
    map[entry.recordingId] = {
      positionSec: entry.positionSec,
      durationSec: entry.durationSec,
      lastPlayedAt: entry.lastPlayedAt,
      albumId: entry.albumId,
    }
  }
  return map
}

async function currentMemberId(): Promise<string | null> {
  return resolveMemberId(await getSession())
}

export async function getDashboardPayload(): Promise<DashboardPayload> {
  const memberId = await currentMemberId()
  const [audioView, documentsView, booksView, videoView, customCategories, historyResult] =
    await Promise.all([
      getLibrary('audio'),
      getLibrary('documents'),
      getLibrary('books'),
      getAdminVideos(),
      readCustomVideoCategories(),
      memberId
        ? readMemberHistory(memberId)
        .then((history) => ({ history, error: undefined as string | undefined }))
            .catch((error: unknown) => ({
              history: emptyMemberHistory(),
              error:
                error instanceof Error ? error.message : 'Could not load listening history.',
            }))
        : Promise.resolve({
            history: emptyMemberHistory(),
            error: undefined as string | undefined,
          }),
    ])

  const catalogErrors = [audioView.error, documentsView.error, booksView.error, videoView.error]
    .filter(Boolean)
    .join(' ')

  const audio = walkAudio(audioView)
  const documents = walkPdfs(documentsView, 'documents', '/portal/documents')
  const books = walkPdfs(booksView, 'books', '/portal/books')
  const videos = videoView.videos.filter(
    (video) => video.status === VIDEO_STATUS.finished && video.category,
  )

  const labeledVideos: VideoItem[] = videos.flatMap((video) => {
    if (!video.category) return []
    return [
      {
        ...video,
        category: video.category,
        description:
          video.description || videoCategoryLabel(video.category, customCategories),
      },
    ]
  })

  return {
    continueListening: resolveContinueListening(historyResult.history, audio),
    recentPdfs: resolveRecentPdfs(historyResult.history, [...documents, ...books]),
    fresh: buildFreshItems(audio, documents, books, labeledVideos),
    searchIndex: buildSearchIndex(audio, documents, books, labeledVideos),
    catalogError: catalogErrors || undefined,
    historyError: historyResult.error,
  }
}

export async function getAudioProgressForAlbum(): Promise<AudioProgressMap> {
  const memberId = await currentMemberId()
  if (!memberId) return {}
  const history = await readMemberHistory(memberId)
  return audioProgressMap(history)
}
