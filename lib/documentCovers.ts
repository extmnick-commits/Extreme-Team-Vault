import { createHash } from 'node:crypto'

/** Stored under each library folder; excluded from file listings. */
export const DOCUMENT_COVER_PREFIX = '_covers/'

export function isDocumentCoverObjectName(name: string): boolean {
  return name.startsWith(DOCUMENT_COVER_PREFIX)
}

/** Stable cover object name for a PDF storage object. */
export function documentCoverObjectName(pdfObjectName: string): string {
  const hash = createHash('sha256').update(pdfObjectName).digest('hex').slice(0, 32)
  return `${DOCUMENT_COVER_PREFIX}${hash}.webp`
}

export function documentCoverCdnUrl(
  cdnBase: string,
  library: string,
  thumbnailName: string,
): string {
  const cdn = cdnBase.replace(/\/+$/, '')
  return `${cdn}/${library}/${encodeURIComponent(thumbnailName)}`
}
