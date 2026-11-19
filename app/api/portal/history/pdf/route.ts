import { NextResponse } from 'next/server'
import { parsePdfPayload, upsertPdfHistory } from '@/lib/memberHistory'
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

  const entry = parsePdfPayload(body)
  if (!entry) {
    return NextResponse.json({ error: 'Invalid PDF history.' }, { status: 400 })
  }

  try {
    await upsertPdfHistory(identity.memberId, entry)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[history/pdf]', error)
    return NextResponse.json({ error: 'Could not save PDF history.' }, { status: 500 })
  }
}
