import 'server-only'
import { BunnyStorageError, putObject } from './bunnyStorage'
import {
  MAX_VIDEO_ATTACHMENT_LABEL_LENGTH,
  type VideoAttachmentEntry,
} from './videoTypes'

export {
  attachmentsForVideo,
  buildDocumentLookup,
  collectLibraryFiles,
  resolveLinkedDocuments,
  type DocumentLookup,
} from './videoResourceUtils'

export const VIDEO_RESOURCES_STORE_NAME = '_video-resources.json'

export const VIDEO_RESOURCES_TAG = 'bunny:video-resources'

type VideoResourcesFile = {
  version: 1
  attachments: Record<string, VideoAttachmentEntry[]>
}

type ReadOptions = { fresh?: boolean }

function emptyStore(): VideoResourcesFile {
  return { version: 1, attachments: {} }
}

function parseAttachmentEntry(value: unknown): VideoAttachmentEntry | null {
  if (typeof value !== 'object' || value === null) return null
  const raw = value as Partial<VideoAttachmentEntry>
  const documentName = typeof raw.documentName === 'string' ? raw.documentName.trim() : ''
  if (!documentName || documentName.includes('/') || documentName.includes('\\')) return null
  const label =
    typeof raw.label === 'string' && raw.label.trim()
      ? raw.label.trim().slice(0, MAX_VIDEO_ATTACHMENT_LABEL_LENGTH)
      : undefined
  return { documentName, label }
}

function parseStore(value: unknown): VideoResourcesFile {
  if (typeof value !== 'object' || value === null) return emptyStore()
  const raw = value as Partial<VideoResourcesFile>
  if (raw.version !== 1 || typeof raw.attachments !== 'object' || raw.attachments === null) {
    return emptyStore()
  }

  const attachments: Record<string, VideoAttachmentEntry[]> = {}
  for (const [videoId, entries] of Object.entries(raw.attachments)) {
    const id = videoId.trim()
    if (!id || id.includes('/')) continue
    if (!Array.isArray(entries)) continue
    const parsed: VideoAttachmentEntry[] = []
    const seen = new Set<string>()
    for (const item of entries) {
      const entry = parseAttachmentEntry(item)
      if (!entry || seen.has(entry.documentName)) continue
      seen.add(entry.documentName)
      parsed.push(entry)
    }
    if (parsed.length > 0) attachments[id] = parsed
  }

  return { version: 1, attachments }
}

function cacheOptions({ fresh }: ReadOptions) {
  return fresh
    ? { cache: 'no-store' as const }
    : { next: { revalidate: 60, tags: [VIDEO_RESOURCES_TAG] } }
}

async function storeObjectUrl(): Promise<{ url: string; apiKey: string }> {
  const region = process.env.BUNNY_STORAGE_REGION?.trim()
  const zoneName = process.env.BUNNY_STORAGE_ZONE_NAME
  const apiKey = process.env.BUNNY_STORAGE_API_KEY
  if (!zoneName || !apiKey) {
    throw new BunnyStorageError(
      'Missing BUNNY_STORAGE_ZONE_NAME or BUNNY_STORAGE_API_KEY.',
    )
  }
  const host = region ? `${region}.storage.bunnycdn.com` : 'storage.bunnycdn.com'
  const url = `https://${host}/${zoneName}/documents/${encodeURIComponent(VIDEO_RESOURCES_STORE_NAME)}`
  return { url, apiKey }
}

export async function readVideoResources(
  options: ReadOptions = {},
): Promise<VideoResourcesFile> {
  try {
    const { url, apiKey } = await storeObjectUrl()
    const response = await fetch(url, {
      headers: { AccessKey: apiKey },
      ...cacheOptions(options),
    })
    if (response.status === 404) return emptyStore()
    if (!response.ok) {
      throw new BunnyStorageError(
        `Failed to read video resources: ${response.status} ${response.statusText}`,
      )
    }
    return parseStore(await response.json())
  } catch (error) {
    if (error instanceof BunnyStorageError) throw error
    console.warn('[videoResources] Could not read video resources:', error)
    return emptyStore()
  }
}

async function writeVideoResources(store: VideoResourcesFile): Promise<void> {
  await putObject('documents', VIDEO_RESOURCES_STORE_NAME, JSON.stringify(store, null, 2), {
    contentType: 'application/json',
  })
}

function assertVideoId(videoId: string): void {
  if (!videoId || videoId.includes('/')) {
    throw new BunnyStorageError('Invalid video id.')
  }
}

function assertDocumentName(documentName: string): void {
  if (
    !documentName ||
    documentName === VIDEO_RESOURCES_STORE_NAME ||
    documentName === '_video-categories.json' ||
    documentName.includes('/') ||
    documentName.includes('\\')
  ) {
    throw new BunnyStorageError('Invalid document name.')
  }
}

export async function attachVideoDocument(
  videoId: string,
  documentName: string,
  label?: string,
): Promise<void> {
  assertVideoId(videoId.trim())
  assertDocumentName(documentName.trim())
  const trimmedLabel = label?.trim().slice(0, MAX_VIDEO_ATTACHMENT_LABEL_LENGTH)

  const store = await readVideoResources({ fresh: true })
  const list = store.attachments[videoId] ?? []
  if (list.some((entry) => entry.documentName === documentName)) {
    throw new BunnyStorageError('That PDF is already linked to this video.')
  }

  const entry: VideoAttachmentEntry = { documentName }
  if (trimmedLabel) entry.label = trimmedLabel

  store.attachments[videoId] = [...list, entry]
  await writeVideoResources(store)
}

export async function detachVideoDocument(
  videoId: string,
  documentName: string,
): Promise<void> {
  assertVideoId(videoId.trim())
  assertDocumentName(documentName.trim())

  const store = await readVideoResources({ fresh: true })
  const list = store.attachments[videoId]
  if (!list?.length) throw new BunnyStorageError('Attachment not found.')

  const next = list.filter((entry) => entry.documentName !== documentName)
  if (next.length === list.length) throw new BunnyStorageError('Attachment not found.')

  if (next.length === 0) {
    delete store.attachments[videoId]
  } else {
    store.attachments[videoId] = next
  }
  await writeVideoResources(store)
}

export async function removeDocumentFromAllVideos(documentName: string): Promise<void> {
  assertDocumentName(documentName.trim())
  const store = await readVideoResources({ fresh: true })
  let changed = false

  for (const [videoId, entries] of Object.entries(store.attachments)) {
    const next = entries.filter((entry) => entry.documentName !== documentName)
    if (next.length === entries.length) continue
    changed = true
    if (next.length === 0) delete store.attachments[videoId]
    else store.attachments[videoId] = next
  }

  if (changed) await writeVideoResources(store)
}
