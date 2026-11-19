import 'server-only'
import { NextResponse } from 'next/server'
import { getOrCreateMemberId, getSession } from '@/app/lib/session'

export async function requireMemberIdentity(): Promise<
  { ok: true; memberId: string } | { ok: false; response: NextResponse }
> {
  const session = await getSession()
  if (!session?.authenticated) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  const memberId = await getOrCreateMemberId(session)
  return { ok: true, memberId }
}
