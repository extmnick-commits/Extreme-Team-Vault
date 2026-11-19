'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, Loader2, Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import {
  clearTrackProgress,
  getAlbumPlaybackHint,
  getTrackProgress,
  resumeTimeForTrack,
  saveAlbumPlaybackHint,
  saveTrackProgress,
  type ResumeSource,
} from '@/lib/client/audioPlaybackStore'
import { bindHistoryFlush } from '@/lib/client/historySync'
import AlbumArtwork from './AlbumArtwork'

export type AlbumTrack = {
  id: string
  title: string
  description: string
  src: string
  badge: string
  artworkUrl?: string
  downloadUrl?: string
  fileName?: string
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

const PROGRESS_SAVE_INTERVAL_MS = 2500

export default function AlbumPlayer({
  albumId,
  albumName,
  tracks,
  artworkUrl,
  initialTrackId,
  autoPlay = false,
  serverProgress,
}: {
  albumId?: string
  albumName: string
  tracks: AlbumTrack[]
  artworkUrl?: string
  initialTrackId?: string
  autoPlay?: boolean
  serverProgress?: Record<string, ResumeSource>
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const playOnLoad = useRef(autoPlay)
  const lastProgressSave = useRef(0)
  const restoredTrackId = useRef<string | null>(null)
  const [index, setIndex] = useState(() => {
    if (!initialTrackId) return 0
    const found = tracks.findIndex((t) => t.id === initialTrackId)
    return found >= 0 ? found : 0
  })
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const track = tracks[index]
  const hasPrev = index > 0
  const hasNext = index < tracks.length - 1
  const indexRef = useRef(index)
  indexRef.current = index

  useEffect(() => {
    if (initialTrackId || !albumId) return
    const hint = getAlbumPlaybackHint(albumId)
    if (!hint) return
    const byId = tracks.findIndex((t) => t.id === hint.trackId)
    if (byId >= 0) {
      setIndex(byId)
      return
    }
    if (hint.trackIndex >= 0 && hint.trackIndex < tracks.length) {
      setIndex(hint.trackIndex)
    }
  }, [albumId, initialTrackId, tracks])

  function persistCurrentProgress(immediate = false) {
    const audio = audioRef.current
    const current = tracks[index]
    if (!audio || !current) return
    saveTrackProgress(current.id, audio.currentTime, audio.duration, albumId, {
      immediate,
    })
  }

  function applyResume(audio: HTMLAudioElement) {
    const current = tracks[indexRef.current]
    if (!current) return
    const d = audio.duration
    if (!Number.isFinite(d) || d <= 0) return
    setDuration(d)
    if (restoredTrackId.current === current.id) return
    restoredTrackId.current = current.id
    const resumeAt = resumeTimeForTrack(current.id, d, serverProgress?.[current.id])
    if (resumeAt != null) {
      audio.currentTime = resumeAt
      setTime(resumeAt)
    } else {
      const saved = getTrackProgress(current.id)
      if (saved != null && saved > 0) setTime(saved)
    }
    if (playOnLoad.current) {
      playOnLoad.current = false
      void audio.play()
    }
  }

  function goTo(next: number, autoplay = true) {
    if (next < 0 || next >= tracks.length) return
    if (next === index) {
      void audioRef.current?.play()
      return
    }
    persistCurrentProgress(true)
    playOnLoad.current = autoplay
    restoredTrackId.current = null
    setTime(0)
    setDuration(0)
    setIndex(next)
  }

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) void audio.play()
    else audio.pause()
  }

  function skipBack() {
    const audio = audioRef.current
    // Like most players: restart the track unless we are near its beginning.
    if (audio && audio.currentTime > 3) audio.currentTime = 0
    else goTo(index - 1)
  }

  const handlers = useRef({ prev: skipBack, next: () => goTo(index + 1) })
  useEffect(() => {
    handlers.current = { prev: skipBack, next: () => goTo(index + 1) }
  })

  const art = artworkUrl ?? track?.artworkUrl

  useEffect(() => {
    if (!albumId || !track) return
    saveAlbumPlaybackHint(albumId, { trackId: track.id, trackIndex: index })
  }, [albumId, index, track])

  useEffect(() => {
    restoredTrackId.current = null
    const audio = audioRef.current
    if (!audio || !track) return
    // Cached files can finish loading before React attaches onLoadedMetadata.
    if (audio.readyState >= 1) applyResume(audio)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- applyResume reads the current track
  }, [track?.id, serverProgress])

  useEffect(() => {
    const flush = () => {
      const audio = audioRef.current
      const current = tracks[indexRef.current]
      if (!audio || !current) return
      saveTrackProgress(current.id, audio.currentTime, audio.duration, albumId, {
        immediate: true,
      })
    }
    const unbind = bindHistoryFlush()
    window.addEventListener('pagehide', flush)
    return () => {
      flush()
      unbind()
      window.removeEventListener('pagehide', flush)
    }
  }, [albumId, tracks])

  useEffect(() => {
    if (!('mediaSession' in navigator) || !track) return
    const artwork = art
      ? [{ src: art, sizes: '512x512', type: 'image/jpeg' }]
      : []
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      album: albumName,
      artwork,
    })
    navigator.mediaSession.setActionHandler('previoustrack', () => handlers.current.prev())
    navigator.mediaSession.setActionHandler('nexttrack', () => handlers.current.next())
  }, [track, albumName, art])

  if (!track) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-16 z-10 flex flex-col gap-4 rounded-2xl border border-line bg-surface/95 p-4 shadow-lg shadow-zinc-900/5 backdrop-blur md:top-4 sm:flex-row sm:items-center">
        <AlbumArtwork
          src={art}
          alt={`${albumName} artwork`}
          className="mx-auto size-28 shrink-0 sm:mx-0 sm:size-32"
          loading="eager"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
        <audio
          ref={audioRef}
          src={track.src}
          preload="metadata"
          onLoadedMetadata={(e) => {
            applyResume(e.currentTarget)
          }}
          onTimeUpdate={(e) => {
            const audio = e.currentTarget
            setTime(audio.currentTime)
            const now = Date.now()
            if (now - lastProgressSave.current >= PROGRESS_SAVE_INTERVAL_MS) {
              lastProgressSave.current = now
              saveTrackProgress(track.id, audio.currentTime, audio.duration, albumId)
            }
          }}
          onPlay={() => setPlaying(true)}
          onPause={(e) => {
            setPlaying(false)
            saveTrackProgress(
              track.id,
              e.currentTarget.currentTime,
              e.currentTarget.duration,
              albumId,
              { immediate: true },
            )
          }}
          onWaiting={() => setLoading(true)}
          onPlaying={() => setLoading(false)}
          onCanPlay={() => setLoading(false)}
          onEnded={() => {
            clearTrackProgress(track.id)
            if (hasNext) goTo(index + 1)
            else setPlaying(false)
          }}
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={skipBack}
            disabled={!hasPrev && time <= 3}
            className="flex size-11 items-center justify-center rounded-full text-ink-muted transition hover:bg-zinc-100 hover:text-ink disabled:opacity-30"
            aria-label="Previous track"
          >
            <SkipBack className="size-5" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white shadow-md shadow-violet-600/30 transition hover:bg-violet-700"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {loading && playing ? (
              <Loader2 className="size-5 animate-spin" />
            ) : playing ? (
              <Pause className="size-5 fill-current" />
            ) : (
              <Play className="size-5 translate-x-px fill-current" />
            )}
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={!hasNext}
            className="flex size-11 items-center justify-center rounded-full text-ink-muted transition hover:bg-zinc-100 hover:text-ink disabled:opacity-30"
            aria-label="Next track"
          >
            <SkipForward className="size-5" />
          </button>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-semibold text-ink">{track.title}</span>
            <span className="text-xs text-ink-subtle">
              Track {index + 1} of {tracks.length}
            </span>
          </div>
          {track.downloadUrl && (
            <a
              href={track.downloadUrl}
              download={track.fileName || true}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-ink-muted transition hover:bg-zinc-100 hover:text-ink"
              aria-label={`Download ${track.title}`}
              title="Download"
            >
              <Download className="size-5" aria-hidden="true" />
            </a>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-ink-subtle tabular-nums">
          <span className="w-12 text-right">{formatTime(time)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={1}
            value={Math.min(time, duration || 0)}
            onChange={(e) => {
              const audio = audioRef.current
              if (!audio) return
              audio.currentTime = Number(e.target.value)
              setTime(audio.currentTime)
              saveTrackProgress(track.id, audio.currentTime, audio.duration, albumId, {
                immediate: true,
              })
            }}
            disabled={!duration}
            aria-label="Seek"
            className="h-1.5 flex-1 cursor-pointer accent-violet-600"
          />
          <span className="w-12">{formatTime(duration)}</span>
        </div>
        </div>
      </div>

      <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        {tracks.map((t, i) => {
          const current = i === index
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => (current ? togglePlay() : goTo(i))}
                aria-current={current ? 'true' : undefined}
                className={`flex w-full items-start gap-3 p-4 text-left transition-colors sm:gap-4 ${
                  current ? 'bg-violet-50' : 'hover:bg-zinc-50'
                }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm tabular-nums ${
                    current ? 'bg-violet-600 text-white' : 'border border-line text-ink-subtle'
                  }`}
                >
                  {current && playing ? (
                    <Pause className="size-3.5 fill-current" aria-hidden="true" />
                  ) : current ? (
                    <Play className="size-3.5 translate-x-px fill-current" aria-hidden="true" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className={`font-medium ${current ? 'text-violet-900' : 'text-ink'}`}>
                    {t.title}
                  </span>
                  <span className="line-clamp-2 text-sm text-ink-muted">{t.description}</span>
                </span>
                <span className="hidden shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-ink-muted tabular-nums sm:inline">
                  {t.badge}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
