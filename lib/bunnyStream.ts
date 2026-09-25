import 'server-only'
import { createHash } from 'node:crypto'
import {
  VIDEO_CATEGORY_LABELS,
  VIDEO_STATUS,
  formatVideoDuration,
  isVideoCategory,
  primaryStreamThumbnailUrl,
  type AdminVideo,
  type VideoCategory,
  type VideoItem,
  type VideoView,
} from './videoTypes'

export const VIDEOS_TAG = 'bunny:videos'

export class BunnyStreamError extends Error {}

type StreamConfig = { libraryId: string; apiKey: string; cdnUrl: string }

type StreamMetaTag = { property: string; value: string }

type StreamVideo = {
  guid: string
  title: string
  length: number
  status: number
  encodeProgress: number
  collectionId: string
  thumbnailFileName: string
  metaTags: StreamMetaTag[]
}

type StreamCollection = { guid: string; name: string }

type ReadOptions = { fresh?: boolean }

const API_BASE = 'https://video.bunnycdn.com/library'
const TUS_EXPIRE_SECONDS = 6 * 60 * 60
const DESCRIPTION_TAG = 'description'

function readConfig(): StreamConfig | null {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID?.trim()
  const apiKey = process.env.BUNNY_STREAM_API_KEY?.trim()
  // Pull zone base, e.g. https://vz-xxxxx.b-cdn.net (no trailing slash).
  const cdnUrl = process.env.NEXT_PUBLIC_BUNNY_STREAM_CDN_URL?.replace(/\/+$/, '') ?? ''
  if (!libraryId || !apiKey) return null
  return { libraryId, apiKey, cdnUrl }
}

let libraryCdnBaseCache: string | null | undefined

function hostnameFromLibraryRecord(value: unknown): string {
  if (!isRecord(value)) return ''
  const candidates = [
    value.Hostname,
    value.hostname,
    value.CDNHostname,
    value.cdnHostname,
    value.PullZoneHostname,
  ]
  for (const entry of candidates) {
    if (typeof entry === 'string' && entry.trim()) return entry.trim()
  }
  if (isRecord(value.PullZone) && typeof value.PullZone.Hostname === 'string') {
    return value.PullZone.Hostname.trim()
  }
  return ''
}

async function resolveStreamCdnBase(config: StreamConfig): Promise<string> {
  if (config.cdnUrl) return config.cdnUrl
  if (libraryCdnBaseCache !== undefined) return libraryCdnBaseCache ?? ''

  try {
    const response = await streamFetch('', { fresh: true })
    const hostname = hostnameFromLibraryRecord(await response.json())
    if (hostname) {
      libraryCdnBaseCache = hostname.startsWith('http')
        ? hostname.replace(/\/+$/, '')
        : `https://${hostname.replace(/\/+$/, '')}`
      return libraryCdnBaseCache
    }
  } catch (error) {
    console.warn('[bunnyStream] Could not resolve Stream CDN hostname from library API:', error)
  }

  libraryCdnBaseCache = null
  return ''
}

function getConfig(): StreamConfig {
  const config = readConfig()
  if (!config) {
    throw new BunnyStreamError(
      'Missing BUNNY_STREAM_LIBRARY_ID or BUNNY_STREAM_API_KEY.',
    )
  }
  return config
}

function cacheOptions({ fresh }: ReadOptions) {
  return fresh
    ? { cache: 'no-store' as const }
    : { next: { revalidate: 60, tags: [VIDEOS_TAG] } }
}

async function streamFetch(
  path: string,
  init: RequestInit & { fresh?: boolean } = {},
): Promise<Response> {
  const { libraryId, apiKey } = getConfig()
  const { fresh, ...requestInit } = init
  const headers = new Headers(requestInit.headers)
  headers.set('AccessKey', apiKey)
  if (requestInit.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE}/${libraryId}${path}`, {
    ...requestInit,
    headers,
    ...cacheOptions({ fresh }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new BunnyStreamError(
      `Bunny Stream request failed (${response.status} ${response.statusText})${
        detail ? `: ${detail.slice(0, 200)}` : ''
      }`,
    )
  }

  return response
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseMetaTags(value: unknown): StreamMetaTag[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!isRecord(item)) return []
    if (typeof item.property !== 'string' || typeof item.value !== 'string') return []
    return [{ property: item.property, value: item.value }]
  })
}

function parseVideo(value: unknown): StreamVideo | null {
  if (!isRecord(value) || typeof value.guid !== 'string') return null
  return {
    guid: value.guid,
    title: typeof value.title === 'string' ? value.title : 'Untitled video',
    length: typeof value.length === 'number' ? value.length : 0,
    status: typeof value.status === 'number' ? value.status : VIDEO_STATUS.created,
    encodeProgress: typeof value.encodeProgress === 'number' ? value.encodeProgress : 0,
    collectionId: typeof value.collectionId === 'string' ? value.collectionId : '',
    thumbnailFileName:
      typeof value.thumbnailFileName === 'string' ? value.thumbnailFileName : 'thumbnail.jpg',
    metaTags: parseMetaTags(value.metaTags),
  }
}

function parsePagedItems<T>(
  value: unknown,
  parseItem: (item: unknown) => T | null,
): { items: T[]; total: number } {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new BunnyStreamError('Unexpected Bunny Stream list response.')
  }
  const items = value.items.flatMap((item) => {
    const parsed = parseItem(item)
    return parsed ? [parsed] : []
  })
  const total = typeof value.totalItems === 'number' ? value.totalItems : items.length
  return { items, total }
}

function descriptionOf(video: StreamVideo): string {
  return video.metaTags.find((tag) => tag.property === DESCRIPTION_TAG)?.value ?? ''
}

function toAdminVideo(
  video: StreamVideo,
  collections: Map<string, VideoCategory>,
  libraryId: string,
  cdnUrl: string,
): AdminVideo {
  const thumbnailFileName = video.thumbnailFileName || 'thumbnail.jpg'
  return {
    id: video.guid,
    title: video.title,
    description: descriptionOf(video),
    bunnyVideoId: video.guid,
    libraryId,
    duration: formatVideoDuration(video.length),
    category: collections.get(video.collectionId) ?? null,
    thumbnailUrl: primaryStreamThumbnailUrl(libraryId, video.guid, thumbnailFileName, cdnUrl),
    thumbnailFileName,
    status: video.status,
    encodeProgress: video.encodeProgress,
  }
}

function parseCollection(value: unknown): StreamCollection | null {
  if (!isRecord(value) || typeof value.guid !== 'string' || typeof value.name !== 'string') {
    return null
  }
  return { guid: value.guid, name: value.name }
}

function categoryFromName(name: string): VideoCategory | null {
  const normalized = name.trim().toLowerCase()
  return isVideoCategory(normalized) ? normalized : null
}

async function listCollections(options: ReadOptions = {}): Promise<StreamCollection[]> {
  const response = await streamFetch('/collections?itemsPerPage=100', options)
  return parsePagedItems(await response.json(), parseCollection).items
}

async function createCollection(name: string): Promise<StreamCollection> {
  const response = await streamFetch('/collections', {
    method: 'POST',
    body: JSON.stringify({ name }),
    fresh: true,
  })
  const parsed = parseCollection(await response.json())
  if (!parsed) throw new BunnyStreamError('Failed to create video collection.')
  return parsed
}

export async function ensureCollections(): Promise<Record<VideoCategory, string>> {
  const existing = await listCollections({ fresh: true })
  const ids = { training: '', archive: '' } satisfies Record<VideoCategory, string>

  for (const collection of existing) {
    const category = categoryFromName(collection.name)
    if (category && !ids[category]) ids[category] = collection.guid
  }

  for (const category of ['training', 'archive'] as const) {
    if (ids[category]) continue
    const created = await createCollection(VIDEO_CATEGORY_LABELS[category])
    ids[category] = created.guid
  }

  return ids
}

function collectionCategoryMap(collections: StreamCollection[]): Map<string, VideoCategory> {
  const map = new Map<string, VideoCategory>()
  for (const collection of collections) {
    const category = categoryFromName(collection.name)
    if (category) map.set(collection.guid, category)
  }
  return map
}

async function listAllVideos(options: ReadOptions = {}): Promise<StreamVideo[]> {
  const videos: StreamVideo[] = []
  let page = 1

  while (page <= 50) {
    const response = await streamFetch(
      `/videos?page=${page}&itemsPerPage=100&orderBy=date`,
      options,
    )
    const batch = parsePagedItems(await response.json(), parseVideo)
    videos.push(...batch.items)
    if (videos.length >= batch.total || batch.items.length === 0) break
    page += 1
  }

  return videos
}

export async function getAdminVideos(options: ReadOptions = {}): Promise<VideoView> {
  const config = readConfig()
  if (!config) {
    return {
      videos: [],
      error: 'Missing BUNNY_STREAM_LIBRARY_ID or BUNNY_STREAM_API_KEY.',
    }
  }

  try {
    const [videos, collections, cdnUrl] = await Promise.all([
      listAllVideos(options),
      listCollections(options),
      resolveStreamCdnBase(config),
    ])
    const categories = collectionCategoryMap(collections)
    return {
      videos: videos.map((video) =>
        toAdminVideo(video, categories, config.libraryId, cdnUrl),
      ),
    }
  } catch (error) {
    console.error('[bunnyStream] Error loading videos:', error)
    return {
      videos: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getVideos(category: VideoCategory): Promise<VideoItem[]> {
  const { videos, error } = await getAdminVideos()
  if (error) {
    if (!error.startsWith('Missing BUNNY_STREAM_')) {
      console.error('[bunnyStream] Error loading member videos:', error)
    }
    return []
  }
  return videos.filter(
    (video): video is AdminVideo & { category: VideoCategory } =>
      video.category === category && video.status === VIDEO_STATUS.finished,
  )
}

export async function createVideo(
  title: string,
  category: VideoCategory,
): Promise<{ libraryId: string; videoId: string }> {
  const { libraryId } = getConfig()
  const collections = await ensureCollections()
  const response = await streamFetch('/videos', {
    method: 'POST',
    body: JSON.stringify({ title, collectionId: collections[category] }),
    fresh: true,
  })
  const parsed = parseVideo(await response.json())
  if (!parsed) throw new BunnyStreamError('Failed to create video.')
  return { libraryId, videoId: parsed.guid }
}

export function signTusUpload(videoId: string): { expire: number; signature: string } {
  const { libraryId, apiKey } = getConfig()
  const expire = Math.floor(Date.now() / 1000) + TUS_EXPIRE_SECONDS
  const signature = createHash('sha256')
    .update(`${libraryId}${apiKey}${expire}${videoId}`)
    .digest('hex')
  return { expire, signature }
}

async function getVideo(videoId: string): Promise<StreamVideo> {
  const response = await streamFetch(`/videos/${encodeURIComponent(videoId)}`, { fresh: true })
  const parsed = parseVideo(await response.json())
  if (!parsed) throw new BunnyStreamError('Video not found.')
  return parsed
}

export async function updateVideoDetails(
  videoId: string,
  details: { title?: string; description?: string; category?: VideoCategory | null },
): Promise<void> {
  const current = await getVideo(videoId)
  const collections = details.category ? await ensureCollections() : null

  let metaTags = current.metaTags
  if (details.description !== undefined) {
    metaTags = current.metaTags.filter((tag) => tag.property !== DESCRIPTION_TAG)
    if (details.description) {
      metaTags.push({ property: DESCRIPTION_TAG, value: details.description })
    }
  }

  const body: Record<string, unknown> = {
    title: details.title?.trim() || current.title,
    metaTags,
  }

  if (details.category && collections) {
    body.collectionId = collections[details.category]
  } else if (details.category === null) {
    body.collectionId = ''
  }

  await streamFetch(`/videos/${encodeURIComponent(videoId)}`, {
    method: 'POST',
    body: JSON.stringify(body),
    fresh: true,
  })
}

export async function deleteVideo(videoId: string): Promise<void> {
  await streamFetch(`/videos/${encodeURIComponent(videoId)}`, {
    method: 'DELETE',
    fresh: true,
  })
}

export async function uploadVideoThumbnail(
  videoId: string,
  image: Buffer,
  contentType: string,
): Promise<void> {
  const { libraryId, apiKey } = getConfig()
  const response = await fetch(
    `${API_BASE}/${libraryId}/videos/${encodeURIComponent(videoId)}/thumbnail`,
    {
      method: 'POST',
      headers: {
        AccessKey: apiKey,
        'Content-Type': contentType || 'application/octet-stream',
      },
      body: new Uint8Array(image),
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new BunnyStreamError(
      `Failed to upload thumbnail (${response.status} ${response.statusText})${
        detail ? `: ${detail.slice(0, 200)}` : ''
      }`,
    )
  }
}
