'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { requireAdmin } from '@/app/lib/session'
import { listObjects } from '@/lib/bunnyStorage'
import type { ActionResult } from '@/lib/libraryTypes'
import {
  VIDEO_RESOURCES_TAG,
  attachVideoDocument,
  detachVideoDocument,
} from '@/lib/videoResources'
import { MAX_VIDEO_ATTACHMENT_LABEL_LENGTH } from '@/lib/videoTypes'

class ValidationError extends Error {}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function assertVideoId(videoId: unknown): asserts videoId is string {
  if (typeof videoId !== 'string' || videoId.length === 0 || videoId.includes('/')) {
    throw new ValidationError('Invalid video id.')
  }
}

function assertDocumentName(documentName: unknown): asserts documentName is string {
  if (
    typeof documentName !== 'string' ||
    documentName.length === 0 ||
    documentName === '_video-resources.json' ||
    documentName === '_video-categories.json' ||
    documentName.includes('/') ||
    documentName.includes('\\')
  ) {
    throw new ValidationError('Invalid document name.')
  }
}

async function revalidateVideoResources() {
  updateTag(VIDEO_RESOURCES_TAG)
  revalidatePath('/portal/admin/files')
  revalidatePath('/portal/videos')
  revalidatePath('/portal/archive')
}

async function run(fn: () => Promise<void>): Promise<ActionResult> {
  try {
    await requireAdmin()
    await fn()
    await revalidateVideoResources()
    return { ok: true }
  } catch (error) {
    console.error('[admin/video-resources]', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Something went wrong.',
    }
  }
}

export async function attachVideoDocumentAction(input: {
  videoId: string
  documentName: string
  label?: string
}): Promise<ActionResult> {
  return run(async () => {
    assertVideoId(input.videoId)
    assertDocumentName(input.documentName)

    const objects = await listObjects('documents', { fresh: true })
    if (!objects.some((item) => item.ObjectName === input.documentName)) {
      throw new ValidationError('That PDF is not in the document library.')
    }

    await attachVideoDocument(
      input.videoId,
      input.documentName,
      cleanText(input.label, MAX_VIDEO_ATTACHMENT_LABEL_LENGTH) || undefined,
    )
  })
}

export async function detachVideoDocumentAction(input: {
  videoId: string
  documentName: string
}): Promise<ActionResult> {
  return run(async () => {
    assertVideoId(input.videoId)
    assertDocumentName(input.documentName)
    await detachVideoDocument(input.videoId, input.documentName)
  })
}
