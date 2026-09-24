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
      <div className="sticky top-4 z-10 flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/95 p-4 shadow-lg shadow-black/30 backdrop-blur">
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
            className="rounded-full p-2 text-zinc-300 transition hover:bg-white/5 hover:text-white disabled:opacity-30"
            aria-label="Previous track"
          >
            <SkipBack className="size-5" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="flex size-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-md shadow-violet-900/40 transition hover:bg-violet-500"
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
            className="rounded-full p-2 text-zinc-300 transition hover:bg-white/5 hover:text-white disabled:opacity-30"
            aria-label="Next track"
          >
            <SkipForward className="size-5" />
          </button>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-zinc-100">{track.title}</span>
            <span className="text-xs text-zinc-500">
              Track {index + 1} of {tracks.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-500 tabular-nums">
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
            className="h-1.5 flex-1 cursor-pointer accent-violet-500"
          />
          <span className="w-12">{formatTime(duration)}</span>
        </div>
      </div>

      <ol className="divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
        {tracks.map((t, i) => {
          const current = i === index
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => (current ? togglePlay() : goTo(i))}
                aria-current={current ? 'true' : undefined}
                className={`flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-zinc-900 ${
                  current ? 'bg-violet-500/10' : ''
                }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm tabular-nums ${
                    current ? 'bg-violet-600 text-white' : 'border border-zinc-700 text-zinc-400'
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
                  <span className={`font-medium ${current ? 'text-violet-200' : 'text-zinc-100'}`}>
                    {t.title}
                  </span>
                  <span className="text-sm text-zinc-500">{t.description}</span>
                </span>
                <span className="shrink-0 rounded-full border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-xs font-medium text-zinc-300 tabular-nums">
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
