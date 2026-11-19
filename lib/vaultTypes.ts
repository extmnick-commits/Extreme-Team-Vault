import type { PdfLibrary } from './libraryTypes'

export type VaultKind = 'video' | 'audio' | 'pdf'

export type SearchHit = {
  id: string
  kind: VaultKind
  title: string
  subtitle: string
  href: string
}

export type FreshItem = {
  id: string
  kind: VaultKind
  title: string
  subtitle: string
  href: string
  artworkUrl?: string
  badge: string
  meta: string
  publishedAt: string
  isNew: boolean
  isUpdated: boolean
}

export type ContinueAudio = {
  recordingId: string
  albumId: string
  title: string
  albumName: string
  artworkUrl?: string
  trackNumber: number
  trackCount: number
  positionSec: number
  durationSec: number
  lastPlayedAt: string
  href: string
  resumeHref: string
}

export type RecentPdf = {
  documentId: string
  library: PdfLibrary
  albumId: string
  title: string
  lastOpenedAt: string
  page: number | null
  href: string
  thumbnailUrl?: string
  canRestorePage: boolean
}

export type DashboardPayload = {
  continueListening: ContinueAudio[]
  recentPdfs: RecentPdf[]
  fresh: FreshItem[]
  searchIndex: SearchHit[]
  catalogError?: string
  historyError?: string
}
