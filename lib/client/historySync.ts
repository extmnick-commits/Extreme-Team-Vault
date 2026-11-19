import {
  END_BUFFER_SEC,
  MIN_RESUME_SEC,
  type AudioHistoryEntry,
  type PdfHistoryEntry,
} from './historyTypes'

const AUDIO_KEY = 'etv_member_audio_v1'
const PDF_KEY = 'etv_member_pdf_v1'
const AUDIO_URL = '/api/portal/history/audio'
const PDF_URL = '/api/portal/history/pdf'
const SERVER_THROTTLE_MS = 10_000

type Queued = { url: string; body: string; at: number }

const queued = new Map<string, Queued>()
const lastSent = new Map<string, number>()
const timers = new Map<string, number>()

function readJson<T>(key: string): Record<string, T> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, T>
  } catch {
    return {}
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota or private mode
  }
}

export function readLocalAudio(): Record<string, AudioHistoryEntry> {
  return readJson<AudioHistoryEntry>(AUDIO_KEY)
}

export function readLocalPdfs(): Record<string, PdfHistoryEntry> {
  return readJson<PdfHistoryEntry>(PDF_KEY)
}

export function writeLocalAudio(entry: AudioHistoryEntry): void {
  const map = readLocalAudio()
  map[entry.recordingId] = entry
  writeJson(AUDIO_KEY, map)
}

export function writeLocalPdf(entry: PdfHistoryEntry): void {
  const map = readLocalPdfs()
  map[`${entry.library}:${entry.documentId}`] = entry
  writeJson(PDF_KEY, map)
}

export function clearLocalAudio(recordingId: string): void {
  const map = readLocalAudio()
  if (!(recordingId in map)) return
  delete map[recordingId]
  writeJson(AUDIO_KEY, map)
}

function send(url: string, body: string): void {
  if (typeof window === 'undefined') return
  const blob = new Blob([body], { type: 'application/json' })
  if (document.visibilityState === 'hidden' && navigator.sendBeacon) {
    const ok = navigator.sendBeacon(url, blob)
    if (ok) return
  }
  void fetch(url, {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json' },
    keepalive: true,
    credentials: 'same-origin',
  }).catch(() => {
    // localStorage remains the fallback
  })
}

function flushKey(key: string): void {
  const item = queued.get(key)
  if (!item) return
  queued.delete(key)
  lastSent.set(key, Date.now())
  send(item.url, item.body)
}

function enqueue(key: string, url: string, payload: unknown, immediate: boolean): void {
  const body = JSON.stringify(payload)
  queued.set(key, { url, body, at: Date.now() })
  if (immediate) {
    const timer = timers.get(key)
    if (timer) window.clearTimeout(timer)
    timers.delete(key)
    flushKey(key)
    return
  }
  if (timers.has(key)) return
  const last = lastSent.get(key) ?? 0
  const wait = Math.max(0, SERVER_THROTTLE_MS - (Date.now() - last))
  const timer = window.setTimeout(() => {
    timers.delete(key)
    flushKey(key)
  }, wait)
  timers.set(key, timer)
}

export function queueAudioHistory(entry: AudioHistoryEntry, immediate = false): void {
  writeLocalAudio(entry)
  enqueue(`audio:${entry.recordingId}`, AUDIO_URL, entry, immediate)
}

export function queuePdfHistory(entry: PdfHistoryEntry, immediate = false): void {
  writeLocalPdf(entry)
  enqueue(`pdf:${entry.library}:${entry.documentId}`, PDF_URL, entry, immediate)
}

export function flushQueuedHistory(): void {
  for (const key of [...queued.keys()]) flushKey(key)
}

export function isUnfinishedAudio(positionSec: number, durationSec: number): boolean {
  if (positionSec < MIN_RESUME_SEC) return false
  if (durationSec > 0 && positionSec >= durationSec - END_BUFFER_SEC) return false
  return true
}

export { END_BUFFER_SEC, MIN_RESUME_SEC }

export function bindHistoryFlush(): () => void {
  if (typeof window === 'undefined') return () => undefined
  const onHide = () => {
    if (document.visibilityState === 'hidden') flushQueuedHistory()
  }
  window.addEventListener('pagehide', flushQueuedHistory)
  document.addEventListener('visibilitychange', onHide)
  return () => {
    window.removeEventListener('pagehide', flushQueuedHistory)
    document.removeEventListener('visibilitychange', onHide)
  }
}
