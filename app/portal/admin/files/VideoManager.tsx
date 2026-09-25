'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Clock, Loader2, Trash2, Video } from 'lucide-react'
import {
  VIDEO_CATEGORIES,
  VIDEO_CATEGORY_LABELS,
  VIDEO_STATUS,
  videoStatusLabel,
  type AdminVideo,
  type VideoCategory,
  type VideoView,
} from '@/lib/videoTypes'
import { deleteVideo, moveVideo, updateVideo } from './videoActions'
import {
  ErrorText,
  dangerButtonClass,
  ghostButtonClass,
  iconButtonClass,
  inputClass,
  primaryButtonClass,
  selectClass,
  useAction,
} from './ui'

export default function VideoManager({ view }: { view: VideoView }) {
  const grouped = VIDEO_CATEGORIES.map((category) => ({
    category,
    videos: view.videos.filter((video) => video.category === category),
  }))
  const unassigned = view.videos.filter((video) => video.category === null)

  if (view.videos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
        <Video className="size-6 text-ink-subtle" aria-hidden="true" />
        <p className="font-medium text-ink">No videos yet</p>
        <p className="text-sm text-ink-subtle">Upload a video to Training or Archive to get started.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {grouped.map(({ category, videos }) => (
        <VideoGroup
          key={category}
          title={VIDEO_CATEGORY_LABELS[category]}
          emptyText={`No ${VIDEO_CATEGORY_LABELS[category].toLowerCase()} videos.`}
          videos={videos}
        />
      ))}
      {unassigned.length > 0 && (
        <VideoGroup title="Unassigned" emptyText="" videos={unassigned} />
      )}
    </div>
  )
}

function VideoGroup({
  title,
  emptyText,
  videos,
}: {
  title: string
  emptyText: string
  videos: AdminVideo[]
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <span className="text-xs text-ink-subtle tabular-nums">
          {videos.length} {videos.length === 1 ? 'video' : 'videos'}
        </span>
      </header>
      {videos.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-ink-subtle">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-line">
          {videos.map((video) => (
            <VideoRow key={video.id} video={video} />
          ))}
        </ul>
      )}
    </section>
  )
}

function VideoRow({ video }: { video: AdminVideo }) {
  const [title, setTitle] = useState(video.title)
  const [description, setDescription] = useState(video.description)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { pending, error, run } = useAction()
  const dirty = title !== video.title || description !== video.description
  const ready = video.status === VIDEO_STATUS.finished
  const encoding =
    video.status === VIDEO_STATUS.processing || video.status === VIDEO_STATUS.transcoding

  return (
    <li className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-zinc-100 lg:w-44">
        {video.thumbnailUrl && ready ? (
          <Image src={video.thumbnailUrl} alt="" fill sizes="176px" className="object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center">
            <Video className="size-6 text-violet-300" aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-subtle">
          <StatusBadge status={video.status} encodeProgress={video.encodeProgress} />
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Clock className="size-3" aria-hidden="true" />
            {video.duration}
          </span>
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          disabled={pending}
          aria-label="Title"
          className={inputClass}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          disabled={pending}
          rows={2}
          aria-label="Description"
          className={`${inputClass} resize-y`}
        />
        {encoding && (
          <p className="text-xs text-ink-muted">
            Encoding {Math.round(video.encodeProgress)}%. It will appear on the site when ready.
          </p>
        )}
        <ErrorText error={error} />
        {dirty && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => run(() => updateVideo({ videoId: video.id, title, description }))}
              disabled={pending}
              className={primaryButtonClass}
            >
              {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
              Save changes
            </button>
            <button
              type="button"
              onClick={() => {
                setTitle(video.title)
                setDescription(video.description)
              }}
              disabled={pending}
              className={ghostButtonClass}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1 lg:flex-col lg:items-end">
        <select
          value={video.category ?? ''}
          onChange={(e) => {
            const next = e.target.value
            if (next === 'training' || next === 'archive') {
              run(() => moveVideo(video.id, next))
            }
          }}
          disabled={pending}
          aria-label="Move to"
          className={`${selectClass} max-w-56`}
        >
          {!video.category && <option value="">Unassigned</option>}
          {VIDEO_CATEGORIES.map((category: VideoCategory) => (
            <option key={category} value={category}>
              {VIDEO_CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
        {confirmDelete ? (
          <span className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => run(() => deleteVideo(video.id))}
              disabled={pending}
              className={dangerButtonClass}
            >
              {pending && <Loader2 className="size-3 animate-spin" aria-hidden="true" />}
              Delete video
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className={ghostButtonClass}>
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={pending}
            className={`${iconButtonClass} hover:text-red-600`}
            aria-label={`Delete ${video.title}`}
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </li>
  )
}

function StatusBadge({ status, encodeProgress }: { status: number; encodeProgress: number }) {
  const ready = status === VIDEO_STATUS.finished
  const failed = status === VIDEO_STATUS.error || status === VIDEO_STATUS.uploadFailed
  const label =
    status === VIDEO_STATUS.processing || status === VIDEO_STATUS.transcoding
      ? `${videoStatusLabel(status)} ${Math.round(encodeProgress)}%`
      : videoStatusLabel(status)

  return (
    <span
      className={`rounded-full px-2 py-0.5 font-medium ${
        ready
          ? 'bg-emerald-50 text-emerald-700'
          : failed
            ? 'bg-red-50 text-red-700'
            : 'bg-amber-50 text-amber-800'
      }`}
    >
      {label}
    </span>
  )
}
