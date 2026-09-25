'use client'

import { useEffect, useRef, useState } from 'react'
import { Clock, Play, X } from 'lucide-react'
import type { VideoItem } from '@/lib/videoTypes'
import VideoPoster from './VideoPoster'

type VideoModalProps = {
  video: VideoItem
  onClose: () => void
}

export default function VideoModal({ video, onClose }: VideoModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const titleId = `video-modal-title-${video.id}`
  const embedSrc = `https://player.mediadelivery.net/embed/${video.libraryId}/${video.bunnyVideoId}?autoplay=true`

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/70 backdrop-blur-sm sm:items-center sm:p-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-full w-full max-w-5xl flex-col overflow-y-auto bg-surface pb-[env(safe-area-inset-bottom)] shadow-2xl sm:max-h-[90vh] sm:rounded-2xl sm:pb-0"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative aspect-video w-full shrink-0 bg-black">
          {isPlaying ? (
            <iframe
              src={embedSrc}
              title={video.title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 size-full border-0"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              className="group/player absolute inset-0 flex w-full items-center justify-center"
              aria-label={`Play ${video.title}`}
            >
              <VideoPoster
                video={video}
                sizes="100vw"
                priority
                hidePlayOverlay
                className="absolute inset-0 h-full"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover/player:bg-black/30">
                <span className="flex size-16 min-h-11 min-w-11 items-center justify-center rounded-full bg-white/95 text-violet-600 shadow-lg shadow-black/25 transition group-hover/player:scale-105">
                  <Play className="size-7 translate-x-0.5 fill-current" aria-hidden="true" />
                </span>
              </span>
            </button>
          )}
        </div>

        <div className="flex items-start justify-between gap-4 p-4 sm:p-6">
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2 id={titleId} className="text-lg font-semibold text-ink sm:text-xl">
              {video.title}
            </h2>
            <p className="text-sm text-ink-muted sm:text-base">{video.description}</p>
            <span className="mt-1 flex items-center gap-1 text-xs text-ink-subtle tabular-nums">
              <Clock className="size-3.5" aria-hidden="true" />
              {video.duration}
            </span>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close video"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line text-ink-muted transition-colors hover:bg-zinc-100 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
