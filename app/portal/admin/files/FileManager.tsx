'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { FileText, Folder, Loader2 } from 'lucide-react'
import {
  GROUP_LABELS,
  countLibraryFiles,
  groupOptions as toGroupOptions,
  type ActionResult,
  type Library,
  type LibraryView,
} from '@/lib/libraryTypes'
import { reorderFiles, reorderSections } from './actions'
import BulkBar from './BulkBar'
import {
  containerOfFile,
  containerToSectionId,
  dndId,
  indexView,
  modelFromView,
  parentOfSection,
  parseDndId,
  type OrderModel,
} from './model'
import {
  ManagerContext,
  NewSectionForm,
  SectionCard,
  UnsortedCard,
  type ManagerContextValue,
} from './SectionTree'
import { ErrorText, useAction } from './ui'

function withSectionList(
  model: OrderModel,
  parentId: string | null,
  ids: string[],
): OrderModel {
  return parentId === null
    ? { ...model, topIds: ids }
    : { ...model, childIds: { ...model.childIds, [parentId]: ids } }
}

function sectionList(model: OrderModel, parentId: string | null): string[] {
  return parentId === null ? model.topIds : (model.childIds[parentId] ?? [])
}

export default function FileManager({
  library,
  view,
  blobAccess,
}: {
  library: Library
  view: LibraryView
  blobAccess: 'public' | 'private'
}) {
  const [prevView, setPrevView] = useState(view)
  const [model, setModel] = useState(() => modelFromView(view))
  if (view !== prevView) {
    setPrevView(view)
    setModel(modelFromView(view))
  }

  const { groups, files } = useMemo(() => indexView(view), [view])
  const groupOptions = useMemo(() => toGroupOptions(view), [view])
  const [rawSelected, setRawSelected] = useState<Set<string>>(() => new Set())
  const selected = useMemo(
    () => new Set([...rawSelected].filter((name) => files.has(name))),
    [rawSelected, files],
  )

  const reorder = useAction()
  const [activeId, setActiveId] = useState<string | null>(null)
  const snapshot = useRef<OrderModel | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const labels = GROUP_LABELS[library]
  const totalFiles = countLibraryFiles(view)
  const activeKind = activeId ? parseDndId(activeId).kind : null

  function commit(next: OrderModel, action: () => Promise<ActionResult>) {
    setModel(next)
    reorder.run(action, undefined, () => setModel(modelFromView(view)))
  }

  const toggleSelected = useCallback((names: string[], select: boolean) => {
    setRawSelected((current) => {
      const next = new Set(current)
      for (const name of names) {
        if (select) next.add(name)
        else next.delete(name)
      }
      return next
    })
  }, [])

  function moveFileBy(container: string, index: number, delta: number) {
    const target = index + delta
    const names = [...(model.files[container] ?? [])]
    if (target < 0 || target >= names.length) return
    const next = arrayMove(names, index, target)
    commit({ ...model, files: { ...model.files, [container]: next } }, () =>
      reorderFiles(library, containerToSectionId(container), next),
    )
  }

  function moveSectionBy(id: string, delta: number) {
    const parent = parentOfSection(model, id)
    if (parent === undefined) return
    const list = sectionList(model, parent)
    const index = list.indexOf(id)
    const target = index + delta
    if (index < 0 || target < 0 || target >= list.length) return
    const next = arrayMove(list, index, target)
    commit(withSectionList(model, parent, next), () => reorderSections(library, parent, next))
  }

  // Only lets files hit file targets and sections hit section targets, and
  // prefers the smallest droppable under the pointer (a row over its list,
  // an album over its category).
  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      const { kind, value } = parseDndId(args.active.id)
      const accepted = kind === 'file' ? ['file', 'files'] : ['section', 'children']
      const ownChildren = new Set(
        kind === 'section'
          ? [dndId('children', value), ...(model.childIds[value] ?? []).map((c) => dndId('section', c))]
          : [],
      )
      const droppableContainers = args.droppableContainers.filter(
        (c) => accepted.includes(parseDndId(c.id).kind) && !ownChildren.has(String(c.id)),
      )
      const filtered = { ...args, droppableContainers }
      const hits = pointerWithin(filtered)
      if (hits.length === 0) return closestCenter(filtered)

      const area = (id: string | number) => {
        const rect = args.droppableRects.get(id)
        return rect ? rect.width * rect.height : Number.POSITIVE_INFINITY
      }
      return [...hits].sort((a, b) => area(a.id) - area(b.id))
    },
    [model.childIds],
  )

  function handleDragStart({ active }: DragStartEvent) {
    snapshot.current = model
    reorder.setError(null)
    setActiveId(String(active.id))
  }

  function handleDragCancel() {
    if (snapshot.current) setModel(snapshot.current)
    snapshot.current = null
    setActiveId(null)
  }

  // Moves a dragged file into the list it is hovering so the drop preview is live.
  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    const a = parseDndId(active.id)
    const o = parseDndId(over.id)
    if (a.kind !== 'file') return

    const from = containerOfFile(model, a.value)
    const to = o.kind === 'file' ? containerOfFile(model, o.value) : o.kind === 'files' ? o.value : undefined
    if (!from || !to || from === to) return

    const fromList = model.files[from].filter((n) => n !== a.value)
    const toList = [...(model.files[to] ?? [])]
    const overIndex = o.kind === 'file' ? toList.indexOf(o.value) : -1
    toList.splice(overIndex < 0 ? toList.length : overIndex, 0, a.value)
    setModel({ ...model, files: { ...model.files, [from]: fromList, [to]: toList } })
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const before = snapshot.current ?? model
    snapshot.current = null
    setActiveId(null)
    if (!over) {
      setModel(before)
      return
    }

    const a = parseDndId(active.id)
    const o = parseDndId(over.id)

    if (a.kind === 'file') {
      const container = containerOfFile(model, a.value)
      if (!container) return
      let names = model.files[container]
      if (o.kind === 'file' && o.value !== a.value && names.includes(o.value)) {
        names = arrayMove(names, names.indexOf(a.value), names.indexOf(o.value))
      }
      const unchanged = (before.files[container] ?? []).join('\n') === names.join('\n')
      if (unchanged) return
      commit({ ...model, files: { ...model.files, [container]: names } }, () =>
        reorderFiles(library, containerToSectionId(container), names),
      )
      return
    }

    if (a.kind !== 'section') return
    const id = a.value
    const fromParent = parentOfSection(model, id)
    if (fromParent === undefined) return

    let toParent: string | null
    let insertAt: number | null = null

    if (o.kind === 'section') {
      if (o.value === id) return
      const overParent = parentOfSection(model, o.value)
      if (overParent === undefined) return
      if (overParent === fromParent) {
        const list = sectionList(model, fromParent)
        const next = arrayMove(list, list.indexOf(id), list.indexOf(o.value))
        commit(withSectionList(model, fromParent, next), () =>
          reorderSections(library, fromParent, next),
        )
        return
      }
      if (overParent === null) {
        // A child dropped on a category card joins that category.
        if (o.value === fromParent) return
        toParent = o.value
      } else {
        toParent = overParent
        insertAt = sectionList(model, overParent).indexOf(o.value)
      }
    } else if (o.kind === 'children') {
      if (o.value === fromParent) return
      toParent = o.value
    } else {
      return
    }

    if (toParent !== null && (model.childIds[id]?.length ?? 0) > 0) {
      reorder.setError(
        `A ${labels.parent.toLowerCase()} that has ${labels.child.toLowerCase()}s cannot be nested.`,
      )
      return
    }

    const fromList = sectionList(model, fromParent).filter((s) => s !== id)
    const toList = [...sectionList(model, toParent)]
    toList.splice(insertAt ?? toList.length, 0, id)
    let next = withSectionList(withSectionList(model, fromParent, fromList), toParent, toList)
    if (fromParent === null) {
      const childIds = { ...next.childIds }
      delete childIds[id]
      next = { ...next, childIds }
    }
    const target = toParent
    commit(next, () => reorderSections(library, target, toList))
  }

  const context: ManagerContextValue = {
    library,
    blobAccess,
    model,
    files,
    groups,
    groupOptions,
    selected,
    toggleSelected,
    moveFileBy,
    moveSectionBy,
    reordering: reorder.pending,
    compact: activeKind === 'section',
  }

  const overlayLabel = (() => {
    if (!activeId) return null
    const { kind, value } = parseDndId(activeId)
    if (kind === 'file') return files.get(value)?.title ?? value
    return groups.get(value)?.name ?? value
  })()

  return (
    <ManagerContext.Provider value={context}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Library</h2>
            <p className="text-sm text-zinc-500">
              {totalFiles} {totalFiles === 1 ? 'file' : 'files'} in {groupOptions.length}{' '}
              {groupOptions.length === 1 ? 'group' : 'groups'}. Drag the handles to reorder files
              or move them between {labels.parent.toLowerCase()}s and{' '}
              {labels.child.toLowerCase()}s. Changes appear for the team right away.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {reorder.pending && <Loader2 className="size-4 animate-spin text-zinc-500" aria-hidden="true" />}
            <NewSectionForm parentId={null} label={`New ${labels.parent.toLowerCase()}`} />
          </div>
        </div>

        <ErrorText error={reorder.error} />

        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={model.topIds.map((id) => dndId('section', id))}
            strategy={verticalListSortingStrategy}
          >
            {model.topIds.map((id) => (
              <SectionCard key={id} id={id} parentId={null} />
            ))}
          </SortableContext>

          <UnsortedCard />

          <DragOverlay>
            {overlayLabel && (
              <div className="inline-flex max-w-sm items-center gap-2 rounded-lg border border-violet-500/50 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 shadow-xl shadow-black/50">
                {activeKind === 'file' ? (
                  <FileText className="size-4 shrink-0 text-violet-300" aria-hidden="true" />
                ) : (
                  <Folder className="size-4 shrink-0 text-violet-300" aria-hidden="true" />
                )}
                <span className="truncate">{overlayLabel}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        <BulkBar
          library={library}
          names={[...selected]}
          groups={groupOptions}
          onClear={() => setRawSelected(new Set())}
        />
      </div>
    </ManagerContext.Provider>
  )
}
