'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'
import { Clock, Play } from 'lucide-react'
import type { VideoItem } from '@/lib/mediaData'
import VideoModal from './VideoModal'

type VideoGalleryProps = {
  videos: VideoItem[]
}

export default function VideoGallery({ videos }: VideoGalleryProps) {
  const [selected, setSelected] = useState<VideoItem | null>(null)
  const handleClose = useCallback(() => setSelected(null), [])

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <li key={video.id}>
            <VideoCard video={video} onSelect={() => setSelected(video)} />
          </li>
        ))}
      </ul>

      {selected && <VideoModal video={selected} onClose={handleClose} />}
    </>
  )
}

function VideoCard({
  video,
  onSelect,
}: {
  video: VideoItem
  onSelect: () => void
}) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false)
  const thumbnailUrl = thumbnailFailed ? undefined : video.thumbnailUrl

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-linear-to-br from-zinc-800 via-zinc-900 to-zinc-950">
        {thumbnailUrl && (
          <Image
            src={thumbnailUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setThumbnailFailed(true)}
          />
        )}

        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
          <span className="flex size-12 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-sm transition-transform group-hover:scale-110">
            <Play className="size-5 translate-x-px fill-current" aria-hidden="true" />
          </span>
        </span>

        <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-zinc-100 tabular-nums">
          <Clock className="size-3" aria-hidden="true" />
          {video.duration}
        </span>
      </div>

      <div className="flex flex-col gap-1 p-4">
        <span className="font-medium text-zinc-100">{video.title}</span>
        <span className="line-clamp-2 text-sm text-zinc-500">
          {video.description}
        </span>
      </div>
    </button>
  )
}
