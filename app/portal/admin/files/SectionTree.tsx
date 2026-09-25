'use client'

import { createContext, useContext, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  GripVertical,
  Loader2,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import {
  GROUP_LABELS,
  type GroupOption,
  type Library,
  type LibraryFile,
  type LibraryGroup,
} from '@/lib/libraryTypes'
import { createSection, deleteSection, moveSectionTo, updateSection } from './actions'
import FileRow from './FileRow'
import { UNSORTED, dndId, type OrderModel } from './model'
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

export type ManagerContextValue = {
  library: Library
  blobAccess: 'public' | 'private'
  model: OrderModel
  files: Map<string, LibraryFile>
  groups: Map<string, LibraryGroup>
  groupOptions: GroupOption[]
  selected: Set<string>
  toggleSelected: (names: string[], select: boolean) => void
  moveFileBy: (container: string, index: number, delta: number) => void
  moveSectionBy: (id: string, delta: number) => void
  reordering: boolean
  /** True while a section is being dragged; file lists are hidden so the tree is easy to target. */
  compact: boolean
}

export const ManagerContext = createContext<ManagerContextValue | null>(null)

function useManager(): ManagerContextValue {
  const value = useContext(ManagerContext)
  if (!value) throw new Error('useManager must be used inside ManagerContext')
  return value
}

// ---------------------------------------------------------------------------
// File lists
// ---------------------------------------------------------------------------

export function FileList({ container, emptyText }: { container: string; emptyText: string }) {
  const { library, blobAccess, model, files, groupOptions, selected, toggleSelected, moveFileBy, reordering } =
    useManager()
  const names = model.files[container] ?? []
  const { setNodeRef, isOver } = useDroppable({ id: dndId('files', container) })

  return (
    <SortableContext items={names.map((n) => dndId('file', n))} strategy={verticalListSortingStrategy}>
      <ul
        ref={setNodeRef}
        className={`divide-y divide-line overflow-hidden rounded-xl border bg-surface transition ${
          isOver ? 'border-violet-400' : 'border-line'
        } ${names.length === 0 ? 'border-dashed' : ''}`}
      >
        {names.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-ink-subtle">{emptyText}</li>
        )}
        {names.map((name, index) => {
          const file = files.get(name)
          if (!file) return null
          return (
            <FileRow
              key={`${file.name}:${file.customTitle}:${file.customDescription}:${file.sectionId}`}
              library={library}
              file={file}
              groups={groupOptions}
              blobAccess={blobAccess}
              selected={selected.has(name)}
              onToggleSelect={() => toggleSelected([name], !selected.has(name))}
              canMoveUp={index > 0}
              canMoveDown={index < names.length - 1}
              onMoveUp={() => moveFileBy(container, index, -1)}
              onMoveDown={() => moveFileBy(container, index, 1)}
              reordering={reordering}
            />
          )
        })}
      </ul>
    </SortableContext>
  )
}

function SelectAll({ names }: { names: string[] }) {
  const { selected, toggleSelected } = useManager()
  if (names.length === 0) return null
  const all = names.every((n) => selected.has(n))
  return (
    <label className="flex items-center gap-1.5 text-xs text-ink-subtle">
      <input
        type="checkbox"
        checked={all}
        onChange={() => toggleSelected(names, !all)}
        className="size-3.5 accent-violet-600"
      />
      Select all
    </label>
  )
}

export function UnsortedCard() {
  const { model, compact } = useManager()
  const names = model.files[UNSORTED] ?? []
  if (compact) return null
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Other <span className="font-normal text-ink-subtle">({names.length})</span>
        </h3>
        <SelectAll names={names} />
      </div>
      <FileList container={UNSORTED} emptyText="No unsorted files. Drag files here to remove them from a section." />
    </section>
  )
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export function SectionCard({ id, parentId }: { id: string; parentId: string | null }) {
  const { library, model, groups, moveSectionBy, reordering, compact } = useManager()
  const group = groups.get(id)
  const [collapsed, setCollapsed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { pending, error, run } = useAction()

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: dndId('section', id) })

  if (!group) return null

  const labels = GROUP_LABELS[library]
  const isParent = parentId === null
  const kindLabel = isParent ? labels.parent : labels.child
  const siblings = isParent ? model.topIds : (model.childIds[parentId] ?? [])
  const index = siblings.indexOf(id)
  const childIds = isParent ? (model.childIds[id] ?? []) : []
  const fileNames = model.files[id] ?? []
  const allNames = [...fileNames, ...childIds.flatMap((c) => model.files[c] ?? [])]
  const busy = pending || reordering

  const parentChoices = model.topIds.filter((top) => top !== id)
  const canNest = childIds.length === 0

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-col gap-3 rounded-2xl border p-4 transition ${
        isParent ? 'bg-surface shadow-sm' : 'bg-zinc-50'
      } ${isOver && !isDragging ? 'border-violet-400' : 'border-line'} ${
        isDragging ? 'relative z-20 opacity-50' : ''
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none rounded p-0.5 text-ink-subtle hover:text-ink active:cursor-grabbing"
          aria-label={`Drag ${group.name}`}
        >
          <GripVertical className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={iconButtonClass}
          aria-label={collapsed ? `Expand ${group.name}` : `Collapse ${group.name}`}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
        </button>

        {editing ? (
          <SectionEditForm group={group} onDone={() => setEditing(false)} />
        ) : (
          <div className="flex min-w-0 flex-col">
            <h3 className={`font-semibold text-ink ${isParent ? 'text-base' : 'text-sm'}`}>
              {group.name}{' '}
              <span className="text-xs font-normal text-ink-subtle">
                {kindLabel} · {allNames.length} {allNames.length === 1 ? 'file' : 'files'}
              </span>
            </h3>
            {group.description && <p className="text-sm text-ink-muted">{group.description}</p>}
          </div>
        )}

        {!editing && (
          <div className="ml-auto flex flex-wrap items-center gap-1">
            {busy && <Loader2 className="size-4 animate-spin text-ink-subtle" aria-hidden="true" />}
            <SelectAll names={allNames} />
            <select
              value={parentId ?? ''}
              onChange={(e) => run(() => moveSectionTo(library, id, e.target.value || null))}
              disabled={busy}
              aria-label={`Move ${group.name} to`}
              className={`${selectClass} max-w-44 text-xs`}
            >
              <option value="">Top level</option>
              {parentChoices.map((top) => (
                <option key={top} value={top} disabled={!canNest}>
                  Inside {groups.get(top)?.name ?? top}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => moveSectionBy(id, -1)}
              disabled={busy || index <= 0}
              className={iconButtonClass}
              aria-label={`Move ${group.name} up`}
            >
              <ArrowUp className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => moveSectionBy(id, 1)}
              disabled={busy || index < 0 || index >= siblings.length - 1}
              className={iconButtonClass}
              aria-label={`Move ${group.name} down`}
            >
              <ArrowDown className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={iconButtonClass}
              aria-label={`Edit ${group.name}`}
            >
              <Pencil className="size-4" />
            </button>
            {confirmDelete ? (
              <span className="flex items-center gap-1 text-xs text-ink-muted">
                {isParent && childIds.length > 0
                  ? `Delete? Its ${labels.childPlural.toLowerCase()} move to top level, files to Other.`
                  : 'Delete? Files move to Other.'}
                <button
                  type="button"
                  onClick={() => run(() => deleteSection(library, id))}
                  disabled={busy}
                  className={dangerButtonClass}
                >
                  Delete
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className={ghostButtonClass}>
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className={`${iconButtonClass} hover:text-red-600`}
                aria-label={`Delete ${group.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <ErrorText error={error} />

      {!collapsed && (
        <>
          {isParent && <ChildList parentId={id} childIds={childIds} />}
          {!compact && (
            <FileList
              container={id}
              emptyText={
                isParent && childIds.length > 0
                  ? `Drag files here to keep them directly in this ${kindLabel.toLowerCase()}.`
                  : `No files in this ${kindLabel.toLowerCase()} yet. Drag files here.`
              }
            />
          )}
        </>
      )}
    </section>
  )
}

function ChildList({ parentId, childIds }: { parentId: string; childIds: string[] }) {
  const { library } = useManager()
  const { setNodeRef, isOver } = useDroppable({ id: dndId('children', parentId) })
  const childLabel = GROUP_LABELS[library].child

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-3 rounded-xl pl-4 transition ${
        isOver ? 'outline-2 outline-offset-4 outline-violet-400 outline-dashed' : ''
      }`}
    >
      <SortableContext items={childIds.map((c) => dndId('section', c))} strategy={verticalListSortingStrategy}>
        {childIds.map((childId) => (
          <SectionCard key={childId} id={childId} parentId={parentId} />
        ))}
      </SortableContext>
      <NewSectionForm parentId={parentId} label={`New ${childLabel.toLowerCase()}`} compact />
    </div>
  )
}

function SectionEditForm({ group, onDone }: { group: LibraryGroup; onDone: () => void }) {
  const { library } = useManager()
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description)
  const { pending, error, run } = useAction()

  return (
    <form
      className="flex w-full max-w-xl flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        run(() => updateSection(library, group.id, { name, description }), onDone)
      }}
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={pending}
        aria-label="Name"
        className={inputClass}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={pending}
        rows={2}
        placeholder="Description (optional)"
        aria-label="Description"
        className={`${inputClass} resize-y`}
      />
      <ErrorText error={error} />
      <div className="flex gap-2">
        <button type="submit" disabled={pending || !name.trim()} className={primaryButtonClass}>
          {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
          Save
        </button>
        <button type="button" onClick={onDone} className={ghostButtonClass}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export function NewSectionForm({
  parentId,
  label,
  compact = false,
}: {
  parentId: string | null
  label: string
  compact?: boolean
}) {
  const { library } = useManager()
  const labels = GROUP_LABELS[library]
  const kindName = parentId === null ? labels.parent : labels.child
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const { pending, error, run } = useAction()

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? 'inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50'
            : 'inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink shadow-sm transition hover:bg-zinc-50'
        }
      >
        <FolderPlus className={compact ? 'size-3.5' : 'size-4'} aria-hidden="true" />
        {label}
      </button>
    )
  }

  return (
    <form
      className="flex flex-col gap-1.5"
      onSubmit={(e) => {
        e.preventDefault()
        run(
          () => createSection(library, name, parentId),
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
          placeholder={`${kindName} name`}
          disabled={pending}
          className={`${inputClass} sm:w-64`}
        />
        <button type="submit" disabled={pending || !name.trim()} className={iconButtonClass} aria-label={`Create ${label}`}>
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
