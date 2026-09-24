'use client'

import { useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  GripVertical,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import {
  ACCEPT_ATTRIBUTE,
  type GroupOption,
  type Library,
  type LibraryFile,
} from '@/lib/libraryTypes'
import { deleteFile, moveFile, replaceFile, updateFile } from './actions'
import { dndId } from './model'
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
import { useBlobUpload, validateFile } from './useBlobUpload'

export default function FileRow({
  library,
  file,
  groups,
  blobAccess,
  selected,
  onToggleSelect,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  reordering,
}: {
  library: Library
  file: LibraryFile
  groups: GroupOption[]
  blobAccess: 'public' | 'private'
  selected: boolean
  onToggleSelect: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  reordering: boolean
}) {
  const [title, setTitle] = useState(file.customTitle)
  const [description, setDescription] = useState(file.customDescription)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [replaceProgress, setReplaceProgress] = useState<number | null>(null)
  const replaceInput = useRef<HTMLInputElement>(null)
  const { pending, error, setError, run } = useAction()
  const uploadBlob = useBlobUpload(library, blobAccess)

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dndId('file', file.name) })

  const replacing = replaceProgress !== null
  const dirty = title !== file.customTitle || description !== file.customDescription
  const busy = pending || reordering || replacing

  async function replaceWith(next: File) {
    const invalid = validateFile(next, library)
    if (invalid) {
      setError(invalid)
      return
    }
    setError(null)
    setReplaceProgress(0)
    try {
      const blobUrl = await uploadBlob(next, setReplaceProgress)
      const result = await replaceFile({
        library,
        name: file.name,
        blobUrl,
        originalName: next.name,
      })
      if (!result.ok) setError(result.error)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Replace failed.')
    } finally {
      setReplaceProgress(null)
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex gap-3 bg-zinc-900/60 p-4 ${isDragging ? 'relative z-10 opacity-40' : ''} ${
        selected ? 'bg-violet-500/5' : ''
      }`}
    >
      <div className="flex shrink-0 flex-col items-center gap-2 pt-1">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none rounded p-0.5 text-zinc-500 hover:text-zinc-200 active:cursor-grabbing"
          aria-label={`Drag ${file.title}`}
        >
          <GripVertical className="size-4" />
        </button>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`Select ${file.title}`}
          className="size-4 accent-violet-500"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="rounded-full border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 font-medium text-zinc-300 tabular-nums">
              {file.fileType} · {file.fileSize}
            </span>
            <span className="truncate" title={file.name}>
              {file.name}
            </span>
            <a
              href={file.cdnUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-violet-300 hover:underline"
            >
              Open <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={file.title}
            disabled={busy}
            aria-label="Title"
            className={inputClass}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={file.description}
            disabled={busy}
            rows={2}
            aria-label="Description"
            className={`${inputClass} resize-y`}
          />
          {replacing && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-violet-500 transition-[width]"
                  style={{ width: `${replaceProgress}%` }}
                />
              </div>
              {replaceProgress < 100 ? `${Math.round(replaceProgress)}%` : 'Saving to Bunny…'}
            </div>
          )}
          <ErrorText error={error} />
          {dirty && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => run(() => updateFile(library, file.name, { title, description }))}
                disabled={busy}
                className={primaryButtonClass}
              >
                {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
                Save changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle(file.customTitle)
                  setDescription(file.customDescription)
                }}
                disabled={busy}
                className={ghostButtonClass}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1 lg:flex-col lg:items-end">
          <select
            value={file.sectionId ?? ''}
            onChange={(e) => run(() => moveFile(library, file.name, e.target.value || null))}
            disabled={busy}
            aria-label="Move to"
            className={`${selectClass} max-w-56`}
          >
            <option value="">Other</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <button type="button" onClick={onMoveUp} disabled={busy || !canMoveUp} className={iconButtonClass} aria-label="Move up">
              <ArrowUp className="size-4" />
            </button>
            <button type="button" onClick={onMoveDown} disabled={busy || !canMoveDown} className={iconButtonClass} aria-label="Move down">
              <ArrowDown className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => replaceInput.current?.click()}
              disabled={busy}
              className={iconButtonClass}
              aria-label={`Replace ${file.title}`}
              title="Replace file (keeps title, description, and position)"
            >
              {replacing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            </button>
            <input
              ref={replaceInput}
              type="file"
              accept={ACCEPT_ATTRIBUTE[library]}
              className="hidden"
              onChange={(e) => {
                const next = e.target.files?.[0]
                e.target.value = ''
                if (next) void replaceWith(next)
              }}
            />
            {confirmDelete ? (
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => run(() => deleteFile(library, file.name))}
                  disabled={busy}
                  className={dangerButtonClass}
                >
                  {pending && <Loader2 className="size-3 animate-spin" aria-hidden="true" />}
                  Delete file
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className={ghostButtonClass}>
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
                className={`${iconButtonClass} hover:text-red-300`}
                aria-label={`Delete ${file.title}`}
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}
