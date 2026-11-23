import 'server-only'
import { get, list, put } from '@vercel/blob'
import type { SessionRole } from '@/app/lib/session'
import { getBlobAccess } from './blobAccess'

export const PRESENCE_PREFIX = 'member-presence/'
export const ACTIVE_NOW_MS = 5 * 60 * 1000

export type MemberActivityKind = 'video' | 'audio' | 'pdf' | 'browsing' | 'idle'

export type MemberPresence = {
  memberId: string
  displayName?: string
  role: SessionRole
  lastSeenAt: string
  path: string
  activity?: {
    kind: MemberActivityKind
    title?: string
    detail?: string
  }
}

function presencePath(memberId: string): string {
  return `${PRESENCE_PREFIX}${memberId}.json`
}

export function parseMemberPresence(value: unknown, memberId: string): MemberPresence | null {
  if (typeof value !== 'object' || value === null) return null
  const raw = value as Partial<MemberPresence>
  if (typeof raw.lastSeenAt !== 'string' || !raw.lastSeenAt) return null
  const role = raw.role === 'admin' ? 'admin' : 'member'
  const kind = raw.activity?.kind
  const activityKind: MemberActivityKind | undefined =
    kind === 'video' || kind === 'audio' || kind === 'pdf' || kind === 'browsing' || kind === 'idle'
      ? kind
      : undefined
  const displayName =
    typeof raw.displayName === 'string' && raw.displayName.trim()
      ? raw.displayName.trim().slice(0, 80)
      : undefined
  return {
    memberId,
    displayName,
    role,
    lastSeenAt: raw.lastSeenAt,
    path: typeof raw.path === 'string' ? raw.path.slice(0, 300) : '/portal',
    activity: activityKind
      ? {
          kind: activityKind,
          title: typeof raw.activity?.title === 'string' ? raw.activity.title.slice(0, 240) : undefined,
          detail: typeof raw.activity?.detail === 'string' ? raw.activity.detail.slice(0, 120) : undefined,
        }
      : undefined,
  }
}

export async function writeMemberPresence(presence: MemberPresence): Promise<void> {
  await put(presencePath(presence.memberId), JSON.stringify(presence), {
    access: getBlobAccess(),
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 30,
  })
}

export async function listMemberPresence(): Promise<MemberPresence[]> {
  const { blobs } = await list({ prefix: PRESENCE_PREFIX, limit: 500 })
  const rows: MemberPresence[] = []

  await Promise.all(
    blobs.map(async (blob) => {
      const memberId = blob.pathname.slice(PRESENCE_PREFIX.length).replace(/\.json$/, '')
      if (!memberId) return
      try {
        const result = await get(blob.pathname, {
          access: getBlobAccess(),
          useCache: false,
        })
        if (!result || result.statusCode !== 200 || !result.stream) return
        const text = await new Response(result.stream).text()
        const parsed = parseMemberPresence(JSON.parse(text) as unknown, memberId)
        if (parsed) rows.push(parsed)
      } catch {
        // skip broken blob
      }
    }),
  )

  return rows.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))
}