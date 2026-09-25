'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Clock, Play, Video } from 'lucide-react'
import { bunnyStreamThumbnailCandidates, type VideoItem } from '@/lib/videoTypes'

type VideoPosterProps = {
  video: Pick<
    VideoItem,
    'title' | 'libraryId' | 'bunnyVideoId' | 'thumbnailUrl' | 'thumbnailFileName'
  > & { duration?: string }
  sizes: string
  large?: boolean
  priority?: boolean
  /** When set, skips the built-in play overlay (e.g. modal supplies its own control). */
  hidePlayOverlay?: boolean
  showDuration?: boolean
  className?: string
}

export default function VideoPoster({
  video,
  sizes,
  large = false,
  priority = false,
  hidePlayOverlay = false,
  showDuration = false,
  className = '',
}: VideoPosterProps) {
  const { libraryId, bunnyVideoId, thumbnailUrl, thumbnailFileName, title } = video
  const candidates = useMemo(
    () =>
      bunnyStreamThumbnailCandidates({
        libraryId,
        bunnyVideoId,
        thumbnailUrl,
        thumbnailFileName,
      }),
    [libraryId, bunnyVideoId, thumbnailUrl, thumbnailFileName],
  )
  const [index, setIndex] = useState(0)
  const [useNativeImg, setUseNativeImg] = useState(false)

  const src = candidates[index]
  const hasImage = Boolean(src && index < candidates.length)

  function handleError() {
    if (index + 1 < candidates.length) {
      setIndex((i) => i + 1)
      setUseNativeImg(false)
      return
    }
    if (!useNativeImg && src) {
      setUseNativeImg(true)
      return
    }
    setIndex(candidates.length)
  }

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden bg-linear-to-br from-violet-100 via-violet-50 to-sky-100 ${
        large ? 'md:aspect-auto md:h-full md:min-h-80' : ''
      } ${className}`}
    >
      {hasImage ? (
        useNativeImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03] max-md:group-hover:scale-100"
            onError={handleError}
          />
        ) : (
          <Image
            src={src!}
            alt=""
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03] max-md:group-hover:scale-100"
            onError={handleError}
          />
        )
      ) : (
        <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-3 pr-20">
          <Video className="size-4 shrink-0 text-violet-400" aria-hidden="true" />
          <span className="truncate text-xs font-medium text-violet-900/70">{title}</span>
        </span>
      )}

      {hasImage && (
        <span className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/50 to-transparent" />
      )}

      {!hidePlayOverlay && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span
            className={`flex items-center justify-center rounded-full bg-white/95 text-violet-600 shadow-lg shadow-black/20 transition duration-200 ${
              hasImage
                ? 'opacity-90 [@media(hover:hover)]:group-hover:scale-110 [@media(hover:hover)]:group-hover:opacity-100'
                : ''
            } ${large ? 'size-16' : 'size-12'}`}
          >
            <Play
              className={`translate-x-0.5 fill-current ${large ? 'size-6' : 'size-5'}`}
              aria-hidden="true"
            />
          </span>
        </span>
      )}

      {showDuration && video.duration && (
        <span className="absolute right-2.5 bottom-2.5 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white tabular-nums backdrop-blur-sm">
          <Clock className="size-3" aria-hidden="true" />
          {video.duration}
        </span>
      )}
    </div>
  )
}
