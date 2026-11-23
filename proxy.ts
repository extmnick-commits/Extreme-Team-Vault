import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { SESSION_COOKIE } from '@/app/lib/session'
import {
  MEMBER_COOKIE,
  isMemberId,
  memberCookieSetOptions,
  newMemberId,
  signMemberToken,
  verifyMemberToken,
} from '@/lib/memberCookie'
import { applySecurityHeaders } from '@/lib/securityHeaders'

// Encode the secret key inline — proxy runs in the edge-like Node runtime
// and cannot import from 'server-only' modules.
function getEncodedKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return new TextEncoder().encode(secret)
}

type VerifiedSession = { role: 'admin' | 'member'; memberId: string | null }

async function verifySession(
  token: string | undefined
): Promise<VerifiedSession | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ['HS256'],
    })
    return {
      role: payload.role === 'admin' ? 'admin' : 'member',
      memberId: isMemberId(payload.memberId) ? payload.memberId : null,
    }
  } catch {
    return null
  }
}

function unauthorizedJson(): NextResponse {
  const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  response.headers.set('Cache-Control', 'private, no-store')
  return applySecurityHeaders(response)
}

async function continueWithSession(
  request: NextRequest,
  session: VerifiedSession,
): Promise<NextResponse> {
  const response = applySecurityHeaders(NextResponse.next())
  response.headers.set('Cache-Control', 'private, no-store')
  return attachMemberCookie(request, response, session)
}

async function attachMemberCookie(
  request: NextRequest,
  response: NextResponse,
  session: VerifiedSession,
): Promise<NextResponse> {
  const cookieMemberId = await verifyMemberToken(
    request.cookies.get(MEMBER_COOKIE)?.value,
  )
  const memberId = session.memberId ?? cookieMemberId ?? newMemberId()
  if (memberId !== cookieMemberId) {
    response.cookies.set(
      MEMBER_COOKIE,
      await signMemberToken(memberId),
      memberCookieSetOptions(),
    )
  }
  return response
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = await verifySession(token)
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/admin/')) {
    if (!session || session.role !== 'admin') {
      return unauthorizedJson()
    }
    const response = applySecurityHeaders(NextResponse.next())
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  }

  if (pathname.startsWith('/api/portal/')) {
    if (!session) {
      return unauthorizedJson()
    }
    return continueWithSession(request, session)
  }

  if (!session) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL('/', request.url)),
    )
  }

  const isAdminPath =
    pathname === '/portal/admin' || pathname.startsWith('/portal/admin/')
  if (isAdminPath && session.role !== 'admin') {
    return applySecurityHeaders(
      NextResponse.redirect(new URL('/portal', request.url)),
    )
  }

  const response = applySecurityHeaders(NextResponse.next())
  response.headers.set('Cache-Control', 'private, no-store')
  return attachMemberCookie(request, response, session)
}

export const config = {
  matcher: ['/portal/:path*', '/api/portal/:path*', '/api/admin/:path*'],
}