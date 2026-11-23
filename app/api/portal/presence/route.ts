import { NextResponse } from 'next/server'
import { getSession, sessionDisplayName } from '@/app/lib/session'
import {
  parseMemberPresence,
  writeMemberPresence,
  type MemberActivityKind,
  type MemberPresence,
} from '@/lib/memberPresence'
import { requireMemberIdentity } from '@/lib/portalMember'

function parseActivityKind(value: unknown): MemberActivityKind | undefined {
  return value === 'video' ||
    value === 'audio' ||
    value === 'pdf' ||
    value === 'browsing' ||
    value === 'idle'
    ? value
    : undefined
}

export async function POST(request: Request) {
  const identity = await requireMemberIdentity()
  if (!identity.ok) return identity.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const raw = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  const path = typeof raw.path === 'string' ? raw.path.slice(0, 300) : '/portal'
  const session = await getSession()
  const role = session?.role === 'admin' ? 'admin' : 'member'

  const activityRaw =
    typeof raw.activity === 'object' && raw.activity !== null
      ? (raw.activity as Record<string, unknown>)
      : null
  const kind = activityRaw ? parseActivityKind(activityRaw.kind) : undefined

  const presence: MemberPresence = {
    memberId: identity.memberId,
    displayName: sessionDisplayName(session),
    role,
    lastSeenAt: new Date().toISOString(),
    path,
    activity: kind
      ? {
          kind,
          title: typeof activityRaw?.title === 'string' ? activityRaw.title.slice(0, 240) : undefined,
          detail: typeof activityRaw?.detail === 'string' ? activityRaw.detail.slice(0, 120) : undefined,
        }
      : { kind: 'browsing' },
  }

  const validated = parseMemberPresence(presence, identity.memberId)
  if (!validated) {
    return NextResponse.json({ error: 'Invalid presence payload.' }, { status: 400 })
  }

  try {
    await writeMemberPresence(validated)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[presence]', error)
    return NextResponse.json({ error: 'Could not update presence.' }, { status: 500 })
  }
}