import {
  END_BUFFER_SEC,
  MIN_RESUME_SEC,
  clearLocalAudio,
  queueAudioHistory,
  readLocalAudio,
} from './historySync'
import type { AudioHistoryEntry } from './historyTypes'

const PROGRESS_KEY = 'etv_audio_progress'
const ALBUM_KEY_PREFIX = 'etv_audio_album:'

type LegacyProgressMap = Record<string, number>

function readLegacyProgressMap(): LegacyProgressMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const map: LegacyProgressMap = {}
    for (const [id, time] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof time === 'number' && Number.isFinite(time) && time >= 0) {
        map[id] = time
      }
    }
    return map
  } catch {
    return {}
  }
}

function writeLegacyProgressMap(map: LegacyProgressMap): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map))
  } catch {
    // Quota or private mode — ignore
  }
}

export function getTrackProgress(trackId: string): number | null {
  const local = readLocalAudio()[trackId]
  if (local && Number.isFinite(local.positionSec)) return local.positionSec
  const time = readLegacyProgressMap()[trackId]
  return time != null ? time : null
}

export function getTrackHistory(trackId: string): AudioHistoryEntry | null {
  return readLocalAudio()[trackId] ?? null
}

export function saveTrackProgress(
  trackId: string,
  seconds: number,
  duration?: number,
  albumId?: string,
  options?: { immediate?: boolean },
): void {
  if (!Number.isFinite(seconds) || seconds < 0) return
  const durationSec = duration != null && Number.isFinite(duration) ? duration : 0
  const completed =
    durationSec > 0 && seconds >= durationSec - END_BUFFER_SEC
  const map = readLegacyProgressMap()

  if (completed) {
    if (trackId in map) {
      delete map[trackId]
      writeLegacyProgressMap(map)
    }
    if (albumId) {
      queueAudioHistory(
        {
          recordingId: trackId,
          albumId,
          positionSec: durationSec,
          durationSec,
          lastPlayedAt: new Date().toISOString(),
          completed: true,
        },
        true,
      )
    }
    return
  }

  // Loading, seeking to 0, or a page-exit flush before playback must not wipe a real resume point.
  if (seconds < MIN_RESUME_SEC) return

  map[trackId] = seconds
  writeLegacyProgressMap(map)

  if (!albumId) return
  queueAudioHistory(
    {
      recordingId: trackId,
      albumId,
      positionSec: seconds,
      durationSec,
      lastPlayedAt: new Date().toISOString(),
      completed: false,
    },
    options?.immediate === true,
  )
}

export function clearTrackProgress(trackId: string): void {
  const map = readLegacyProgressMap()
  if (trackId in map) {
    delete map[trackId]
    writeLegacyProgressMap(map)
  }
  clearLocalAudio(trackId)
}

export type AlbumPlaybackHint = { trackId: string; trackIndex: number }

export function getAlbumPlaybackHint(albumId: string): AlbumPlaybackHint | null {
  if (typeof window === 'undefined' || !albumId) return null
  try {
    const raw = localStorage.getItem(`${ALBUM_KEY_PREFIX}${albumId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof (parsed as AlbumPlaybackHint).trackId !== 'string' ||
      typeof (parsed as AlbumPlaybackHint).trackIndex !== 'number'
    ) {
      return null
    }
    return parsed as AlbumPlaybackHint
  } catch {
    return null
  }
}

export function saveAlbumPlaybackHint(
  albumId: string,
  hint: AlbumPlaybackHint
): void {
  if (typeof window === 'undefined' || !albumId) return
  try {
    localStorage.setItem(`${ALBUM_KEY_PREFIX}${albumId}`, JSON.stringify(hint))
  } catch {
    // ignore
  }
}

export type ResumeSource = {
  positionSec: number
  lastPlayedAt?: string
}

export function resumeTimeForTrack(
  trackId: string,
  duration: number,
  server?: ResumeSource | null,
): number | null {
  const local = getTrackHistory(trackId)
  const localPos = local?.positionSec ?? getTrackProgress(trackId)
  const candidates: ResumeSource[] = []
  if (server && Number.isFinite(server.positionSec)) candidates.push(server)
  if (localPos != null) {
    candidates.push({
      positionSec: localPos,
      lastPlayedAt: local?.lastPlayedAt,
    })
  }
  candidates.sort((a, b) => (b.lastPlayedAt ?? '').localeCompare(a.lastPlayedAt ?? ''))
  for (const candidate of candidates) {
    if (candidate.positionSec < MIN_RESUME_SEC) continue
    if (duration > 0 && candidate.positionSec >= duration - END_BUFFER_SEC) continue
    return candidate.positionSec
  }
  return null
}
