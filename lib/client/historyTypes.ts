import type { PdfLibrary } from '@/lib/libraryTypes'

export const END_BUFFER_SEC = 8
export const MIN_RESUME_SEC = 3

export type AudioHistoryEntry = {
  recordingId: string
  albumId: string
  positionSec: number
  durationSec: number
  lastPlayedAt: string
  completed: boolean
}

export type PdfHistoryEntry = {
  documentId: string
  library: PdfLibrary
  albumId: string
  page: number | null
  lastOpenedAt: string
}
