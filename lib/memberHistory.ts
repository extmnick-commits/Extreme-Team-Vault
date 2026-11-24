import 'server-only'
import { getVaultFirestore } from './firebaseAdmin'
import { isPdfLibrary, type PdfLibrary } from './libraryTypes'

export const HISTORY_COLLECTION = 'vaultMemberHistory'

export const MEMBER_HISTORY_VERSION = 1 as const
export const MAX_AUDIO_HISTORY = 50
export const MAX_PDF_HISTORY = 50
export const END_BUFFER_SEC = 8
export const MIN_RESUME_SEC = 3

export type AudioHistoryEntry = {
  recordingId: string
  albumId: string
  positionSec: number
  durationSec: number
  lastPlayedAt: string
  completed: boolean
}

export type PdfHistoryEntry = {
  documentId: string
  library: PdfLibrary
  albumId: string
  page: number | null
  lastOpenedAt: string
}

export type MemberHistory = {
  version: typeof MEMBER_HISTORY_VERSION
  audio: Record<string, AudioHistoryEntry>
  pdfs: Record<string, PdfHistoryEntry>
}

export function emptyMemberHistory(): MemberHistory {
  return { version: MEMBER_HISTORY_VERSION, audio: {}, pdfs: {} }
}

export function pdfHistoryKey(library: PdfLibrary, documentId: string): string {
  return `${library}:${documentId}`
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime())
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function isCompletedAudio(positionSec: number, durationSec: number): boolean {
  if (!(durationSec > 0)) return false
  return positionSec >= durationSec - END_BUFFER_SEC
}

function parseAudioEntry(value: unknown): AudioHistoryEntry | null {
  if (typeof value !== 'object' || value === null) return null
  const raw = value as Partial<AudioHistoryEntry>
  if (typeof raw.recordingId !== 'string' || !raw.recordingId) return null
  if (typeof raw.albumId !== 'string' || !raw.albumId) return null
  if (!isFiniteNumber(raw.positionSec) || raw.positionSec < 0) return null
  if (!isFiniteNumber(raw.durationSec) || raw.durationSec < 0) return null
  if (!isIsoDate(raw.lastPlayedAt)) return null
  const completed =
    typeof raw.completed === 'boolean'
      ? raw.completed
      : isCompletedAudio(raw.positionSec, raw.durationSec)
  return {
    recordingId: raw.recordingId.slice(0, 200),
    albumId: raw.albumId.slice(0, 200),
    positionSec: raw.positionSec,
    durationSec: raw.durationSec,
    lastPlayedAt: raw.lastPlayedAt,
    completed,
  }
}

function parsePdfEntry(value: unknown): PdfHistoryEntry | null {
  if (typeof value !== 'object' || value === null) return null
  const raw = value as Partial<PdfHistoryEntry>
  if (typeof raw.documentId !== 'string' || !raw.documentId) return null
  if (!isPdfLibrary(raw.library)) return null
  if (typeof raw.albumId !== 'string' || !raw.albumId) return null
  if (!isIsoDate(raw.lastOpenedAt)) return null
  const page =
    raw.page === null || raw.page === undefined
      ? null
      : isFiniteNumber(raw.page) && raw.page >= 1
        ? Math.floor(raw.page)
        : null
  return {
    documentId: raw.documentId.slice(0, 240),
    library: raw.library,
    albumId: raw.albumId.slice(0, 200),
    page,
    lastOpenedAt: raw.lastOpenedAt,
  }
}

export function parseMemberHistory(value: unknown): MemberHistory {
  const history = emptyMemberHistory()
  if (typeof value !== 'object' || value === null) return history
  const raw = value as Partial<MemberHistory>
  if (raw.audio && typeof raw.audio === 'object') {
    for (const entry of Object.values(raw.audio)) {
      const parsed = parseAudioEntry(entry)
      if (parsed) history.audio[parsed.recordingId] = parsed
    }
  }
  if (raw.pdfs && typeof raw.pdfs === 'object') {
    for (const [key, entry] of Object.entries(raw.pdfs)) {
      const parsed = parsePdfEntry(entry)
      if (parsed) history.pdfs[key] = parsed
    }
  }
  return pruneHistory(history)
}

function pruneByRecency<T>(
  records: Record<string, T>,
  timestamp: (entry: T) => string,
  limit: number,
): Record<string, T> {
  const entries = Object.entries(records)
  if (entries.length <= limit) return records
  entries.sort((a, b) => timestamp(b[1]).localeCompare(timestamp(a[1])))
  return Object.fromEntries(entries.slice(0, limit))
}

export function pruneHistory(history: MemberHistory): MemberHistory {
  return {
    version: MEMBER_HISTORY_VERSION,
    audio: pruneByRecency(history.audio, (entry) => entry.lastPlayedAt, MAX_AUDIO_HISTORY),
    pdfs: pruneByRecency(history.pdfs, (entry) => entry.lastOpenedAt, MAX_PDF_HISTORY),
  }
}

export async function readMemberHistory(memberId: string): Promise<MemberHistory> {
  try {
    const snap = await getVaultFirestore().collection(HISTORY_COLLECTION).doc(memberId).get()
    if (!snap.exists) return emptyMemberHistory()
    const body = snap.data()?.body
    if (typeof body !== 'string' || !body.trim()) return emptyMemberHistory()
    return parseMemberHistory(JSON.parse(body) as unknown)
  } catch (error) {
    console.error('[memberHistory] Failed to read history:', error)
    return emptyMemberHistory()
  }
}

export async function writeMemberHistory(
  memberId: string,
  history: MemberHistory,
): Promise<void> {
  const pruned = pruneHistory(history)
  await getVaultFirestore().collection(HISTORY_COLLECTION).doc(memberId).set({
    updatedAt: new Date().toISOString(),
    body: JSON.stringify(pruned),
  })
}

export async function listRecentlyUpdatedMemberIds(limit = 40): Promise<string[]> {
  const snap = await getVaultFirestore()
    .collection(HISTORY_COLLECTION)
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get()
  return snap.docs.map((doc) => doc.id)
}

export async function upsertAudioHistory(
  memberId: string,
  input: AudioHistoryEntry,
): Promise<MemberHistory> {
  const history = await readMemberHistory(memberId)
  const existing = history.audio[input.recordingId]
  if (
    existing &&
    new Date(existing.lastPlayedAt).getTime() > new Date(input.lastPlayedAt).getTime()
  ) {
    return history
  }
  const completed = input.completed || isCompletedAudio(input.positionSec, input.durationSec)
  history.audio[input.recordingId] = {
    ...input,
    positionSec: completed ? input.durationSec : input.positionSec,
    completed,
  }
  const next = pruneHistory(history)
  await writeMemberHistory(memberId, next)
  return next
}

export async function upsertPdfHistory(
  memberId: string,
  input: PdfHistoryEntry,
): Promise<MemberHistory> {
  const history = await readMemberHistory(memberId)
  const key = pdfHistoryKey(input.library, input.documentId)
  const existing = history.pdfs[key]
  if (
    existing &&
    new Date(existing.lastOpenedAt).getTime() > new Date(input.lastOpenedAt).getTime()
  ) {
    return history
  }
  history.pdfs[key] = input
  const next = pruneHistory(history)
  await writeMemberHistory(memberId, next)
  return next
}

export function parseAudioPayload(value: unknown): AudioHistoryEntry | null {
  return parseAudioEntry(value)
}

export function parsePdfPayload(value: unknown): PdfHistoryEntry | null {
  return parsePdfEntry(value)
}
