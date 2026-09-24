export const LIBRARIES = ['documents', 'audio'] as const

export type Library = (typeof LIBRARIES)[number]

export function isLibrary(value: unknown): value is Library {
  return typeof value === 'string' && (LIBRARIES as readonly string[]).includes(value)
}

export const LIBRARY_LABELS: Record<Library, string> = {
  documents: 'PDF Documents',
  audio: 'Audio Trainings',
}

export const ALLOWED_CONTENT_TYPES: Record<Library, string[]> = {
  documents: ['application/pdf'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/wav', 'audio/x-wav'],
}

export const ACCEPT_ATTRIBUTE: Record<Library, string> = {
  documents: '.pdf,application/pdf',
  audio: '.mp3,.m4a,.wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/wav',
}

export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024

export const BLOB_STAGING_PREFIX = 'bunny-staging/'

export type BunnyFile = {
  id: string
  title: string
  description: string
  fileType: string
  fileSize: string
  cdnUrl: string
}

export type LibraryFile = BunnyFile & {
  name: string
  sectionId: string | null
  customTitle: string
  customDescription: string
}

export type LibraryGroup = {
  id: string
  name: string
  description: string
  parentId: string | null
  files: LibraryFile[]
  children: LibraryGroup[]
}

export type LibraryView = {
  /** Top-level categories; each may contain one level of child groups. */
  sections: LibraryGroup[]
  unsorted: LibraryFile[]
  error?: string
}

export const GROUP_LABELS: Record<Library, { parent: string; child: string }> = {
  documents: { parent: 'Category', child: 'Subcategory' },
  audio: { parent: 'Category', child: 'Album' },
}

export type GroupOption = {
  id: string
  name: string
  /** Display label including the parent, e.g. "Training / Prospecting". */
  label: string
  parentId: string | null
}

export function groupOptions(view: LibraryView): GroupOption[] {
  return view.sections.flatMap((section) => [
    { id: section.id, name: section.name, label: section.name, parentId: null },
    ...section.children.map((child) => ({
      id: child.id,
      name: child.name,
      label: `${section.name} / ${child.name}`,
      parentId: section.id,
    })),
  ])
}

export function countGroupFiles(group: LibraryGroup): number {
  return group.files.length + group.children.reduce((sum, c) => sum + countGroupFiles(c), 0)
}

export function countLibraryFiles(view: LibraryView): number {
  return view.unsorted.length + view.sections.reduce((sum, s) => sum + countGroupFiles(s), 0)
}

export function findGroup(view: LibraryView, id: string): LibraryGroup | undefined {
  for (const section of view.sections) {
    if (section.id === id) return section
    const child = section.children.find((c) => c.id === id)
    if (child) return child
  }
  return undefined
}

export type ActionResult = { ok: true } | { ok: false; error: string }
