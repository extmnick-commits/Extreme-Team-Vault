import { NextResponse } from 'next/server'
import { parseAudioPayload, upsertAudioHistory } from '@/lib/memberHistory'
import { requireMemberIdentity } from '@/lib/portalMember'

export async function POST(request: Request) {
  const identity = await requireMemberIdentity()
  if (!identity.ok) return identity.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const entry = parseAudioPayload(body)
  if (!entry) {
    return NextResponse.json({ error: 'Invalid audio history.' }, { status: 400 })
  }

  try {
    await upsertAudioHistory(identity.memberId, entry)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[history/audio]', error)
    return NextResponse.json({ error: 'Could not save audio progress.' }, { status: 500 })
  }
}
