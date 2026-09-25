'use client'

import { useCallback } from 'react'
import { validateThumbnailFile } from '@/lib/videoTypes'
import { pdfCoverErrorMessage, renderPdfCover } from './generatePdfCover'

export type PdfCoverState = {
  blob?: Blob
  preview?: string
  manual?: boolean
  generating?: boolean
  warning?: string
}

export function usePdfCoverRevoke() {
  return useCallback((preview?: string) => {
    if (preview) URL.revokeObjectURL(preview)
  }, [])
}

export async function generateCoverFromPdfFile(
  file: File,
  revoke: (preview?: string) => void,
  previousPreview?: string,
): Promise<PdfCoverState> {
  try {
    const blob = await renderPdfCover(file)
    revoke(previousPreview)
    return {
      blob,
      preview: URL.createObjectURL(blob),
      manual: false,
      generating: false,
    }
  } catch (error) {
    return {
      generating: false,
      warning: pdfCoverErrorMessage(error),
    }
  }
}

export function applyManualCover(
  file: File,
  revoke: (preview?: string) => void,
  previousPreview?: string,
): PdfCoverState {
  const validationError = validateThumbnailFile(file)
  if (validationError) {
    return { warning: validationError, generating: false }
  }
  revoke(previousPreview)
  return {
    blob: file,
    preview: URL.createObjectURL(file),
    manual: true,
    generating: false,
  }
}
