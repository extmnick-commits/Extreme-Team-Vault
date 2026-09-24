'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { VideoItem } from '@/lib/mediaData'

type VideoModalProps = {
  video: VideoItem
  onClose: () => void
}

export default function VideoModal({ video, onClose }: VideoModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex w-full max-w-5xl flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h2
              id={titleId}
              className="truncate text-lg font-semibold text-zinc-50"
            >
              {video.title}
            </h2>
            <p className="text-sm text-zinc-400">{video.description}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close video"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe
            src={`https://player.mediadelivery.net/embed/${video.libraryId}/${video.bunnyVideoId}`}
            title={video.title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 size-full border-0"
          />
        </div>
      </div>
    </div>
  )
}
