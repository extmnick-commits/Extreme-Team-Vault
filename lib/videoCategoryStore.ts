import 'server-only'
import { BunnyStorageError, putObject } from './bunnyStorage'
import {
  BUILTIN_VIDEO_CATEGORIES,
  VIDEO_CATEGORY_LABELS,
  slugifyVideoCategory,
  type BuiltinVideoCategory,
  type CustomVideoCategory,
} from './videoTypes'

export const VIDEO_CATEGORIES_STORE_NAME = '_video-categories.json'

export const VIDEO_CATEGORIES_TAG = 'bunny:video-categories'

type VideoCategoriesFile = {
  version: 1
  categories: CustomVideoCategory[]
}

type ReadOptions = { fresh?: boolean }

function emptyStore(): VideoCategoriesFile {
  return { version: 1, categories: [] }
}

function parseStore(value: unknown): VideoCategoriesFile {
  if (typeof value !== 'object' || value === null) return emptyStore()
  const raw = value as Partial<VideoCategoriesFile>
  if (!Array.isArray(raw.categories)) return emptyStore()

  const categories: CustomVideoCategory[] = []
  const seen = new Set<string>()

  for (const item of raw.categories) {
    if (typeof item !== 'object' || item === null) continue
    const id = typeof item.id === 'string' ? item.id.trim() : ''
    const label = typeof item.label === 'string' ? item.label.trim() : ''
    if (!id || !label || seen.has(id)) continue
    if ((BUILTIN_VIDEO_CATEGORIES as readonly string[]).includes(id)) continue
    seen.add(id)
    categories.push({ id, label: label.slice(0, 80) })
  }

  return { version: 1, categories }
}

function cacheOptions({ fresh }: ReadOptions) {
  return fresh
    ? { cache: 'no-store' as const }
    : { next: { revalidate: 60, tags: [VIDEO_CATEGORIES_TAG] } }
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
  const url = `https://${host}/${zoneName}/documents/${encodeURIComponent(VIDEO_CATEGORIES_STORE_NAME)}`
  return { url, apiKey }
}

export async function readCustomVideoCategories(
  options: ReadOptions = {},
): Promise<CustomVideoCategory[]> {
  try {
    const { url, apiKey } = await storeObjectUrl()
    const response = await fetch(url, {
      headers: { AccessKey: apiKey },
      ...cacheOptions(options),
    })
    if (response.status === 404) return []
    if (!response.ok) {
      throw new BunnyStorageError(
        `Failed to read video categories: ${response.status} ${response.statusText}`,
      )
    }
    return parseStore(await response.json()).categories
  } catch (error) {
    if (error instanceof BunnyStorageError) throw error
    console.warn('[videoCategoryStore] Could not read custom categories:', error)
    return []
  }
}

async function writeCustomVideoCategories(categories: CustomVideoCategory[]): Promise<void> {
  const body: VideoCategoriesFile = { version: 1, categories }
  await putObject('documents', VIDEO_CATEGORIES_STORE_NAME, JSON.stringify(body, null, 2), {
    contentType: 'application/json',
  })
}

export async function getVideoCategoryLabelMap(): Promise<Record<string, string>> {
  const custom = await readCustomVideoCategories()
  const labels: Record<string, string> = { ...VIDEO_CATEGORY_LABELS }
  for (const entry of custom) labels[entry.id] = entry.label
  return labels
}

export async function getAllVideoCategoryIds(): Promise<string[]> {
  const custom = await readCustomVideoCategories()
  return [...BUILTIN_VIDEO_CATEGORIES, ...custom.map((c) => c.id)]
}

export function isAllowedVideoCategoryId(
  id: string,
  custom: readonly CustomVideoCategory[],
): boolean {
  if ((BUILTIN_VIDEO_CATEGORIES as readonly string[]).includes(id)) return true
  return custom.some((entry) => entry.id === id)
}

const MAX_CUSTOM_CATEGORIES = 40
const MAX_LABEL_LENGTH = 80

export async function addCustomVideoCategory(label: string): Promise<CustomVideoCategory> {
  const trimmed = label.trim().slice(0, MAX_LABEL_LENGTH)
  if (!trimmed) throw new BunnyStorageError('Category name is required.')

  const id = slugifyVideoCategory(trimmed)
  if (!id) throw new BunnyStorageError('Use letters or numbers in the category name.')

  if ((BUILTIN_VIDEO_CATEGORIES as readonly string[]).includes(id)) {
    throw new BunnyStorageError('That name matches a built-in category.')
  }

  const existing = await readCustomVideoCategories({ fresh: true })
  if (existing.some((entry) => entry.id === id || entry.label.toLowerCase() === trimmed.toLowerCase())) {
    throw new BunnyStorageError('That category already exists.')
  }
  if (existing.length >= MAX_CUSTOM_CATEGORIES) {
    throw new BunnyStorageError(`You can add up to ${MAX_CUSTOM_CATEGORIES} custom categories.`)
  }

  const created: CustomVideoCategory = { id, label: trimmed }
  await writeCustomVideoCategories([...existing, created])
  return created
}

export async function removeCustomVideoCategory(id: string): Promise<void> {
  const normalized = id.trim()
  if (!normalized) throw new BunnyStorageError('Invalid category.')
  if ((BUILTIN_VIDEO_CATEGORIES as readonly string[]).includes(normalized)) {
    throw new BunnyStorageError('Built-in categories cannot be removed.')
  }

  const existing = await readCustomVideoCategories({ fresh: true })
  const next = existing.filter((entry) => entry.id !== normalized)
  if (next.length === existing.length) {
    throw new BunnyStorageError('Category not found.')
  }
  await writeCustomVideoCategories(next)
}

export type { BuiltinVideoCategory }
