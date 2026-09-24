'use client'

import { useState, useTransition } from 'react'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  FolderPlus,
  Loader2,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import type {
  ActionResult,
  Library,
  LibraryFile,
  LibraryView,
} from '@/lib/libraryTypes'
import {
  createSection,
  deleteFile,
  deleteSection,
  moveFile,
  moveSection,
  renameSection,
  reorderFiles,
  updateFile,
} from './actions'

type SectionOption = { id: string; name: string }

const inputClass =
  'w-full rounded-md border border-white/10 bg-zinc-800 px-2.5 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50'

const iconButtonClass =
  'rounded-md p-1.5 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30'

function useAction() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function run(action: () => Promise<ActionResult>, onSuccess?: () => void) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result.ok) onSuccess?.()
      else setError(result.error)
    })
  }

  return { pending, error, run }
}

function ErrorText({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-300">
      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
      {error}
    </p>
  )
}

export default function FileManager({
  library,
  view,
}: {
  library: Library
  view: LibraryView
}) {
  const sectionOptions: SectionOption[] = view.sections.map(({ id, name }) => ({ id, name }))
  const totalFiles =
    view.unsorted.length + view.sections.reduce((sum, s) => sum + s.files.length, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Library</h2>
          <p className="text-sm text-zinc-500">
            {totalFiles} {totalFiles === 1 ? 'file' : 'files'} in {view.sections.length}{' '}
            {view.sections.length === 1 ? 'section' : 'sections'}. Changes appear for the team
            right away.
          </p>
        </div>
        <NewSectionForm library={library} />
      </div>

      {view.sections.map((section, index) => (
        <SectionCard
          key={section.id}
          library={library}
          sectionId={section.id}
          name={section.name}
          files={section.files}
          sections={sectionOptions}
          isFirst={index === 0}
          isLast={index === view.sections.length - 1}
        />
      ))}

      <SectionCard
        library={library}
        sectionId={null}
        name="Other"
        files={view.unsorted}
        sections={sectionOptions}
        isFirst
        isLast
      />
    </div>
  )
}

function NewSectionForm({ library }: { library: Library }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const { pending, error, run } = useAction()

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
      >
        <FolderPlus className="size-4" aria-hidden="true" />
        New section
      </button>
    )
  }

  return (
    <form
      className="flex flex-col gap-1.5"
      onSubmit={(e) => {
        e.preventDefault()
        run(
          () => createSection(library, name),
          () => {
            setName('')
            setOpen(false)
          },
        )
      }}
    >
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Section name, e.g. Scripts"
          disabled={pending}
          className={`${inputClass} sm:w-64`}
        />
        <button type="submit" disabled={pending || !name.trim()} className={iconButtonClass} aria-label="Create section">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={iconButtonClass} aria-label="Cancel">
          <X className="size-4" />
        </button>
      </div>
      <ErrorText error={error} />
    </form>
  )
}

function SectionCard({
  library,
  sectionId,
  name,
  files,
  sections,
  isFirst,
  isLast,
}: {
  library: Library
  sectionId: string | null
  name: string
  files: LibraryFile[]
  sections: SectionOption[]
  isFirst: boolean
  isLast: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(name)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { pending, error, run } = useAction()
  const reorder = useAction()

  function moveFileBy(index: number, delta: number) {
    const names = files.map((f) => f.name)
    const target = index + delta
    if (target < 0 || target >= names.length) return
    ;[names[index], names[target]] = [names[target], names[index]]
    reorder.run(() => reorderFiles(library, sectionId, names))
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {editing && sectionId ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              run(() => renameSection(library, sectionId, draftName), () => setEditing(false))
            }}
          >
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              disabled={pending}
              className={`${inputClass} w-56`}
            />
            <button type="submit" disabled={pending || !draftName.trim()} className={iconButtonClass} aria-label="Save section name">
              <Check className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftName(name)
                setEditing(false)
              }}
              className={iconButtonClass}
              aria-label="Cancel rename"
            >
              <X className="size-4" />
            </button>
          </form>
        ) : (
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            {name} <span className="font-normal text-zinc-600">({files.length})</span>
          </h3>
        )}

        {sectionId && !editing && (
          <div className="ml-auto flex items-center gap-1">
            {(pending || reorder.pending) && (
              <Loader2 className="size-4 animate-spin text-zinc-500" aria-hidden="true" />
            )}
            <button
              type="button"
              onClick={() => run(() => moveSection(library, sectionId, 'up'))}
              disabled={pending || isFirst}
              className={iconButtonClass}
              aria-label={`Move ${name} section up`}
            >
              <ArrowUp className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => run(() => moveSection(library, sectionId, 'down'))}
              disabled={pending || isLast}
              className={iconButtonClass}
              aria-label={`Move ${name} section down`}
            >
              <ArrowDown className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={iconButtonClass}
              aria-label={`Rename ${name} section`}
            >
              <Pencil className="size-4" />
            </button>
            {confirmDelete ? (
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                Delete section? Files move to Other.
                <button
                  type="button"
                  onClick={() => run(() => deleteSection(library, sectionId))}
                  disabled={pending}
                  className="rounded-md bg-red-600/80 px-2 py-1 font-medium text-white hover:bg-red-500"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-md px-2 py-1 text-zinc-300 hover:bg-white/5"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className={iconButtonClass}
                aria-label={`Delete ${name} section`}
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        )}
        {!sectionId && reorder.pending && (
          <Loader2 className="ml-auto size-4 animate-spin text-zinc-500" aria-hidden="true" />
        )}
      </div>

      <ErrorText error={error ?? reorder.error} />

      {files.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-600">
          {sectionId ? 'No files in this section yet.' : 'No unsorted files.'}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
          {files.map((file, index) => (
            <FileRow
              key={`${file.name}:${file.customTitle}:${file.customDescription}:${file.sectionId}`}
              library={library}
              file={file}
              sections={sections}
              canMoveUp={index > 0}
              canMoveDown={index < files.length - 1}
              reordering={reorder.pending}
              onMoveUp={() => moveFileBy(index, -1)}
              onMoveDown={() => moveFileBy(index, 1)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function FileRow({
  library,
  file,
  sections,
  canMoveUp,
  canMoveDown,
  reordering,
  onMoveUp,
  onMoveDown,
}: {
  library: Library
  file: LibraryFile
  sections: SectionOption[]
  canMoveUp: boolean
  canMoveDown: boolean
  reordering: boolean
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [title, setTitle] = useState(file.customTitle)
  const [description, setDescription] = useState(file.customDescription)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { pending, error, run } = useAction()

  const dirty = title !== file.customTitle || description !== file.customDescription
  const busy = pending || reordering

  return (
    <li className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start">
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
        <ErrorText error={error} />
        {dirty && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => run(() => updateFile(library, file.name, { title, description }))}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
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
              className="rounded-md px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
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
          aria-label="Section"
          className="rounded-md border border-white/10 bg-zinc-800 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
        >
          <option value="">Other</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
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
          {confirmDelete ? (
            <span className="flex items-center gap-1 text-xs text-zinc-400">
              <button
                type="button"
                onClick={() => run(() => deleteFile(library, file.name))}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-md bg-red-600/80 px-2 py-1 font-medium text-white hover:bg-red-500"
              >
                {pending && <Loader2 className="size-3 animate-spin" aria-hidden="true" />}
                Delete file
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-md px-2 py-1 text-zinc-300 hover:bg-white/5"
              >
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
    </li>
  )
}
