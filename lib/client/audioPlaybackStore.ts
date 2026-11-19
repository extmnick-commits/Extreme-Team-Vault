const PROGRESS_KEY = 'etv_audio_progress'
const ALBUM_KEY_PREFIX = 'etv_audio_album:'

/** Don't resume if within this many seconds of the end. */
const END_BUFFER_SEC = 8
/** Don't resume if position is below this (prefer starting fresh). */
const MIN_RESUME_SEC = 3

type ProgressMap = Record<string, number>

function readProgressMap(): ProgressMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const map: ProgressMap = {}
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

function writeProgressMap(map: ProgressMap): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map))
  } catch {
    // Quota or private mode — ignore
  }
}

export function getTrackProgress(trackId: string): number | null {
  const time = readProgressMap()[trackId]
  return time != null ? time : null
}

export function saveTrackProgress(trackId: string, seconds: number, duration?: number): void {
  if (!Number.isFinite(seconds) || seconds < MIN_RESUME_SEC) return
  if (duration != null && Number.isFinite(duration) && duration > 0) {
    if (seconds >= duration - END_BUFFER_SEC) {
      clearTrackProgress(trackId)
      return
    }
  }
  const map = readProgressMap()
  map[trackId] = seconds
  writeProgressMap(map)
}

export function clearTrackProgress(trackId: string): void {
  const map = readProgressMap()
  if (!(trackId in map)) return
  delete map[trackId]
  writeProgressMap(map)
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

export function resumeTimeForTrack(
  trackId: string,
  duration: number
): number | null {
  const saved = getTrackProgress(trackId)
  if (saved == null || saved < MIN_RESUME_SEC) return null
  if (duration > 0 && saved >= duration - END_BUFFER_SEC) return null
  return saved
}