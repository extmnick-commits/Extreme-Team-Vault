'use client'

import { useState } from 'react'
import { Clock, ImagePlus, Loader2, Trash2, Video } from 'lucide-react'
import VideoPoster from '../../components/VideoPoster'
import {
  BUILTIN_VIDEO_CATEGORIES,
  THUMBNAIL_ACCEPT,
  VIDEO_STATUS,
  validateThumbnailFile,
  videoCategoryLabel,
  videoStatusLabel,
  type AdminVideo,
  type CustomVideoCategory,
  type VideoCategory,
  type VideoView,
} from '@/lib/videoTypes'
import { deleteVideo, moveVideo, updateVideo, uploadVideoThumbnail } from './videoActions'
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

function allManagerCategoryIds(customCategories: CustomVideoCategory[]): VideoCategory[] {
  return [...BUILTIN_VIDEO_CATEGORIES, ...customCategories.map((entry) => entry.id)]
}

export default function VideoManager({
  view,
  customCategories,
}: {
  view: VideoView
  customCategories: CustomVideoCategory[]
}) {
  const categoryIds = allManagerCategoryIds(customCategories)
  const grouped = categoryIds.map((category) => ({
    category,
    videos: view.videos.filter((video) => video.category === category),
  }))
  const unassigned = view.videos.filter((video) => video.category === null)

  if (view.videos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
        <Video className="size-6 text-ink-subtle" aria-hidden="true" />
        <p className="font-medium text-ink">No videos yet</p>
        <p className="text-sm text-ink-subtle">Upload a video and choose a category to get started.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {grouped.map(({ category, videos }) => (
        <VideoGroup
          key={category}
          title={videoCategoryLabel(category, customCategories)}
          emptyText={`No ${videoCategoryLabel(category, customCategories).toLowerCase()} videos.`}
          videos={videos}
          customCategories={customCategories}
          categoryIds={categoryIds}
        />
      ))}
      {unassigned.length > 0 && (
        <VideoGroup
          title="Unassigned"
          emptyText=""
          videos={unassigned}
          customCategories={customCategories}
          categoryIds={categoryIds}
        />
      )}
    </div>
  )
}

function VideoGroup({
  title,
  emptyText,
  videos,
  customCategories,
  categoryIds,
}: {
  title: string
  emptyText: string
  videos: AdminVideo[]
  customCategories: CustomVideoCategory[]
  categoryIds: VideoCategory[]
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
            <VideoRow
              key={video.id}
              video={video}
              customCategories={customCategories}
              categoryIds={categoryIds}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function VideoRow({
  video,
  customCategories,
  categoryIds,
}: {
  video: AdminVideo
  customCategories: CustomVideoCategory[]
  categoryIds: VideoCategory[]
}) {
  const [title, setTitle] = useState(video.title)
  const [description, setDescription] = useState(video.description)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [thumbnailVersion, setThumbnailVersion] = useState(0)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const { pending, error, run, setError } = useAction()
  const dirty = title !== video.title || description !== video.description
  const encoding =
    video.status === VIDEO_STATUS.processing || video.status === VIDEO_STATUS.transcoding
  const posterVideo = {
    title: video.title,
    libraryId: video.libraryId,
    bunnyVideoId: video.bunnyVideoId,
    thumbnailFileName: video.thumbnailFileName,
    thumbnailUrl: video.thumbnailUrl
      ? `${video.thumbnailUrl}?v=${thumbnailVersion}`
      : undefined,
  }

  function uploadThumbnail(file: File) {
    const validationError = validateThumbnailFile(file)
    if (validationError) {
      setError(validationError)
      return
    }
    if (localPreview) URL.revokeObjectURL(localPreview)
    const preview = URL.createObjectURL(file)
    setLocalPreview(preview)

    const formData = new FormData()
    formData.set('videoId', video.id)
    formData.set('thumbnail', file)
    run(
      () => uploadVideoThumbnail(formData),
      () => {
        URL.revokeObjectURL(preview)
        setLocalPreview(null)
        setThumbnailVersion((version) => version + 1)
      },
      () => {
        URL.revokeObjectURL(preview)
        setLocalPreview(null)
      },
    )
  }

  return (
    <li className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-zinc-100 lg:w-44">
        {localPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={localPreview} alt="" className="size-full object-cover" />
        ) : (
          <VideoPoster video={posterVideo} sizes="176px" hidePlayOverlay className="h-full" />
        )}
        <label
          className={`absolute inset-x-0 bottom-0 z-10 flex cursor-pointer items-center justify-center gap-1.5 bg-black/55 px-2 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition ${
            pending ? 'cursor-not-allowed opacity-60' : 'hover:bg-black/70'
          }`}
        >
          <ImagePlus className="size-3.5" aria-hidden="true" />
          {localPreview || video.thumbnailUrl ? 'Change thumbnail' : 'Add thumbnail'}
          <input
            type="file"
            accept={THUMBNAIL_ACCEPT}
            disabled={pending}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) uploadThumbnail(file)
              e.target.value = ''
            }}
          />
        </label>
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
            if (next && categoryIds.includes(next)) {
              run(() => moveVideo(video.id, next))
            }
          }}
          disabled={pending}
          aria-label="Move to"
          className={`${selectClass} max-w-56`}
        >
          {!video.category && <option value="">Unassigned</option>}
          {categoryIds.map((category) => (
            <option key={category} value={category}>
              {videoCategoryLabel(category, customCategories)}
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
