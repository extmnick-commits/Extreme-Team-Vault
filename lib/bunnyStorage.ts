import 'server-only'
import {
  documentCoverCdnUrl,
  encodeBunnyObjectPath,
  isDocumentCoverObjectName,
} from './documentCovers'
import type {
  Library,
  LibraryFile,
  LibraryGroup,
  LibraryView,
} from './libraryTypes'

export type BunnyStorageObject = {
  Guid: string
  StorageZoneName: string
  Path: string
  ObjectName: string
  Length: number
  LastChanged: string
  ServerId: number
  ArrayNumber: number
  IsDirectory: boolean
  UserId: string
  ContentType: string
  DateCreated: string
  StorageZoneId: number
  Checksum: string | null
  ReplicatedZones: string | null
}

export type ManifestSection = {
  id: string
  name: string
  description?: string
  /** Only top-level sections may be parents, so the tree is at most two levels deep. */
  parentId: string | null
}

export type ManifestEntry = {
  title?: string
  description?: string
  sectionId: string | null
  order: number
  /** Bunny object name under _covers/ for PDF preview image. */
  thumbnailName?: string
}

export type LibraryManifest = {
  version: 2
  sections: ManifestSection[]
  files: Record<string, ManifestEntry>
}

type ReadOptions = { fresh?: boolean }

export const MANIFEST_NAME = '_meta.json'

export const libraryTag = (library: Library) => `bunny:${library}`

const FALLBACK_FILE_TYPES: Record<Library, string> = {
  documents: 'PDF',
  audio: 'MP3',
}

const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

export class BunnyStorageError extends Error {}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

type BunnyConfig = { baseUrl: string; apiKey: string; cdnUrl: string }

function getConfig(): BunnyConfig {
  const region = process.env.BUNNY_STORAGE_REGION?.trim()
  const zoneName = process.env.BUNNY_STORAGE_ZONE_NAME
  const apiKey = process.env.BUNNY_STORAGE_API_KEY
  const cdnUrl = process.env.NEXT_PUBLIC_BUNNY_CDN_URL?.replace(/\/+$/, '')

  if (!zoneName || !apiKey || !cdnUrl) {
    throw new BunnyStorageError(
      'Missing BUNNY_STORAGE_ZONE_NAME, BUNNY_STORAGE_API_KEY, or NEXT_PUBLIC_BUNNY_CDN_URL.',
    )
  }

  const host = region ? `${region}.storage.bunnycdn.com` : 'storage.bunnycdn.com'
  return { baseUrl: `https://${host}/${zoneName}`, apiKey, cdnUrl }
}

function objectUrl(config: BunnyConfig, library: Library, name: string): string {
  return `${config.baseUrl}/${library}/${encodeBunnyObjectPath(name)}`
}

function cacheOptions(library: Library, { fresh }: ReadOptions) {
  return fresh
    ? { cache: 'no-store' as const }
    : { next: { revalidate: 60, tags: [libraryTag(library)] } }
}

// ---------------------------------------------------------------------------
// Low-level storage operations
// ---------------------------------------------------------------------------

function isBunnyStorageObjectArray(value: unknown): value is BunnyStorageObject[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as BunnyStorageObject).ObjectName === 'string' &&
        typeof (item as BunnyStorageObject).Length === 'number' &&
        typeof (item as BunnyStorageObject).IsDirectory === 'boolean',
    )
  )
}

export async function listObjects(
  library: Library,
  options: ReadOptions = {},
): Promise<BunnyStorageObject[]> {
  const config = getConfig()
  const response = await fetch(`${config.baseUrl}/${library}/`, {
    headers: { AccessKey: config.apiKey, Accept: 'application/json' },
    ...cacheOptions(library, options),
  })

  // Bunny returns 404 when the folder has never had a file in it.
  if (response.status === 404) return []
  if (!response.ok) {
    throw new BunnyStorageError(
      `Failed to list "${library}": ${response.status} ${response.statusText}`,
    )
  }

  const data: unknown = await response.json()
  if (!isBunnyStorageObjectArray(data)) {
    throw new BunnyStorageError(`Unexpected response shape for "${library}".`)
  }
  return data.filter(
    (item) =>
      !item.IsDirectory &&
      item.ObjectName !== MANIFEST_NAME &&
      item.ObjectName !== '_video-categories.json' &&
      item.ObjectName !== '_video-resources.json' &&
      !isDocumentCoverObjectName(item.ObjectName),
  )
}

export async function putObject(
  library: Library,
  name: string,
  body: ReadableStream<Uint8Array> | Uint8Array | string,
  options: { size?: number; contentType?: string } = {},
): Promise<void> {
  const config = getConfig()
  const headers: Record<string, string> = {
    AccessKey: config.apiKey,
    'Content-Type': options.contentType ?? 'application/octet-stream',
  }
  const requestBody: BodyInit =
    body instanceof Uint8Array
      ? new Blob([body.slice()], { type: options.contentType ?? 'application/octet-stream' })
      : body

  const byteLength =
    options.size ?? (body instanceof Uint8Array ? body.byteLength : undefined)
  if (byteLength !== undefined) headers['Content-Length'] = String(byteLength)

  const init: RequestInit & { duplex?: 'half' } = {
    method: 'PUT',
    headers,
    body: requestBody,
    cache: 'no-store',
  }
  if (typeof body !== 'string' && !(body instanceof Uint8Array)) init.duplex = 'half'

  const response = await fetch(objectUrl(config, library, name), init)
  if (!response.ok) {
    throw new BunnyStorageError(
      `Failed to upload "${library}/${name}": ${response.status} ${response.statusText}`,
    )
  }
}

export async function readObject(
  library: Library,
  name: string,
): Promise<{ body: ArrayBuffer; contentType: string }> {
  const config = getConfig()
  const response = await fetch(objectUrl(config, library, name), {
    headers: { AccessKey: config.apiKey },
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new BunnyStorageError(
      `Failed to read "${library}/${name}": ${response.status} ${response.statusText}`,
    )
  }
  return {
    body: await response.arrayBuffer(),
    contentType: response.headers.get('content-type') ?? 'application/octet-stream',
  }
}

export async function deleteObject(library: Library, name: string): Promise<void> {
  const config = getConfig()
  const response = await fetch(objectUrl(config, library, name), {
    method: 'DELETE',
    headers: { AccessKey: config.apiKey },
    cache: 'no-store',
  })
  if (!response.ok && response.status !== 404) {
    throw new BunnyStorageError(
      `Failed to delete "${library}/${name}": ${response.status} ${response.statusText}`,
    )
  }
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export function emptyManifest(): LibraryManifest {
  return { version: 2, sections: [], files: {} }
}

function parseSections(value: unknown): ManifestSection[] {
  if (!Array.isArray(value)) return []

  const raw = value
    .filter(
      (s): s is Record<string, unknown> =>
        typeof s === 'object' &&
        s !== null &&
        typeof (s as ManifestSection).id === 'string' &&
        typeof (s as ManifestSection).name === 'string',
    )
    .map<ManifestSection>((s) => ({
      id: s.id as string,
      name: s.name as string,
      description: typeof s.description === 'string' ? s.description : undefined,
      parentId: typeof s.parentId === 'string' ? s.parentId : null,
    }))

  // v1 manifests have no parentId, so every section becomes a top-level category.
  // A parentId pointing at a missing or non-top-level section is dropped.
  const ids = new Set(raw.map((s) => s.id))
  const topLevel = new Set(
    raw.filter((s) => s.parentId === null || !ids.has(s.parentId)).map((s) => s.id),
  )
  return raw.map((s) => ({
    ...s,
    parentId: s.parentId !== null && topLevel.has(s.parentId) && s.parentId !== s.id
      ? s.parentId
      : null,
  }))
}

export function isTopLevelSection(manifest: LibraryManifest, id: string): boolean {
  return manifest.sections.some((s) => s.id === id && s.parentId === null)
}

function parseManifest(value: unknown): LibraryManifest {
  if (typeof value !== 'object' || value === null) return emptyManifest()
  const raw = value as Partial<LibraryManifest>

  const sections = parseSections(raw.sections)

  const files: Record<string, ManifestEntry> = {}
  if (typeof raw.files === 'object' && raw.files !== null) {
    for (const [name, entry] of Object.entries(raw.files)) {
      if (typeof entry !== 'object' || entry === null) continue
      const thumbnailName =
        typeof entry.thumbnailName === 'string' && isDocumentCoverObjectName(entry.thumbnailName)
          ? entry.thumbnailName
          : undefined
      files[name] = {
        title: typeof entry.title === 'string' ? entry.title : undefined,
        description:
          typeof entry.description === 'string' ? entry.description : undefined,
        sectionId: typeof entry.sectionId === 'string' ? entry.sectionId : null,
        order: typeof entry.order === 'number' ? entry.order : 0,
        thumbnailName,
      }
    }
  }

  return { version: 2, sections, files }
}

export async function readManifest(
  library: Library,
  options: ReadOptions = {},
): Promise<LibraryManifest> {
  const config = getConfig()
  const response = await fetch(objectUrl(config, library, MANIFEST_NAME), {
    headers: { AccessKey: config.apiKey },
    ...cacheOptions(library, options),
  })

  if (response.status === 404) return emptyManifest()
  if (!response.ok) {
    throw new BunnyStorageError(
      `Failed to read manifest for "${library}": ${response.status} ${response.statusText}`,
    )
  }

  try {
    return parseManifest(await response.json())
  } catch {
    return emptyManifest()
  }
}

export async function writeManifest(
  library: Library,
  manifest: LibraryManifest,
): Promise<void> {
  await putObject(library, MANIFEST_NAME, JSON.stringify(manifest, null, 2), {
    contentType: 'application/json',
  })
}

export function nextOrder(manifest: LibraryManifest, sectionId: string | null): number {
  const orders = Object.values(manifest.files)
    .filter((entry) => entry.sectionId === sectionId)
    .map((entry) => entry.order)
  return orders.length === 0 ? 0 : Math.max(...orders) + 1
}

// ---------------------------------------------------------------------------
// File names
// ---------------------------------------------------------------------------

export function sanitizeFileName(original: string): string {
  const dot = original.lastIndexOf('.')
  const base = dot > 0 ? original.slice(0, dot) : original
  const ext = dot > 0 ? original.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : ''
  const cleanBase =
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100) || 'file'
  return ext ? `${cleanBase}.${ext}` : cleanBase
}

export function uniqueFileName(desired: string, existing: Set<string>): string {
  if (!existing.has(desired)) return desired
  const dot = desired.lastIndexOf('.')
  const base = dot > 0 ? desired.slice(0, dot) : desired
  const ext = dot > 0 ? desired.slice(dot) : ''
  let counter = 2
  while (existing.has(`${base}-${counter}${ext}`)) counter++
  return `${base}-${counter}${ext}`
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function getExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1) : ''
}

export function formatTitle(name: string): string {
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatFileSize(bytes: number): string {
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < SIZE_UNITS.length - 1) {
    size /= 1024
    unit++
  }
  const rounded = unit === 0 ? size.toString() : size.toFixed(1).replace(/\.0$/, '')
  return `${rounded} ${SIZE_UNITS[unit]}`
}

function formatDate(value: string): string {
  // Bunny returns timestamps without a timezone; they are UTC.
  const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? 'Unknown date' : dateFormatter.format(date)
}

function getFileType(name: string, library: Library): string {
  const extension = getExtension(name)
  return extension ? extension.toUpperCase() : FALLBACK_FILE_TYPES[library]
}

// ---------------------------------------------------------------------------
// Library view
// ---------------------------------------------------------------------------

function toLibraryFile(
  item: BunnyStorageObject,
  library: Library,
  entry: ManifestEntry | undefined,
  validSectionIds: Set<string>,
  cdnUrl: string,
): LibraryFile {
  const customTitle = entry?.title?.trim() ?? ''
  const customDescription = entry?.description?.trim() ?? ''
  const sectionId =
    entry?.sectionId && validSectionIds.has(entry.sectionId) ? entry.sectionId : null

  const thumbnailName = entry?.thumbnailName
  return {
    id: item.Guid,
    name: item.ObjectName,
    title: customTitle || formatTitle(item.ObjectName),
    description: customDescription || `Uploaded on ${formatDate(item.DateCreated)}`,
    fileType: getFileType(item.ObjectName, library),
    fileSize: formatFileSize(item.Length),
    cdnUrl: `${cdnUrl}/${library}/${encodeBunnyObjectPath(item.ObjectName)}`,
    thumbnailUrl:
      library === 'documents' && thumbnailName
        ? documentCoverCdnUrl(cdnUrl, library, thumbnailName)
        : undefined,
    sectionId,
    customTitle,
    customDescription,
  }
}

export async function getLibrary(
  library: Library,
  options: ReadOptions = {},
): Promise<LibraryView> {
  try {
    const { cdnUrl } = getConfig()
    const [objects, manifest] = await Promise.all([
      listObjects(library, options),
      readManifest(library, options),
    ])

    const validSectionIds = new Set(manifest.sections.map((s) => s.id))
    const files = objects.map((item) => ({
      item,
      entry: manifest.files[item.ObjectName],
      file: toLibraryFile(
        item,
        library,
        manifest.files[item.ObjectName],
        validSectionIds,
        cdnUrl,
      ),
    }))

    // Files with a manifest entry follow their saved order; files never
    // organized by an admin come after, newest first.
    const byOrder = (a: (typeof files)[number], b: (typeof files)[number]) => {
      const aOrdered = a.entry && a.file.sectionId === a.entry.sectionId
      const bOrdered = b.entry && b.file.sectionId === b.entry.sectionId
      if (aOrdered && bOrdered) return a.entry!.order - b.entry!.order
      if (aOrdered) return -1
      if (bOrdered) return 1
      return b.item.DateCreated.localeCompare(a.item.DateCreated)
    }

    const toGroup = (section: ManifestSection): LibraryGroup => ({
      id: section.id,
      name: section.name,
      description: section.description?.trim() ?? '',
      parentId: section.parentId,
      files: files
        .filter((f) => f.file.sectionId === section.id)
        .sort(byOrder)
        .map((f) => f.file),
      children: manifest.sections
        .filter((child) => child.parentId === section.id)
        .map(toGroup),
    })

    const sections = manifest.sections.filter((s) => s.parentId === null).map(toGroup)

    const unsorted = files
      .filter((f) => f.file.sectionId === null)
      .sort(byOrder)
      .map((f) => f.file)

    return { sections, unsorted }
  } catch (error) {
    console.error(`[bunnyStorage] Error loading "${library}":`, error)
    return {
      sections: [],
      unsorted: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
