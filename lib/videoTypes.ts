export const VIDEO_CATEGORIES = ['training', 'archive'] as const

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number]

export function isVideoCategory(value: unknown): value is VideoCategory {
  return typeof value === 'string' && (VIDEO_CATEGORIES as readonly string[]).includes(value)
}

export const VIDEO_CATEGORY_LABELS: Record<VideoCategory, string> = {
  training: 'Training',
  archive: 'Archive',
}

export type VideoItem = {
  id: string
  title: string
  description: string
  bunnyVideoId: string
  libraryId: string
  duration: string
  category: VideoCategory
  thumbnailUrl?: string
}

/** Stream encode status. 4 = finished and ready to play. */
export const VIDEO_STATUS = {
  created: 0,
  uploaded: 1,
  processing: 2,
  transcoding: 3,
  finished: 4,
  error: 5,
  uploadFailed: 6,
} as const

export function videoStatusLabel(status: number): string {
  switch (status) {
    case VIDEO_STATUS.created:
      return 'Waiting for upload'
    case VIDEO_STATUS.uploaded:
      return 'Uploaded'
    case VIDEO_STATUS.processing:
      return 'Processing'
    case VIDEO_STATUS.transcoding:
      return 'Encoding'
    case VIDEO_STATUS.finished:
      return 'Ready'
    case VIDEO_STATUS.error:
      return 'Error'
    case VIDEO_STATUS.uploadFailed:
      return 'Upload failed'
    default:
      return 'Unknown'
  }
}

export type AdminVideo = Omit<VideoItem, 'category'> & {
  category: VideoCategory | null
  status: number
  encodeProgress: number
}

export type VideoView = {
  videos: AdminVideo[]
  error?: string
}

export const MAX_VIDEO_BYTES = 5 * 1024 * 1024 * 1024

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-m4v',
] as const

export const VIDEO_ACCEPT = '.mp4,.mov,.webm,.m4v,video/mp4,video/quicktime,video/webm'

export const MAX_VIDEO_TITLE_LENGTH = 200
export const MAX_VIDEO_DESCRIPTION_LENGTH = 500

const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'webm', 'm4v'])

export function contentTypeForVideo(file: File): string {
  if (file.type) return file.type
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'mp4') return 'video/mp4'
  if (ext === 'mov') return 'video/quicktime'
  if (ext === 'webm') return 'video/webm'
  if (ext === 'm4v') return 'video/x-m4v'
  return 'application/octet-stream'
}

export function validateVideoFile(file: File): string | undefined {
  if (file.size > MAX_VIDEO_BYTES) return 'File is larger than 5 GB.'
  const type = contentTypeForVideo(file)
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (
    !(ALLOWED_VIDEO_TYPES as readonly string[]).includes(type) &&
    !VIDEO_EXTENSIONS.has(ext)
  ) {
    return 'Only MP4, MOV, or WebM video is allowed.'
  }
  return undefined
}

export function formatVideoDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const total = Math.round(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const rest = total % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
  }
  return `${minutes}:${String(rest).padStart(2, '0')}`
}
