import type { LibraryFile, LibraryView } from './libraryTypes'
import type { VideoAttachmentEntry, VideoLinkedDocument } from './videoTypes'

export type DocumentLookup = Map<string, LibraryFile>

export function collectLibraryFiles(view: LibraryView): LibraryFile[] {
  const files: LibraryFile[] = [...view.unsorted]
  for (const section of view.sections) {
    files.push(...section.files)
    for (const child of section.children) {
      files.push(...child.files)
    }
  }
  return files
}

export function buildDocumentLookup(view: LibraryView): DocumentLookup {
  return new Map(collectLibraryFiles(view).map((file) => [file.name, file]))
}

export function resolveLinkedDocuments(
  entries: readonly VideoAttachmentEntry[],
  lookup: DocumentLookup,
): VideoLinkedDocument[] {
  const result: VideoLinkedDocument[] = []
  for (const entry of entries) {
    const file = lookup.get(entry.documentName)
    if (!file) continue
    const customLabel = entry.label?.trim()
    result.push({
      id: file.name,
      title: customLabel || file.title,
      description: file.description,
      cdnUrl: file.cdnUrl,
      badge: `${file.fileType} · ${file.fileSize}`,
      thumbnailUrl: file.thumbnailUrl,
    })
  }
  return result
}

export function attachmentsForVideo(
  store: { attachments: Record<string, VideoAttachmentEntry[]> },
  videoId: string,
): VideoAttachmentEntry[] {
  return store.attachments[videoId] ?? []
}
