import 'server-only'
import { BunnyStorageError, putObject } from './bunnyStorage'
import {
  DEFAULT_LIVE_ROOM_SETTINGS,
  mergeZoomFieldsOnSave,
  normalizeZoomMeetingNumber,
  parseZoomMeetingLink,
  type LiveRoomProvider,
  type LiveRoomSettings,
} from './liveRoomConfig'

export const LIVE_ROOM_STORE_NAME = '_live-room.json'

export const LIVE_ROOM_TAG = 'bunny:live-room'

type LiveRoomFile = {
  version: 1
  provider: LiveRoomProvider
  wherebyUrl: string
  zoomEmbedUrl: string
  zoomMeetingNumber?: string
  zoomPasscode?: string
}

type ReadOptions = { fresh?: boolean }

const MAX_URL_LENGTH = 2048
const MAX_PASSCODE_LENGTH = 128

function emptyStore(): LiveRoomFile {
  return {
    version: 1,
    provider: DEFAULT_LIVE_ROOM_SETTINGS.provider,
    wherebyUrl: '',
    zoomEmbedUrl: '',
    zoomMeetingNumber: '',
    zoomPasscode: '',
  }
}

function parseProvider(value: unknown): LiveRoomProvider {
  return value === 'zoom' ? 'zoom' : 'whereby'
}

function cleanUrl(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, MAX_URL_LENGTH) : ''
}

function cleanPasscode(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, MAX_PASSCODE_LENGTH) : ''
}

function parseStore(value: unknown): LiveRoomFile {
  if (typeof value !== 'object' || value === null) return emptyStore()
  const raw = value as Partial<LiveRoomFile>
  if (raw.version !== 1) return emptyStore()

  const file: LiveRoomFile = {
    version: 1,
    provider: parseProvider(raw.provider),
    wherebyUrl: cleanUrl(raw.wherebyUrl),
    zoomEmbedUrl: cleanUrl(raw.zoomEmbedUrl),
    zoomMeetingNumber: normalizeZoomMeetingNumber(
      typeof raw.zoomMeetingNumber === 'string' ? raw.zoomMeetingNumber : '',
    ),
    zoomPasscode: cleanPasscode(raw.zoomPasscode),
  }

  if (!file.zoomMeetingNumber && file.zoomEmbedUrl) {
    const parsed = parseZoomMeetingLink(file.zoomEmbedUrl)
    if (parsed) {
      file.zoomMeetingNumber = parsed.meetingNumber
      if (!file.zoomPasscode && parsed.passcodeFromUrl) {
        file.zoomPasscode = cleanPasscode(parsed.passcodeFromUrl)
      }
    }
  }

  return file
}

function toSettings(file: LiveRoomFile): LiveRoomSettings {
  return {
    provider: file.provider,
    wherebyUrl: file.wherebyUrl,
    zoomEmbedUrl: file.zoomEmbedUrl,
    zoomMeetingNumber: file.zoomMeetingNumber ?? '',
    zoomPasscode: file.zoomPasscode ?? '',
  }
}

function cacheOptions({ fresh }: ReadOptions) {
  return fresh
    ? { cache: 'no-store' as const }
    : { next: { revalidate: 60, tags: [LIVE_ROOM_TAG] } }
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
  const url = `https://${host}/${zoneName}/documents/${encodeURIComponent(LIVE_ROOM_STORE_NAME)}`
  return { url, apiKey }
}

export async function readLiveRoomSettings(
  options: ReadOptions = {},
): Promise<LiveRoomSettings> {
  try {
    const { url, apiKey } = await storeObjectUrl()
    const response = await fetch(url, {
      headers: { AccessKey: apiKey },
      ...cacheOptions(options),
    })
    if (response.status === 404) return { ...DEFAULT_LIVE_ROOM_SETTINGS }
    if (!response.ok) {
      throw new BunnyStorageError(
        `Failed to read live room settings: ${response.status} ${response.statusText}`,
      )
    }
    return toSettings(parseStore(await response.json()))
  } catch (error) {
    if (error instanceof BunnyStorageError) throw error
    console.warn('[liveRoomStore] Could not read live room settings:', error)
    return { ...DEFAULT_LIVE_ROOM_SETTINGS }
  }
}

export async function writeLiveRoomSettings(settings: LiveRoomSettings): Promise<void> {
  const merged = mergeZoomFieldsOnSave(settings)
  const body: LiveRoomFile = {
    version: 1,
    provider: merged.provider === 'zoom' ? 'zoom' : 'whereby',
    wherebyUrl: merged.wherebyUrl.trim().slice(0, MAX_URL_LENGTH),
    zoomEmbedUrl: merged.zoomEmbedUrl.trim().slice(0, MAX_URL_LENGTH),
    zoomMeetingNumber: merged.zoomMeetingNumber,
    zoomPasscode: merged.zoomPasscode.slice(0, MAX_PASSCODE_LENGTH),
  }
  await putObject('documents', LIVE_ROOM_STORE_NAME, JSON.stringify(body, null, 2), {
    contentType: 'application/json',
  })
}
