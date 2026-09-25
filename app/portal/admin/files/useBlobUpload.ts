'use client'

import { useCallback } from 'react'
import { upload } from '@vercel/blob/client'
import {
  ALLOWED_CONTENT_TYPES,
  BLOB_STAGING_PREFIX,
  MAX_UPLOAD_BYTES,
  isPdfLibrary,
  type Library,
} from '@/lib/libraryTypes'

const MULTIPART_THRESHOLD = 20 * 1024 * 1024

const EXTENSION_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
}

export function contentTypeFor(file: File): string {
  if (file.type) return file.type
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return EXTENSION_TYPES[ext] ?? 'application/octet-stream'
}

export function validateFile(file: File, library: Library): string | undefined {
  if (file.size > MAX_UPLOAD_BYTES) return 'File is larger than 500 MB.'
  if (!ALLOWED_CONTENT_TYPES[library].includes(contentTypeFor(file))) {
    return isPdfLibrary(library)
      ? 'Only PDF files are allowed.'
      : 'Only MP3, M4A, or WAV audio is allowed.'
  }
  return undefined
}

/**
 * Uploads a file straight from the browser to the Vercel Blob staging area and
 * returns its URL, which a server action then copies into Bunny Storage.
 */
export function useBlobUpload(library: Library, blobAccess: 'public' | 'private') {
  return useCallback(
    async (file: File, onProgress?: (percentage: number) => void): Promise<string> => {
      const blob = await upload(`${BLOB_STAGING_PREFIX}${library}/${file.name}`, file, {
        access: blobAccess,
        handleUploadUrl: '/api/admin/upload',
        clientPayload: JSON.stringify({ library }),
        contentType: contentTypeFor(file),
        multipart: file.size > MULTIPART_THRESHOLD,
        onUploadProgress: ({ percentage }) => onProgress?.(percentage),
      })
      return blob.url
    },
    [library, blobAccess],
  )
}
