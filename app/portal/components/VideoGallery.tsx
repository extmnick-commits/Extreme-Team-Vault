'use client'

import { useCallback, useMemo, useState } from 'react'
import { Play, Search, X } from 'lucide-react'
import type { VideoItem } from '@/lib/videoTypes'
import VideoModal from './VideoModal'
import VideoPoster from './VideoPoster'

type VideoGalleryProps = {
  videos: VideoItem[]
}

export default function VideoGallery({ videos }: VideoGalleryProps) {
  const [selected, setSelected] = useState<VideoItem | null>(null)
  const [query, setQuery] = useState('')
  const handleClose = useCallback(() => setSelected(null), [])

  const trimmed = query.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      trimmed
        ? videos.filter((v) =>
            `${v.title} ${v.description}`.toLowerCase().includes(trimmed),
          )
        : videos,
    [videos, trimmed],
  )

  const featured = trimmed ? undefined : filtered[0]
  const rest = featured ? filtered.slice(1) : filtered

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative w-full sm:max-w-xs">
          <span className="sr-only">Search videos</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-subtle"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos"
            className="h-11 w-full rounded-xl border border-line bg-surface pr-10 pl-10 text-sm text-ink shadow-sm outline-none placeholder:text-ink-subtle focus:border-violet-300 focus:ring-4 focus:ring-violet-100 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-subtle hover:bg-zinc-100 hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </label>
        <span className="text-sm text-ink-subtle tabular-nums">
          {filtered.length} {filtered.length === 1 ? 'video' : 'videos'}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
          <Search className="size-6 text-ink-subtle" aria-hidden="true" />
          <p className="font-medium text-ink">No videos match “{query}”</p>
          <p className="text-sm text-ink-subtle">Try a different word or clear the search.</p>
        </div>
      ) : (
        <>
          {featured && (
            <FeaturedCard video={featured} onSelect={() => setSelected(featured)} />
          )}
          {rest.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {rest.map((video) => (
                <li key={video.id}>
                  <VideoCard video={video} onSelect={() => setSelected(video)} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {selected && (
        <VideoModal key={selected.id} video={selected} onClose={handleClose} />
      )}
    </div>
  )
}

const cardBase =
  'group w-full overflow-hidden rounded-2xl border border-line bg-surface text-left shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 max-md:active:scale-[0.99] md:hover:-translate-y-0.5 md:hover:border-zinc-300 md:hover:shadow-md'

function FeaturedCard({
  video,
  onSelect,
}: {
  video: VideoItem
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${cardBase} flex flex-col md:grid md:grid-cols-[3fr_2fr]`}
    >
      <VideoPoster
        video={video}
        sizes="(min-width: 768px) 60vw, 100vw"
        large
        priority
        showDuration
      />
      <div className="flex flex-col gap-2 p-4 sm:p-5 md:justify-center md:gap-3 md:p-8">
        <span className="w-fit rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-violet-100">
          Featured
        </span>
        <span className="text-base font-semibold text-ink md:text-2xl md:tracking-tight">
          {video.title}
        </span>
        <span className="line-clamp-2 text-sm text-ink-muted md:line-clamp-3 md:text-base">
          {video.description}
        </span>
        <span className="mt-2 inline-flex w-fit min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-600/30 transition group-hover:bg-violet-700">
          <Play className="size-4 fill-current" aria-hidden="true" />
          Watch now
        </span>
      </div>
    </button>
  )
}

function VideoCard({
  video,
  onSelect,
}: {
  video: VideoItem
  onSelect: () => void
}) {
  return (
    <button type="button" onClick={onSelect} className={`${cardBase} flex h-full flex-col`}>
      <VideoPoster
        video={video}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        showDuration
      />
      <div className="flex flex-col gap-1.5 p-4">
        <span className="line-clamp-2 font-semibold text-ink">{video.title}</span>
        <span className="line-clamp-2 text-sm text-ink-muted">{video.description}</span>
      </div>
    </button>
  )
}
