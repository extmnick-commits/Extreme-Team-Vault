'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2, Play } from 'lucide-react'
import type { VideoItem } from '@/lib/videoTypes'
import PortalStreamVideo from './PortalStreamVideo'
import VideoPoster from './VideoPoster'

type PlaybackInfo = {
  nativePlayback: { format: 'hls' | 'mp4'; url: string }
  devicePlayerUrl: string
}

type PortalDeviceWatchProps = {
  video: VideoItem
  backHref: string
}

export default function PortalDeviceWatch({ video, backHref }: PortalDeviceWatchProps) {
  const [playback, setPlayback] = useState<PlaybackInfo | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [inlineFallback, setInlineFallback] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch(
          `/api/portal/video-playback/${encodeURIComponent(video.bunnyVideoId)}`,
          { credentials: 'same-origin' },
        )
        if (!response.ok) throw new Error('unavailable')
        const data = (await response.json()) as PlaybackInfo
        if (!cancelled) setPlayback(data)
      } catch {
        if (!cancelled) setLoadError(true)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [video.bunnyVideoId])

  const devicePlayerHref = playback?.devicePlayerUrl ?? ''
  const showInlinePlayer = inlineFallback && playback

  return (
    <div className="portal-device-watch fixed inset-0 z-50 flex flex-col bg-black text-white">
      <header className="flex shrink-0 items-center gap-2 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2">
        <Link
          href={backHref}
          className="flex size-11 touch-manipulation items-center justify-center rounded-full text-white/90 hover:bg-white/10"
        >
          <ArrowLeft className="size-6" aria-hidden="true" />
          <span className="sr-only">Back to videos</span>
        </Link>
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-white/90">{video.title}</p>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {!showInlinePlayer && (
          <>
            <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
              <VideoPoster
                video={video}
                sizes="100vw"
                priority
                hidePlayOverlay
                className="!absolute inset-0 !aspect-auto !h-full !w-full"
              />
            </div>

            {loadError ? (
              <p className="relative z-10 max-w-sm text-center text-sm text-white/80">
                Could not prepare playback. Try again from the video list.
              </p>
            ) : !playback ? (
              <Loader2 className="relative z-10 size-10 animate-spin text-white/80" aria-hidden="true" />
            ) : (
              <div className="relative z-10 flex flex-col items-center gap-4">
                <a
                  href={devicePlayerHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex size-24 touch-manipulation items-center justify-center rounded-full bg-white/95 text-black shadow-2xl shadow-black/50 ring-4 ring-white/20 transition active:scale-95"
                >
                  <Play className="size-12 translate-x-1 fill-current" aria-hidden="true" />
                  <span className="sr-only">Play in phone video player</span>
                </a>
                <p className="max-w-xs text-center text-sm text-white/85">
                  Tap the play button to open in your phone&apos;s video player (Samsung Video, Gallery, or
                  similar).
                </p>
                <button
                  type="button"
                  onClick={() => setInlineFallback(true)}
                  className="text-sm font-medium text-violet-300 underline-offset-2 hover:underline"
                >
                  Play here instead
                </button>
              </div>
            )}
          </>
        )}

        {showInlinePlayer && (
          <div className="relative flex w-full max-w-3xl flex-col gap-3">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
              <PortalStreamVideo
                videoId={video.bunnyVideoId}
                title={video.title}
                poster={`/api/portal/video-thumbnail/${encodeURIComponent(video.bunnyVideoId)}`}
              />
            </div>
            <button
              type="button"
              onClick={() => setInlineFallback(false)}
              className="text-sm text-violet-300 underline-offset-2 hover:underline"
            >
              Back to phone player
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
