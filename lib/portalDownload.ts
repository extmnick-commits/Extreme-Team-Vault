import type { Library } from './libraryTypes'

export function portalLibraryDownloadPath(library: Library, objectName: string): string {
  return `/api/portal/library/${library}/${encodeURIComponent(objectName)}`
}

/** RFC 5987 attachment header so browsers save with the original file name. */
export function contentDispositionAttachment(fileName: string): string {
  const safe = fileName.replace(/[\r\n"]/g, '')
  const ascii = safe.replace(/[^\x20-\x7E]/g, '_') || 'download'
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(safe)}`
}
