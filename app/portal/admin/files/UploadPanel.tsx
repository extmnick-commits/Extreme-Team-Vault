'use client'

import { useRef, useState } from 'react'
import { CheckCircle2, CloudUpload, Loader2, X, XCircle } from 'lucide-react'
import { ACCEPT_ATTRIBUTE, type GroupOption, type Library } from '@/lib/libraryTypes'
import DocumentCoverPicker from './DocumentCoverPicker'
import { postDocumentCoverBlob, postDocumentCoverFile } from './documentCoverClient'
import { finalizeUpload } from './actions'
import {
  applyManualCover,
  generateCoverFromPdfFile,
  usePdfCoverRevoke,
} from './usePdfCoverGeneration'
import { useBlobUpload, validateFile } from './useBlobUpload'

type QueueStatus = 'pending' | 'uploading' | 'processing' | 'done' | 'error'

type QueueItem = {
  key: string
  file: File
  title: string
  status: QueueStatus
  progress: number
  error?: string
  coverBlob?: Blob
  coverPreview?: string
  coverGenerating?: boolean
  coverWarning?: string
}

export default function UploadPanel({
  library,
  sections,
  blobAccess,
}: {
  library: Library
  sections: GroupOption[]
  blobAccess: 'public' | 'private'
}) {
  const uploadBlob = useBlobUpload(library, blobAccess)
  const inputRef = useRef<HTMLInputElement>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [sectionId, setSectionId] = useState<string>('')
  const [dragging, setDragging] = useState(false)
  const [running, setRunning] = useState(false)
  const revokePreview = usePdfCoverRevoke()
  const isDocuments = library === 'documents'

  function patch(key: string, changes: Partial<QueueItem>) {
    setQueue((items) => items.map((item) => (item.key === key ? { ...item, ...changes } : item)))
  }

  function startAutoCover(key: string, file: File) {
    void generateCoverFromPdfFile(file, revokePreview).then((cover) => {
      patch(key, {
        coverBlob: cover.blob,
        coverPreview: cover.preview,
        coverGenerating: false,
        coverWarning: cover.warning,
      })
    })
  }

  function addFiles(files: FileList | null) {
    if (!files) return
    const added = Array.from(files).map<QueueItem>((file) => {
      const error = validateFile(file, library)
      return {
        key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        title: '',
        status: error ? 'error' : 'pending',
        progress: 0,
        error,
        coverGenerating: isDocuments && !error,
      }
    })
    setQueue((items) => [...items, ...added])
    if (isDocuments) {
      for (const item of added) {
        if (item.status === 'pending') startAutoCover(item.key, item.file)
      }
    }
  }

  function clearCover(key: string) {
    setQueue((items) =>
      items.map((item) => {
        if (item.key !== key) return item
        revokePreview(item.coverPreview)
        return {
          ...item,
          coverBlob: undefined,
          coverPreview: undefined,
          coverWarning: undefined,
        }
      }),
    )
  }

  function setManualCover(key: string, file: File) {
    setQueue((items) =>
      items.map((item) => {
        if (item.key !== key) return item
        const cover = applyManualCover(file, revokePreview, item.coverPreview)
        return {
          ...item,
          coverBlob: cover.blob,
          coverPreview: cover.preview,
          coverGenerating: false,
          coverWarning: cover.warning,
        }
      }),
    )
  }

  function removeFromQueue(key: string) {
    setQueue((items) => {
      const item = items.find((i) => i.key === key)
      revokePreview(item?.coverPreview)
      return items.filter((i) => i.key !== key)
    })
  }

  async function uploadCover(pdfName: string, item: QueueItem) {
    if (!item.coverBlob) return
    const result =
      item.coverBlob instanceof File
        ? await postDocumentCoverFile(pdfName, item.coverBlob)
        : await postDocumentCoverBlob(pdfName, item.coverBlob)
    if (!result.ok) {
      patch(item.key, { coverWarning: result.error })
    }
  }

  async function uploadOne(item: QueueItem) {
    patch(item.key, { status: 'uploading', progress: 0, error: undefined })
    try {
      const blobUrl = await uploadBlob(item.file, (progress) => patch(item.key, { progress }))

      patch(item.key, { status: 'processing', progress: 100 })
      const result = await finalizeUpload({
        library,
        blobUrl,
        originalName: item.file.name,
        title: item.title,
        sectionId: sectionId || null,
      })

      if (result.ok) {
        if (isDocuments && item.coverBlob) {
          await uploadCover(result.name, item)
        }
        patch(item.key, { status: 'done' })
      } else {
        patch(item.key, { status: 'error', error: result.error })
      }
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
          <h2 className="text-lg font-semibold text-ink">Upload files</h2>
          <p className="text-sm text-ink-muted">
            {library === 'documents'
              ? 'PDF files up to 500 MB each. Page 1 is used for the cover preview automatically; you can replace it with your own image.'
              : 'MP3, M4A, or WAV files, up to 500 MB each.'}
          </p>
        </div>
        <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
          Add to
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={running}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm normal-case tracking-normal text-ink outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          >
            <option value="">Other</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
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
          Drag files here, or{' '}
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
          accept={ACCEPT_ATTRIBUTE[library]}
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
              {isDocuments && item.status === 'pending' && (
                <DocumentCoverPicker
                  preview={item.coverPreview}
                  generating={item.coverGenerating}
                  disabled={running}
                  onPick={(file) => setManualCover(item.key, file)}
                  onClear={() => clearCover(item.key)}
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
                {item.coverWarning && (
                  <p className="text-xs text-amber-700">{item.coverWarning}</p>
                )}
                {item.error && <p className="text-xs text-red-600">{item.error}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2 self-center text-xs text-ink-muted sm:self-start sm:pt-1">
                {item.status === 'uploading' && `${Math.round(item.progress)}%`}
                {item.status === 'processing' && (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Saving to Bunny…
                  </>
                )}
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
            disabled={running || queue.some((i) => i.status === 'pending' && i.coverGenerating)}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet-600/30 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Upload {pendingCount} {pendingCount === 1 ? 'file' : 'files'}
          </button>
        </div>
      )}
    </section>
  )
}
