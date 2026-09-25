'use client'

import type { PdfLibrary } from '@/lib/libraryTypes'
import { uploadDocumentCover } from './actions'

export async function postDocumentCoverBlob(
  library: PdfLibrary,
  pdfName: string,
  blob: Blob,
) {
  const file = new File([blob], 'cover.webp', {
    type: blob.type || 'image/webp',
  })
  const formData = new FormData()
  formData.set('library', library)
  formData.set('pdfName', pdfName)
  formData.set('cover', file)
  return uploadDocumentCover(formData)
}

export async function postDocumentCoverFile(
  library: PdfLibrary,
  pdfName: string,
  file: File,
) {
  const formData = new FormData()
  formData.set('library', library)
  formData.set('pdfName', pdfName)
  formData.set('cover', file)
  return uploadDocumentCover(formData)
}

export async function fetchPdfBytesForCover(
  library: PdfLibrary,
  pdfName: string,
  cdnUrl: string,
): Promise<ArrayBuffer> {
  const proxyUrl = `/api/admin/pdf/${library}/${encodeURIComponent(pdfName)}`
  let response: Response
  try {
    response = await fetch(cdnUrl, { credentials: 'omit' })
  } catch {
    response = await fetch(proxyUrl, { credentials: 'include' })
  }
  if (!response.ok) {
    response = await fetch(proxyUrl, { credentials: 'include' })
  }
  if (!response.ok) {
    throw new Error('Could not download PDF to generate a preview.')
  }
  return response.arrayBuffer()
}
