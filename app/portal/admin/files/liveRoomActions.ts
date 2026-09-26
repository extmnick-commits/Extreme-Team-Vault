'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { requireAdmin } from '@/app/lib/session'
import {
  validateLiveRoomSettings,
  type LiveRoomProvider,
  type LiveRoomSettings,
} from '@/lib/liveRoomConfig'
import { LIVE_ROOM_TAG, readLiveRoomSettings, writeLiveRoomSettings } from '@/lib/liveRoomStore'
import type { ActionResult } from '@/lib/libraryTypes'

class ValidationError extends Error {}

function parseProvider(value: unknown): LiveRoomProvider {
  return value === 'zoom' ? 'zoom' : 'whereby'
}

function cleanUrl(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function envWherebyUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_WHEREBY_URL?.trim() || undefined
}

async function revalidateLiveRoom() {
  updateTag(LIVE_ROOM_TAG)
  revalidatePath('/portal/admin/files')
  revalidatePath('/portal/live')
}

export async function updateLiveRoomSettings(input: {
  provider: LiveRoomProvider
  wherebyUrl: string
  zoomEmbedUrl: string
}): Promise<ActionResult> {
  try {
    await requireAdmin()
    const settings: LiveRoomSettings = {
      provider: parseProvider(input.provider),
      wherebyUrl: cleanUrl(input.wherebyUrl),
      zoomEmbedUrl: cleanUrl(input.zoomEmbedUrl),
    }
    const validationError = validateLiveRoomSettings(settings, { envWherebyUrl: envWherebyUrl() })
    if (validationError) throw new ValidationError(validationError)

    await writeLiveRoomSettings(settings)
    await revalidateLiveRoom()
    return { ok: true }
  } catch (error) {
    console.error('[admin/live-room]', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not save live room settings.',
    }
  }
}

export async function setLiveRoomProvider(provider: LiveRoomProvider): Promise<ActionResult> {
  try {
    await requireAdmin()
    const current = await readLiveRoomSettings({ fresh: true })
    const next: LiveRoomSettings = {
      ...current,
      provider: parseProvider(provider),
    }
    const validationError = validateLiveRoomSettings(next, { envWherebyUrl: envWherebyUrl() })
    if (validationError) throw new ValidationError(validationError)

    await writeLiveRoomSettings(next)
    await revalidateLiveRoom()
    return { ok: true }
  } catch (error) {
    console.error('[admin/live-room]', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not switch live room provider.',
    }
  }
}
