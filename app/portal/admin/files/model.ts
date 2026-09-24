import type { LibraryFile, LibraryGroup, LibraryView } from '@/lib/libraryTypes'

/** Container id for files that are not in any section ("Other"). */
export const UNSORTED = '__unsorted'

/** Client-side ordering state, updated optimistically while dragging. */
export type OrderModel = {
  topIds: string[]
  childIds: Record<string, string[]>
  files: Record<string, string[]>
}

export function modelFromView(view: LibraryView): OrderModel {
  const childIds: Record<string, string[]> = {}
  const files: Record<string, string[]> = { [UNSORTED]: view.unsorted.map((f) => f.name) }
  for (const section of view.sections) {
    childIds[section.id] = section.children.map((c) => c.id)
    files[section.id] = section.files.map((f) => f.name)
    for (const child of section.children) files[child.id] = child.files.map((f) => f.name)
  }
  return { topIds: view.sections.map((s) => s.id), childIds, files }
}

export function indexView(view: LibraryView) {
  const groups = new Map<string, LibraryGroup>()
  const files = new Map<string, LibraryFile>()
  for (const file of view.unsorted) files.set(file.name, file)
  for (const section of view.sections) {
    groups.set(section.id, section)
    for (const file of section.files) files.set(file.name, file)
    for (const child of section.children) {
      groups.set(child.id, child)
      for (const file of child.files) files.set(file.name, file)
    }
  }
  return { groups, files }
}

export function containerOfFile(model: OrderModel, name: string): string | undefined {
  return Object.keys(model.files).find((id) => model.files[id].includes(name))
}

export function parentOfSection(model: OrderModel, id: string): string | null | undefined {
  if (model.topIds.includes(id)) return null
  return Object.keys(model.childIds).find((top) => model.childIds[top].includes(id))
}

export function containerToSectionId(container: string): string | null {
  return container === UNSORTED ? null : container
}

// ---------------------------------------------------------------------------
// Drag-and-drop ids
// ---------------------------------------------------------------------------

export type DndKind = 'file' | 'section' | 'files' | 'children'

export const dndId = (kind: DndKind, value: string) => `${kind}:${value}`

export function parseDndId(id: string | number): { kind: DndKind; value: string } {
  const text = String(id)
  const colon = text.indexOf(':')
  return { kind: text.slice(0, colon) as DndKind, value: text.slice(colon + 1) }
}
