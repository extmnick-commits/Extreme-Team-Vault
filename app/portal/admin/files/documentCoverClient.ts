'use client'

import { uploadDocumentCover } from './actions'

export async function postDocumentCoverBlob(pdfName: string, blob: Blob) {
  const file = new File([blob], 'cover.webp', {
    type: blob.type || 'image/webp',
  })
  const formData = new FormData()
  formData.set('library', 'documents')
  formData.set('pdfName', pdfName)
  formData.set('cover', file)
  return uploadDocumentCover(formData)
}

export async function postDocumentCoverFile(pdfName: string, file: File) {
  const formData = new FormData()
  formData.set('library', 'documents')
  formData.set('pdfName', pdfName)
  formData.set('cover', file)
  return uploadDocumentCover(formData)
}

export async function fetchPdfBytesForCover(pdfName: string, cdnUrl: string): Promise<ArrayBuffer> {
  const proxyUrl = `/api/admin/documents/${encodeURIComponent(pdfName)}`
  let response = await fetch(cdnUrl, { credentials: 'omit' })
  if (!response.ok) {
    response = await fetch(proxyUrl, { credentials: 'include' })
  }
  if (!response.ok) {
    throw new Error('Could not download PDF to generate a preview.')
  }
  return response.arrayBuffer()
}
