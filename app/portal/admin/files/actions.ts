'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath, updateTag } from 'next/cache'
import { del, get } from '@vercel/blob'
import { requireAdmin } from '@/app/lib/session'
import { getBlobAccess } from '@/lib/blobAccess'
import {
  MANIFEST_NAME,
  deleteObject,
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

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function resolveSectionId(manifest: LibraryManifest, sectionId: unknown): string | null {
  return typeof sectionId === 'string' && manifest.sections.some((s) => s.id === sectionId)
    ? sectionId
    : null
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
    assertStagingUrl(input.blobUrl)
    const blobUrl = input.blobUrl

    try {
      const blob = await get(blobUrl, { access: getBlobAccess(), useCache: false })
      if (!blob || blob.statusCode !== 200) {
        throw new ValidationError('Uploaded file could not be found. Please try again.')
      }

      const existing = new Set(
        (await listObjects(library, { fresh: true })).map((o) => o.ObjectName),
      )
      const name = uniqueFileName(sanitizeFileName(input.originalName), existing)

      await putObject(library, name, blob.stream, {
        size: blob.blob.size,
        contentType: blob.blob.contentType,
      })

      await updateManifest(library, (manifest) => {
        const sectionId = resolveSectionId(manifest, input.sectionId)
        const title = cleanText(input.title, MAX_TITLE_LENGTH)
        manifest.files[name] = {
          title: title || undefined,
          sectionId,
          order: nextOrder(manifest, sectionId),
        }
      })
    } finally {
      await del(blobUrl).catch((error) =>
        console.error('[admin/files] Failed to delete staging blob', error),
      )
    }
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
  return run(library, async (lib) => {
    assertFileName(name)
    await updateManifest(lib, (manifest) => {
      const target = resolveSectionId(manifest, sectionId)
      const entry = manifest.files[name]
      if (entry && entry.sectionId === target) return
      manifest.files[name] = {
        ...entry,
        sectionId: target,
        order: nextOrder(manifest, target),
      }
    })
  })
}

export async function reorderFiles(
  library: Library,
  sectionId: string | null,
  orderedNames: string[],
): Promise<ActionResult> {
  return run(library, async (lib) => {
    if (!Array.isArray(orderedNames)) throw new ValidationError('Invalid order.')
    orderedNames.forEach(assertFileName)
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
  return run(library, async (lib) => {
    assertFileName(name)
    await deleteObject(lib, name)
    await updateManifest(lib, (manifest) => {
      delete manifest.files[name]
    })
  })
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export async function createSection(library: Library, name: string): Promise<ActionResult> {
  return run(library, async (lib) => {
    const clean = cleanText(name, MAX_SECTION_NAME_LENGTH)
    if (!clean) throw new ValidationError('Section name is required.')
    await updateManifest(lib, (manifest) => {
      manifest.sections.push({ id: randomUUID().slice(0, 8), name: clean })
    })
  })
}

export async function renameSection(
  library: Library,
  sectionId: string,
  name: string,
): Promise<ActionResult> {
  return run(library, async (lib) => {
    const clean = cleanText(name, MAX_SECTION_NAME_LENGTH)
    if (!clean) throw new ValidationError('Section name is required.')
    await updateManifest(lib, (manifest) => {
      const section = manifest.sections.find((s) => s.id === sectionId)
      if (!section) throw new ValidationError('Section not found.')
      section.name = clean
    })
  })
}

export async function moveSection(
  library: Library,
  sectionId: string,
  direction: 'up' | 'down',
): Promise<ActionResult> {
  return run(library, async (lib) => {
    await updateManifest(lib, (manifest) => {
      const index = manifest.sections.findIndex((s) => s.id === sectionId)
      const target = direction === 'up' ? index - 1 : index + 1
      if (index < 0 || target < 0 || target >= manifest.sections.length) return
      const [section] = manifest.sections.splice(index, 1)
      manifest.sections.splice(target, 0, section)
    })
  })
}

export async function deleteSection(library: Library, sectionId: string): Promise<ActionResult> {
  return run(library, async (lib) => {
    await updateManifest(lib, (manifest) => {
      manifest.sections = manifest.sections.filter((s) => s.id !== sectionId)
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
