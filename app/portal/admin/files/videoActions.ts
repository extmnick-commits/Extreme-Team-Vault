'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { requireAdmin } from '@/app/lib/session'
import {
  createVideo,
  deleteVideo as deleteStreamVideo,
  signTusUpload,
  syncVideoCategoryCollections,
  updateVideoDetails,
  uploadVideoThumbnail as uploadStreamVideoThumbnail,
  VIDEOS_TAG,
} from '@/lib/bunnyStream'
import {
  VIDEO_CATEGORIES_TAG,
  addCustomVideoCategory as persistCustomVideoCategory,
  isAllowedVideoCategoryId,
  readCustomVideoCategories,
  removeCustomVideoCategory as deleteCustomVideoCategory,
} from '@/lib/videoCategoryStore'
import type { ActionResult } from '@/lib/libraryTypes'
import {
  MAX_VIDEO_DESCRIPTION_LENGTH,
  MAX_VIDEO_TITLE_LENGTH,
  contentTypeForThumbnail,
  validateThumbnailFile,
  type VideoCategory,
} from '@/lib/videoTypes'

class ValidationError extends Error {}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function assertVideoId(videoId: unknown): asserts videoId is string {
  if (typeof videoId !== 'string' || videoId.length === 0 || videoId.includes('/')) {
    throw new ValidationError('Invalid video id.')
  }
}

async function revalidateVideos() {
  updateTag(VIDEOS_TAG)
  updateTag(VIDEO_CATEGORIES_TAG)
  revalidatePath('/portal/admin/files')
  revalidatePath('/portal/videos')
  revalidatePath('/portal/archive')
}

async function assertVideoCategory(category: unknown): Promise<VideoCategory> {
  const custom = await readCustomVideoCategories({ fresh: true })
  const customIds = custom.map((entry) => entry.id)
  if (typeof category !== 'string' || !isAllowedVideoCategoryId(category, custom)) {
    throw new ValidationError('Choose a video category.')
  }
  return category
}

async function run(fn: () => Promise<void>): Promise<ActionResult> {
  try {
    await requireAdmin()
    await fn()
    await revalidateVideos()
    return { ok: true }
  } catch (error) {
    console.error('[admin/videos]', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Something went wrong.',
    }
  }
}

export type CreateStreamUploadResult =
  | { ok: true; libraryId: string; videoId: string; expire: number; signature: string }
  | { ok: false; error: string }

export async function createStreamUpload(input: {
  title: string
  category: VideoCategory
}): Promise<CreateStreamUploadResult> {
  try {
    await requireAdmin()
    const category = await assertVideoCategory(input.category)
    const title = cleanText(input.title, MAX_VIDEO_TITLE_LENGTH)
    if (!title) throw new ValidationError('Title is required.')

    const { libraryId, videoId } = await createVideo(title, category)
    const { expire, signature } = signTusUpload(videoId)
    await revalidateVideos()
    return { ok: true, libraryId, videoId, expire, signature }
  } catch (error) {
    console.error('[admin/videos]', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not start upload.',
    }
  }
}

export async function refreshVideos(): Promise<ActionResult> {
  return run(async () => undefined)
}

export async function updateVideo(input: {
  videoId: string
  title: string
  description: string
}): Promise<ActionResult> {
  return run(async () => {
    assertVideoId(input.videoId)
    const title = cleanText(input.title, MAX_VIDEO_TITLE_LENGTH)
    if (!title) throw new ValidationError('Title is required.')
    await updateVideoDetails(input.videoId, {
      title,
      description: cleanText(input.description, MAX_VIDEO_DESCRIPTION_LENGTH),
    })
  })
}

export async function moveVideo(videoId: string, category: VideoCategory): Promise<ActionResult> {
  return run(async () => {
    assertVideoId(videoId)
    const nextCategory = await assertVideoCategory(category)
    await updateVideoDetails(videoId, { category: nextCategory })
  })
}

export async function addCustomVideoCategory(label: string): Promise<ActionResult> {
  return run(async () => {
    await persistCustomVideoCategory(label)
    await syncVideoCategoryCollections()
  })
}

export async function removeCustomVideoCategory(categoryId: string): Promise<ActionResult> {
  return run(async () => {
    await deleteCustomVideoCategory(categoryId)
  })
}

export async function deleteVideo(videoId: string): Promise<ActionResult> {
  return run(async () => {
    assertVideoId(videoId)
    await deleteStreamVideo(videoId)
  })
}

export async function uploadVideoThumbnail(formData: FormData): Promise<ActionResult> {
  return run(async () => {
    const videoId = formData.get('videoId')
    assertVideoId(videoId)
    const file = formData.get('thumbnail')
    if (!(file instanceof File) || file.size === 0) {
      throw new ValidationError('Choose a thumbnail image.')
    }
    const validationError = validateThumbnailFile(file)
    if (validationError) throw new ValidationError(validationError)

    const bytes = Buffer.from(await file.arrayBuffer())
    await uploadStreamVideoThumbnail(videoId, bytes, contentTypeForThumbnail(file))
  })
}
