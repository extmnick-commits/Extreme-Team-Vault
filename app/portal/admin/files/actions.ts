'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath, updateTag } from 'next/cache'
import { del, get } from '@vercel/blob'
import { requireAdmin } from '@/app/lib/session'
import { getBlobAccess } from '@/lib/blobAccess'
import {
  MANIFEST_NAME,
  deleteObject,
  formatTitle,
  isTopLevelSection,
  libraryTag,
  listObjects,
  nextOrder,
  putObject,
  readManifest,
  sanitizeFileName,
  uniqueFileName,
  writeManifest,
  type LibraryManifest,
} from '@/lib/bunnyStorage'
import {
  BLOB_STAGING_PREFIX,
  isLibrary,
  type ActionResult,
  type Library,
} from '@/lib/libraryTypes'

const MAX_TITLE_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 500
const MAX_SECTION_NAME_LENGTH = 80
const MAX_BULK_FILES = 500

class ValidationError extends Error {}

async function run(library: unknown, fn: (library: Library) => Promise<void>): Promise<ActionResult> {
  try {
    await requireAdmin()
    if (!isLibrary(library)) throw new ValidationError('Unknown library.')
    await fn(library)
    updateTag(libraryTag(library))
    revalidatePath('/portal/admin/files')
    return { ok: true }
  } catch (error) {
    console.error('[admin/files]', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Something went wrong.',
    }
  }
}

async function updateManifest(
  library: Library,
  mutate: (manifest: LibraryManifest) => void,
): Promise<void> {
  const manifest = await readManifest(library, { fresh: true })
  mutate(manifest)
  await writeManifest(library, manifest)
}

function assertFileName(name: unknown): asserts name is string {
  if (
    typeof name !== 'string' ||
    name.length === 0 ||
    name === MANIFEST_NAME ||
    name.includes('/') ||
    name.includes('\\')
  ) {
    throw new ValidationError('Invalid file name.')
  }
}

function assertFileNames(names: unknown): asserts names is string[] {
  if (!Array.isArray(names) || names.length > MAX_BULK_FILES) {
    throw new ValidationError('Invalid file list.')
  }
  names.forEach(assertFileName)
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function resolveSectionId(manifest: LibraryManifest, sectionId: unknown): string | null {
  return typeof sectionId === 'string' && manifest.sections.some((s) => s.id === sectionId)
    ? sectionId
    : null
}

/** Validates a parent for a section: `null` (top level) or an existing top-level section. */
function resolveParentId(manifest: LibraryManifest, parentId: unknown): string | null {
  if (parentId === null || parentId === undefined || parentId === '') return null
  if (typeof parentId !== 'string' || !isTopLevelSection(manifest, parentId)) {
    throw new ValidationError('Sections can only be nested one level deep.')
  }
  return parentId
}

function assertStagingUrl(blobUrl: unknown): asserts blobUrl is string {
  let url: URL
  try {
    url = new URL(String(blobUrl))
  } catch {
    throw new ValidationError('Invalid upload URL.')
  }
  if (
    url.protocol !== 'https:' ||
    !url.hostname.endsWith('.blob.vercel-storage.com') ||
    !url.pathname.startsWith(`/${BLOB_STAGING_PREFIX}`)
  ) {
    throw new ValidationError('Invalid upload URL.')
  }
}

/**
 * Copies a client-uploaded staging blob into Bunny Storage under a unique,
 * sanitized name, then removes the staging blob. Returns the stored name.
 */
async function ingestStagedBlob(
  library: Library,
  blobUrl: unknown,
  originalName: string,
): Promise<string> {
  assertStagingUrl(blobUrl)

  try {
    const blob = await get(blobUrl, { access: getBlobAccess(), useCache: false })
    if (!blob || blob.statusCode !== 200) {
      throw new ValidationError('Uploaded file could not be found. Please try again.')
    }

    const existing = new Set(
      (await listObjects(library, { fresh: true })).map((o) => o.ObjectName),
    )
    const name = uniqueFileName(sanitizeFileName(originalName), existing)

    await putObject(library, name, blob.stream, {
      size: blob.blob.size,
      contentType: blob.blob.contentType,
    })
    return name
  } finally {
    await del(blobUrl).catch((error) =>
      console.error('[admin/files] Failed to delete staging blob', error),
    )
  }
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

export async function finalizeUpload(input: {
  library: Library
  blobUrl: string
  originalName: string
  title?: string
  sectionId?: string | null
}): Promise<ActionResult> {
  return run(input.library, async (library) => {
    const name = await ingestStagedBlob(library, input.blobUrl, input.originalName)

    await updateManifest(library, (manifest) => {
      const sectionId = resolveSectionId(manifest, input.sectionId)
      const title = cleanText(input.title, MAX_TITLE_LENGTH)
      manifest.files[name] = {
        title: title || undefined,
        sectionId,
        order: nextOrder(manifest, sectionId),
      }
    })
  })
}

export async function replaceFile(input: {
  library: Library
  name: string
  blobUrl: string
  originalName: string
}): Promise<ActionResult> {
  return run(input.library, async (library) => {
    const oldName = input.name
    assertFileName(oldName)

    const objects = await listObjects(library, { fresh: true })
    if (!objects.some((o) => o.ObjectName === oldName)) {
      throw new ValidationError('The file you are replacing no longer exists.')
    }

    // A new object name sidesteps Bunny CDN serving a cached copy of the old file.
    const newName = await ingestStagedBlob(library, input.blobUrl, input.originalName)

    await updateManifest(library, (manifest) => {
      const entry = manifest.files[oldName] ?? {
        sectionId: null,
        order: nextOrder(manifest, null),
      }
      manifest.files[newName] = {
        ...entry,
        title: entry.title ?? formatTitle(oldName),
      }
      delete manifest.files[oldName]
    })

    await deleteObject(library, oldName)
  })
}

export async function updateFile(
  library: Library,
  name: string,
  details: { title: string; description: string },
): Promise<ActionResult> {
  return run(library, async (lib) => {
    assertFileName(name)
    await updateManifest(lib, (manifest) => {
      const title = cleanText(details.title, MAX_TITLE_LENGTH)
      const description = cleanText(details.description, MAX_DESCRIPTION_LENGTH)
      const entry = manifest.files[name] ?? {
        sectionId: null,
        order: nextOrder(manifest, null),
      }
      manifest.files[name] = {
        ...entry,
        title: title || undefined,
        description: description || undefined,
      }
    })
  })
}

export async function moveFile(
  library: Library,
  name: string,
  sectionId: string | null,
): Promise<ActionResult> {
  return bulkMoveFiles(library, [name], sectionId)
}

export async function bulkMoveFiles(
  library: Library,
  names: string[],
  sectionId: string | null,
): Promise<ActionResult> {
  return run(library, async (lib) => {
    assertFileNames(names)
    await updateManifest(lib, (manifest) => {
      const target = resolveSectionId(manifest, sectionId)
      for (const name of names) {
        const entry = manifest.files[name]
        if (entry && entry.sectionId === target) continue
        manifest.files[name] = {
          ...entry,
          sectionId: target,
          order: nextOrder(manifest, target),
        }
      }
    })
  })
}

/** Sets the order of files in a section; files from other sections are moved into it. */
export async function reorderFiles(
  library: Library,
  sectionId: string | null,
  orderedNames: string[],
): Promise<ActionResult> {
  return run(library, async (lib) => {
    assertFileNames(orderedNames)
    await updateManifest(lib, (manifest) => {
      const target = resolveSectionId(manifest, sectionId)
      orderedNames.forEach((name, index) => {
        manifest.files[name] = {
          ...manifest.files[name],
          sectionId: target,
          order: index,
        }
      })
    })
  })
}

export async function deleteFile(library: Library, name: string): Promise<ActionResult> {
  return bulkDeleteFiles(library, [name])
}

export async function bulkDeleteFiles(library: Library, names: string[]): Promise<ActionResult> {
  return run(library, async (lib) => {
    assertFileNames(names)
    const results = await Promise.allSettled(names.map((name) => deleteObject(lib, name)))
    const deleted = names.filter((_, i) => results[i].status === 'fulfilled')

    await updateManifest(lib, (manifest) => {
      for (const name of deleted) delete manifest.files[name]
    })

    const failed = names.length - deleted.length
    if (failed > 0) {
      throw new Error(`${failed} of ${names.length} files could not be deleted.`)
    }
  })
}

// ---------------------------------------------------------------------------
// Sections (categories and their albums / subcategories)
// ---------------------------------------------------------------------------

export async function createSection(
  library: Library,
  name: string,
  parentId: string | null = null,
): Promise<ActionResult> {
  return run(library, async (lib) => {
    const clean = cleanText(name, MAX_SECTION_NAME_LENGTH)
    if (!clean) throw new ValidationError('Name is required.')
    await updateManifest(lib, (manifest) => {
      manifest.sections.push({
        id: randomUUID().slice(0, 8),
        name: clean,
        parentId: resolveParentId(manifest, parentId),
      })
    })
  })
}

export async function updateSection(
  library: Library,
  sectionId: string,
  details: { name: string; description: string },
): Promise<ActionResult> {
  return run(library, async (lib) => {
    const name = cleanText(details.name, MAX_SECTION_NAME_LENGTH)
    const description = cleanText(details.description, MAX_DESCRIPTION_LENGTH)
    if (!name) throw new ValidationError('Name is required.')
    await updateManifest(lib, (manifest) => {
      const section = manifest.sections.find((s) => s.id === sectionId)
      if (!section) throw new ValidationError('Section not found.')
      section.name = name
      section.description = description || undefined
    })
  })
}

/**
 * Places `orderedIds` under `parentId` in the given order. Sections coming
 * from another parent are moved under this one.
 */
function placeSections(manifest: LibraryManifest, parentId: unknown, orderedIds: unknown) {
  if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== 'string')) {
    throw new ValidationError('Invalid order.')
  }
  const target = resolveParentId(manifest, parentId)
  const byId = new Map(manifest.sections.map((s) => [s.id, s]))
  const ordered = (orderedIds as string[]).map((id) => {
    const section = byId.get(id)
    if (!section) throw new ValidationError('Section not found.')
    if (target !== null) {
      if (id === target) throw new ValidationError('A section cannot contain itself.')
      if (manifest.sections.some((s) => s.parentId === id)) {
        throw new ValidationError('Sections that have their own children cannot be nested.')
      }
    }
    return section
  })

  const orderedSet = new Set(orderedIds)
  for (const section of ordered) section.parentId = target
  manifest.sections = [...manifest.sections.filter((s) => !orderedSet.has(s.id)), ...ordered]
}

export async function reorderSections(
  library: Library,
  parentId: string | null,
  orderedIds: string[],
): Promise<ActionResult> {
  return run(library, (lib) =>
    updateManifest(lib, (manifest) => placeSections(manifest, parentId, orderedIds)),
  )
}

export async function moveSectionTo(
  library: Library,
  sectionId: string,
  parentId: string | null,
): Promise<ActionResult> {
  return run(library, (lib) =>
    updateManifest(lib, (manifest) => {
      const target = parentId || null
      const siblings = manifest.sections
        .filter((s) => s.parentId === target && s.id !== sectionId)
        .map((s) => s.id)
      placeSections(manifest, target, [...siblings, sectionId])
    }),
  )
}

export async function deleteSection(library: Library, sectionId: string): Promise<ActionResult> {
  return run(library, async (lib) => {
    await updateManifest(lib, (manifest) => {
      manifest.sections = manifest.sections.filter((s) => s.id !== sectionId)
      for (const section of manifest.sections) {
        if (section.parentId === sectionId) section.parentId = null
      }
      let order = nextOrder(manifest, null)
      for (const entry of Object.values(manifest.files)) {
        if (entry.sectionId === sectionId) {
          entry.sectionId = null
          entry.order = order++
        }
      }
    })
  })
}
