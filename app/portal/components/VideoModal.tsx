'use client'

import { useEffect, useRef, useState } from 'react'
import { Clock, Download, ExternalLink, FileText, Play, X } from 'lucide-react'
import type { VideoItem, VideoLinkedDocument } from '@/lib/videoTypes'
import VideoPoster from './VideoPoster'
import VideoThumbnailImage from './VideoThumbnailImage'

const secondaryButton =
  'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-medium text-ink shadow-sm transition-colors hover:bg-zinc-50 sm:min-h-10'
const primaryButton =
  'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm shadow-violet-600/30 transition-colors hover:bg-violet-700 sm:min-h-10'

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
  const materials = video.linkedDocuments ?? []

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

        {materials.length > 0 && (
          <section className="border-t border-line px-4 pb-4 sm:px-6 sm:pb-6">
            <h3 className="mb-3 text-sm font-semibold text-ink">Training materials</h3>
            <ul className="flex flex-col gap-3">
              {materials.map((doc) => (
                <TrainingMaterialRow key={doc.id} doc={doc} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

function TrainingMaterialRow({ doc }: { doc: VideoLinkedDocument }) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-line bg-zinc-50/80 p-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {doc.thumbnailUrl ? (
          <span className="relative block aspect-[4/3] w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-line">
            <VideoThumbnailImage src={doc.thumbnailUrl} alt="" />
          </span>
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 ring-1 ring-violet-100">
            <FileText className="size-5" aria-hidden="true" />
          </span>
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-medium text-ink">{doc.title}</span>
          <span className="text-xs text-ink-subtle tabular-nums">{doc.badge}</span>
          {doc.description && (
            <p className="line-clamp-2 text-sm text-ink-muted">{doc.description}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 sm:shrink-0">
        <a
          href={doc.cdnUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={secondaryButton}
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          Open
        </a>
        <a href={doc.cdnUrl} download className={primaryButton}>
          <Download className="size-4" aria-hidden="true" />
          Download
        </a>
      </div>
    </li>
  )
}
