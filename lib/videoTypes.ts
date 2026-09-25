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
  /** Bunny Stream thumbnail file name (e.g. thumbnail.jpg). Used for CDN fallback URLs. */
  thumbnailFileName?: string
}

const DEFAULT_THUMBNAIL_FILE = 'thumbnail.jpg'

/** Ordered thumbnail URLs: pull zone CDN first, then Bunny mediadelivery thumb host. */
export function bunnyStreamThumbnailCandidates(
  item: Pick<VideoItem, 'libraryId' | 'bunnyVideoId' | 'thumbnailUrl' | 'thumbnailFileName'>,
): string[] {
  const fromUrl = item.thumbnailUrl?.split('/').pop()?.split('?')[0]?.trim()
  const file = item.thumbnailFileName?.trim() || fromUrl || DEFAULT_THUMBNAIL_FILE
  const urls: string[] = []

  if (item.thumbnailUrl) urls.push(item.thumbnailUrl)

  const mediadelivery = `https://thumb.mediadelivery.net/${item.libraryId}/${item.bunnyVideoId}/${file}`
  if (!urls.includes(mediadelivery)) urls.push(mediadelivery)

  return urls
}

export function primaryStreamThumbnailUrl(
  libraryId: string,
  videoId: string,
  thumbnailFileName: string,
  cdnBaseUrl: string,
): string {
  const file = thumbnailFileName.trim() || DEFAULT_THUMBNAIL_FILE
  const cdn = cdnBaseUrl.replace(/\/+$/, '')
  if (cdn) return `${cdn}/${videoId}/${file}`
  return `https://thumb.mediadelivery.net/${libraryId}/${videoId}/${file}`
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

export const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024

export const ALLOWED_THUMBNAIL_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export const THUMBNAIL_ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'

const THUMBNAIL_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp'])

export function contentTypeForThumbnail(file: File): string {
  if (file.type && (ALLOWED_THUMBNAIL_TYPES as readonly string[]).includes(file.type)) {
    return file.type
  }
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  return 'application/octet-stream'
}

export function validateThumbnailFile(file: File): string | undefined {
  if (file.size > MAX_THUMBNAIL_BYTES) return 'Thumbnail must be 5 MB or smaller.'
  const type = contentTypeForThumbnail(file)
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (
    !(ALLOWED_THUMBNAIL_TYPES as readonly string[]).includes(type) &&
    !THUMBNAIL_EXTENSIONS.has(ext)
  ) {
    return 'Use a JPG, PNG, or WebP image for the thumbnail.'
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
