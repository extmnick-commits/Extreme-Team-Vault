'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock, Download, ExternalLink, FileText, Play, X } from 'lucide-react'
import { isAndroidBrowser } from '@/lib/mobileVideo'
import type { VideoItem, VideoLinkedDocument } from '@/lib/videoTypes'
import PortalStreamVideo from './PortalStreamVideo'
import VideoDateLabel from './VideoDateLabel'
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

const PLAYER_ALLOW =
  'accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen; web-share'

function playerEmbedSrc(libraryId: string, bunnyVideoId: string) {
  const params = new URLSearchParams({
    autoplay: 'true',
    playsinline: 'true',
    preload: 'true',
    compactControls: 'true',
    levelCap: 'true',
  })
  return `https://player.mediadelivery.net/embed/${libraryId}/${bunnyVideoId}?${params}`
}

type MobilePlayerMode = 'native' | 'embed'

export default function VideoModal({ video, onClose }: VideoModalProps) {
  const mobileCloseRef = useRef<HTMLButtonElement>(null)
  const desktopCloseRef = useRef<HTMLButtonElement>(null)
  const androidVideoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [android, setAndroid] = useState(false)
  const [mobilePlayerMode, setMobilePlayerMode] = useState<MobilePlayerMode>('embed')

  const posterUrl = useMemo(
    () => `/api/portal/video-thumbnail/${encodeURIComponent(video.bunnyVideoId)}`,
    [video.bunnyVideoId],
  )

  useEffect(() => {
    setAndroid(isAndroidBrowser())
  }, [])

  useEffect(() => {
    if (!android) return
    setMobilePlayerMode('native')
    setIsPlaying(true)
  }, [android])

  useEffect(() => {
    if (!isPlaying || mobilePlayerMode !== 'native') return
    const el = androidVideoRef.current
    if (!el) return
    void el.play().catch(() => undefined)
  }, [isPlaying, mobilePlayerMode])

  function startPlayback() {
    if (android) {
      setMobilePlayerMode('native')
      setIsPlaying(true)
      const el = androidVideoRef.current
      if (!el) return
      void el.play().catch(() => undefined)
      return
    }
    setMobilePlayerMode('embed')
    setIsPlaying(true)
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const compact = window.matchMedia('(max-width: 639px), (max-height: 520px)').matches
    ;(compact ? mobileCloseRef : desktopCloseRef).current?.focus()

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
  const embedSrc = playerEmbedSrc(video.libraryId, video.bunnyVideoId)
  const materials = video.linkedDocuments ?? []

  const androidNativeActive = isPlaying && mobilePlayerMode === 'native' && android

  return (
    <div
      className="portal-video-backdrop fixed inset-0 z-50 flex items-stretch justify-center bg-zinc-950/70 backdrop-blur-sm sm:items-center sm:p-4 md:p-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`portal-video-sheet flex h-dvh w-full max-w-5xl flex-col overflow-hidden bg-surface pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] shadow-2xl sm:h-auto sm:max-h-[min(92dvh,960px)] sm:overflow-y-auto sm:rounded-2xl sm:pr-0 sm:pl-0 ${
          androidNativeActive ? 'portal-video-android-player' : ''
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="portal-video-chrome flex shrink-0 items-center gap-2 border-b border-line bg-surface pt-[env(safe-area-inset-top)] pr-1 pl-3 sm:hidden">
          <p aria-hidden="true" className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
            {video.title}
          </p>
          <button
            ref={mobileCloseRef}
            type="button"
            onClick={onClose}
            aria-label="Close video"
            className="flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-zinc-100 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div
          className={`flex w-full items-center justify-center bg-black ${
            androidNativeActive ? 'min-h-0 h-full flex-1' : 'shrink-0'
          }`}
        >
          <div className="portal-video-frame bg-black">
            {android && (
              <PortalStreamVideo
                ref={androidVideoRef}
                videoId={video.bunnyVideoId}
                title={video.title}
                poster={posterUrl}
              />
            )}
            {isPlaying && mobilePlayerMode === 'embed' ? (
                <iframe
                  src={embedSrc}
                  title={video.title}
                  allow={PLAYER_ALLOW}
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="absolute inset-0 size-full border-0"
                />
            ) : null}
            {!isPlaying ? (
              <button
                type="button"
                onClick={startPlayback}
                className="group/player absolute inset-0 flex w-full touch-manipulation items-center justify-center"
                aria-label={`Play ${video.title}`}
              >
                <VideoPoster
                  video={video}
                  sizes="100vw"
                  priority
                  hidePlayOverlay
                  className="!absolute inset-0 !aspect-auto !h-full !w-full"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover/player:bg-black/30">
                  <span className="flex size-16 min-h-11 min-w-11 items-center justify-center rounded-full bg-white/95 text-violet-600 shadow-lg shadow-black/25 transition group-hover/player:scale-105">
                    <Play className="size-7 translate-x-0.5 fill-current" aria-hidden="true" />
                  </span>
                </span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="portal-video-details flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-none sm:overflow-visible sm:pb-0">
        <div className="flex items-start justify-between gap-4 p-4 sm:p-6">
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2 id={titleId} className="portal-video-heading text-lg font-semibold text-ink max-sm:sr-only sm:text-xl">
              {video.title}
            </h2>
            <p className="text-sm text-ink-muted sm:text-base">{video.description}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-subtle tabular-nums">
              <VideoDateLabel
                dateUploaded={video.dateUploaded}
                displayDate={video.displayDate}
                showIcon
              />
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden="true" />
                {video.duration}
              </span>
            </div>
          </div>
          <button
            ref={desktopCloseRef}
            type="button"
            onClick={onClose}
            aria-label="Close video"
            className="portal-video-close-desktop hidden size-11 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-line text-ink-muted transition-colors hover:bg-zinc-100 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 sm:flex"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {materials.length > 0 && (
          <section className="border-t border-line px-4 pt-4 pb-4 sm:px-6 sm:pb-6">
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
        <a href={doc.downloadHref} download={doc.fileName} className={primaryButton}>
          <Download className="size-4" aria-hidden="true" />
          Download
        </a>
      </div>
    </li>
  )
}
