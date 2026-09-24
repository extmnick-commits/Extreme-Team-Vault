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

export type LibrarySection = {
  id: string
  name: string
  files: LibraryFile[]
}

export type LibraryView = {
  sections: LibrarySection[]
  unsorted: LibraryFile[]
  error?: string
}

export type ActionResult = { ok: true } | { ok: false; error: string }
