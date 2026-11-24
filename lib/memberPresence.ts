import 'server-only'
import type { SessionRole } from '@/app/lib/session'
import { getVaultFirestore } from './firebaseAdmin'

export const PRESENCE_COLLECTION = 'vaultPresence'
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
  const stored = JSON.parse(JSON.stringify(presence)) as MemberPresence
  await getVaultFirestore().collection(PRESENCE_COLLECTION).doc(presence.memberId).set(stored)
}

export async function listMemberPresence(): Promise<MemberPresence[]> {
  const snap = await getVaultFirestore().collection(PRESENCE_COLLECTION).get()
  const rows: MemberPresence[] = []
  for (const doc of snap.docs) {
    const parsed = parseMemberPresence(doc.data(), doc.id)
    if (parsed) rows.push(parsed)
  }
  return rows.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))
}
