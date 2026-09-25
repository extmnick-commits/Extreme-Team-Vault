'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Pause, Play, SkipBack, SkipForward } from 'lucide-react'

export type AlbumTrack = {
  id: string
  title: string
  description: string
  src: string
  badge: string
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

export default function AlbumPlayer({
  albumName,
  tracks,
}: {
  albumName: string
  tracks: AlbumTrack[]
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const playOnLoad = useRef(false)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const track = tracks[index]
  const hasPrev = index > 0
  const hasNext = index < tracks.length - 1

  function goTo(next: number, autoplay = true) {
    if (next < 0 || next >= tracks.length) return
    if (next === index) {
      void audioRef.current?.play()
      return
    }
    playOnLoad.current = autoplay
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

  useEffect(() => {
    if (!('mediaSession' in navigator) || !track) return
    navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, album: albumName })
    navigator.mediaSession.setActionHandler('previoustrack', () => handlers.current.prev())
    navigator.mediaSession.setActionHandler('nexttrack', () => handlers.current.next())
  }, [track, albumName])

  if (!track) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-16 z-10 flex flex-col gap-3 rounded-2xl border border-line bg-surface/95 p-4 shadow-lg shadow-zinc-900/5 backdrop-blur md:top-4">
        <audio
          ref={audioRef}
          src={track.src}
          preload="metadata"
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration)
            if (playOnLoad.current) {
              playOnLoad.current = false
              void e.currentTarget.play()
            }
          }}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onWaiting={() => setLoading(true)}
          onPlaying={() => setLoading(false)}
          onCanPlay={() => setLoading(false)}
          onEnded={() => {
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
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-semibold text-ink">{track.title}</span>
            <span className="text-xs text-ink-subtle">
              Track {index + 1} of {tracks.length}
            </span>
          </div>
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
            }}
            disabled={!duration}
            aria-label="Seek"
            className="h-1.5 flex-1 cursor-pointer accent-violet-600"
          />
          <span className="w-12">{formatTime(duration)}</span>
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
