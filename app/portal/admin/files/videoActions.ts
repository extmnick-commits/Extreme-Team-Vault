'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { requireAdmin } from '@/app/lib/session'
import {
  createVideo,
  deleteVideo as deleteStreamVideo,
  signTusUpload,
  updateVideoDetails,
  VIDEOS_TAG,
} from '@/lib/bunnyStream'
import type { ActionResult } from '@/lib/libraryTypes'
import {
  MAX_VIDEO_DESCRIPTION_LENGTH,
  MAX_VIDEO_TITLE_LENGTH,
  isVideoCategory,
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
  revalidatePath('/portal/admin/files')
  revalidatePath('/portal/videos')
  revalidatePath('/portal/archive')
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
    if (!isVideoCategory(input.category)) throw new ValidationError('Choose Training or Archive.')
    const title = cleanText(input.title, MAX_VIDEO_TITLE_LENGTH)
    if (!title) throw new ValidationError('Title is required.')

    const { libraryId, videoId } = await createVideo(title, input.category)
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
    if (!isVideoCategory(category)) throw new ValidationError('Choose Training or Archive.')
    await updateVideoDetails(videoId, { category })
  })
}

export async function deleteVideo(videoId: string): Promise<ActionResult> {
  return run(async () => {
    assertVideoId(videoId)
    await deleteStreamVideo(videoId)
  })
}
