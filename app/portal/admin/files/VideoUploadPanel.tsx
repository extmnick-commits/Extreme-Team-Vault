'use client'

import { useRef, useState } from 'react'
import { CheckCircle2, CloudUpload, ImagePlus, Loader2, X, XCircle } from 'lucide-react'
import {
  BUILTIN_VIDEO_CATEGORIES,
  THUMBNAIL_ACCEPT,
  VIDEO_ACCEPT,
  validateThumbnailFile,
  validateVideoFile,
  videoCategoryLabel,
  type CustomVideoCategory,
  type VideoCategory,
} from '@/lib/videoTypes'
import VideoThumbnailImage from '../../components/VideoThumbnailImage'
import { useStreamUpload } from './useStreamUpload'

type QueueStatus = 'pending' | 'uploading' | 'processing' | 'done' | 'error'

type QueueItem = {
  key: string
  file: File
  title: string
  thumbnail?: File
  thumbnailPreview?: string
  status: QueueStatus
  progress: number
  error?: string
}

function allUploadCategoryIds(customCategories: CustomVideoCategory[]): VideoCategory[] {
  return [...BUILTIN_VIDEO_CATEGORIES, ...customCategories.map((entry) => entry.id)]
}

export default function VideoUploadPanel({
  customCategories,
}: {
  customCategories: CustomVideoCategory[]
}) {
  const uploadVideo = useStreamUpload()
  const inputRef = useRef<HTMLInputElement>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [category, setCategory] = useState<VideoCategory>('training')
  const [dragging, setDragging] = useState(false)
  const [running, setRunning] = useState(false)

  function patch(key: string, changes: Partial<QueueItem>) {
    setQueue((items) => items.map((item) => (item.key === key ? { ...item, ...changes } : item)))
  }

  function revokePreview(preview?: string) {
    if (preview) URL.revokeObjectURL(preview)
  }

  function setThumbnail(key: string, file: File | null) {
    setQueue((items) =>
      items.map((item) => {
        if (item.key !== key) return item
        revokePreview(item.thumbnailPreview)
        if (!file) {
          return { ...item, thumbnail: undefined, thumbnailPreview: undefined }
        }
        const thumbnailError = validateThumbnailFile(file)
        if (thumbnailError) {
          return { ...item, thumbnail: undefined, thumbnailPreview: undefined, error: thumbnailError }
        }
        return {
          ...item,
          thumbnail: file,
          thumbnailPreview: URL.createObjectURL(file),
          error: item.error && validateVideoFile(item.file) ? item.error : undefined,
        }
      }),
    )
  }

  function removeFromQueue(key: string) {
    setQueue((items) => {
      const item = items.find((i) => i.key === key)
      revokePreview(item?.thumbnailPreview)
      return items.filter((i) => i.key !== key)
    })
  }

  function addFiles(files: FileList | null) {
    if (!files) return
    const added = Array.from(files).map<QueueItem>((file) => {
      const error = validateVideoFile(file)
      return {
        key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        title: '',
        status: error ? 'error' : 'pending',
        progress: 0,
        error,
      }
    })
    setQueue((items) => [...items, ...added])
  }

  async function uploadOne(item: QueueItem) {
    patch(item.key, { status: 'uploading', progress: 0, error: undefined })
    const title = item.title.trim() || item.file.name.replace(/\.[^.]+$/, '')
    try {
      await uploadVideo(
        item.file,
        { title, category, thumbnail: item.thumbnail },
        (progress) => patch(item.key, { progress }),
      )
      patch(item.key, { status: 'done', progress: 100 })
    } catch (error) {
      patch(item.key, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed.',
      })
    }
  }

  async function startUploads() {
    setRunning(true)
    for (const item of queue.filter((i) => i.status === 'pending')) {
      await uploadOne(item)
    }
    setRunning(false)
  }

  const pendingCount = queue.filter((i) => i.status === 'pending').length

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Upload videos</h2>
          <p className="text-sm text-ink-muted">
            MP4, MOV, or WebM, up to 5 GB each. Add an optional JPG, PNG, or WebP thumbnail per
            video for the training, archive, guest speaker, and event galleries.
          </p>
        </div>
        <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
          Add to
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as VideoCategory)}
            disabled={running}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm normal-case tracking-normal text-ink outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          >
            {allUploadCategoryIds(customCategories).map((id) => (
              <option key={id} value={id}>
                {videoCategoryLabel(id, customCategories)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          addFiles(e.dataTransfer.files)
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition ${
          dragging ? 'border-violet-500 bg-violet-50' : 'border-zinc-300 bg-zinc-50'
        }`}
      >
        <CloudUpload className="size-8 text-violet-400" aria-hidden="true" />
        <p className="text-sm text-ink-muted">
          Drag videos here, or{' '}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-medium text-violet-600 underline-offset-2 hover:underline"
          >
            browse
          </button>
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={VIDEO_ACCEPT}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {queue.length > 0 && (
        <ul className="flex flex-col gap-2">
          {queue.map((item) => (
            <li
              key={item.key}
              className="flex flex-col gap-3 rounded-lg border border-line bg-zinc-50 p-3 sm:flex-row sm:items-start"
            >
              {item.status === 'pending' && (
                <ThumbnailPicker
                  preview={item.thumbnailPreview}
                  disabled={running}
                  onPick={(file) => setThumbnail(item.key, file)}
                  onClear={() => setThumbnail(item.key, null)}
                />
              )}

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="truncate text-sm text-ink" title={item.file.name}>
                  {item.file.name}
                </span>
                {item.status === 'pending' ? (
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => patch(item.key, { title: e.target.value })}
                    disabled={running}
                    placeholder="Title (optional, defaults to file name)"
                    className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-ink placeholder-zinc-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                ) : (
                  (item.status === 'uploading' || item.status === 'processing') && (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
                      <div
                        className="h-full bg-violet-600 transition-[width]"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )
                )}
                {item.error && <p className="text-xs text-red-600">{item.error}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2 self-center text-xs text-ink-muted sm:self-start sm:pt-1">
                {item.status === 'uploading' && `${Math.round(item.progress)}%`}
                {item.status === 'done' && (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" /> Uploaded
                  </>
                )}
                {item.status === 'error' && (
                  <XCircle className="size-4 text-red-500" aria-label="Failed" />
                )}
                {(item.status === 'pending' || item.status === 'done' || item.status === 'error') && (
                  <button
                    type="button"
                    onClick={() => removeFromQueue(item.key)}
                    disabled={running}
                    aria-label={`Remove ${item.file.name}`}
                    className="rounded-md p-1 text-ink-subtle transition hover:bg-zinc-100 hover:text-ink"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {pendingCount > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={startUploads}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet-600/30 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Upload {pendingCount} {pendingCount === 1 ? 'video' : 'videos'}
          </button>
        </div>
      )}
    </section>
  )
}

function ThumbnailPicker({
  preview,
  disabled,
  onPick,
  onClear,
}: {
  preview?: string
  disabled: boolean
  onPick: (file: File) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-line bg-zinc-900 sm:w-36">
      {preview ? (
        <>
          <VideoThumbnailImage src={preview} alt="" />
          {!disabled && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Remove thumbnail"
              className="absolute top-1 right-1 rounded-md bg-black/60 p-1 text-white transition hover:bg-black/80"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </>
      ) : (
        <label
          className={`flex size-full cursor-pointer flex-col items-center justify-center gap-1 px-2 text-center text-xs text-ink-muted transition ${
            disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-violet-50 hover:text-violet-700'
          }`}
        >
          <ImagePlus className="size-5 text-violet-400" aria-hidden="true" />
          <span className="font-medium">Thumbnail</span>
          <span className="text-[10px] leading-tight text-ink-subtle">
            Optional · landscape or portrait
          </span>
          <input
            ref={inputRef}
            type="file"
            accept={THUMBNAIL_ACCEPT}
            disabled={disabled}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onPick(file)
              e.target.value = ''
            }}
          />
        </label>
      )}
    </div>
  )
}
