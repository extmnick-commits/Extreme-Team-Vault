'use client'

import { useRef, useState } from 'react'
import { CheckCircle2, CloudUpload, Loader2, X, XCircle } from 'lucide-react'
import { ACCEPT_ATTRIBUTE, type GroupOption, type Library } from '@/lib/libraryTypes'
import { finalizeUpload } from './actions'
import { useBlobUpload, validateFile } from './useBlobUpload'

type QueueStatus = 'pending' | 'uploading' | 'processing' | 'done' | 'error'

type QueueItem = {
  key: string
  file: File
  title: string
  status: QueueStatus
  progress: number
  error?: string
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

  function patch(key: string, changes: Partial<QueueItem>) {
    setQueue((items) => items.map((item) => (item.key === key ? { ...item, ...changes } : item)))
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
      }
    })
    setQueue((items) => [...items, ...added])
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
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Upload files</h2>
          <p className="text-sm text-zinc-500">
            {library === 'documents' ? 'PDF files' : 'MP3, M4A, or WAV files'}, up to 500 MB each.
          </p>
        </div>
        <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-400">
          Add to
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={running}
            className="rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm normal-case tracking-normal text-zinc-100 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/30"
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
          dragging ? 'border-violet-500 bg-violet-500/10' : 'border-zinc-700 bg-zinc-950/40'
        }`}
      >
        <CloudUpload className="size-8 text-zinc-500" aria-hidden="true" />
        <p className="text-sm text-zinc-400">
          Drag files here, or{' '}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-medium text-violet-300 underline-offset-2 hover:underline"
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
              className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="truncate text-sm text-zinc-300" title={item.file.name}>
                  {item.file.name}
                </span>
                {item.status === 'pending' ? (
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => patch(item.key, { title: e.target.value })}
                    disabled={running}
                    placeholder="Title (optional, defaults to file name)"
                    className="rounded-md border border-white/10 bg-zinc-800 px-2.5 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/30"
                  />
                ) : (
                  (item.status === 'uploading' || item.status === 'processing') && (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full bg-violet-500 transition-[width]"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )
                )}
                {item.error && <p className="text-xs text-red-300">{item.error}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs text-zinc-400">
                {item.status === 'uploading' && `${Math.round(item.progress)}%`}
                {item.status === 'processing' && (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Saving to Bunny…
                  </>
                )}
                {item.status === 'done' && (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-400" aria-hidden="true" /> Uploaded
                  </>
                )}
                {item.status === 'error' && (
                  <XCircle className="size-4 text-red-400" aria-label="Failed" />
                )}
                {(item.status === 'pending' || item.status === 'done' || item.status === 'error') && (
                  <button
                    type="button"
                    onClick={() => setQueue((items) => items.filter((i) => i.key !== item.key))}
                    disabled={running}
                    aria-label={`Remove ${item.file.name}`}
                    className="rounded-md p-1 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
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
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet-900/40 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Upload {pendingCount} {pendingCount === 1 ? 'file' : 'files'}
          </button>
        </div>
      )}
    </section>
  )
}
