import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { SESSION_COOKIE } from '@/app/lib/session'

// Encode the secret key inline — proxy runs in the edge-like Node runtime
// and cannot import from 'server-only' modules.
function getEncodedKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return new TextEncoder().encode(secret)
}

type VerifiedSession = { role: 'admin' | 'member' }

async function verifySession(
  token: string | undefined
): Promise<VerifiedSession | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ['HS256'],
    })
    return { role: payload.role === 'admin' ? 'admin' : 'member' }
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = await verifySession(token)

  if (!session) {
    // Redirect unauthenticated users to the login page
    return NextResponse.redirect(new URL('/', request.url))
  }

  const { pathname } = request.nextUrl
  const isAdminPath =
    pathname === '/portal/admin' || pathname.startsWith('/portal/admin/')
  if (isAdminPath && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  return NextResponse.next()
}

// Only protect /portal and its sub-paths.
// Excludes API routes, Next.js internals, and static assets.
export const config = {
  matcher: ['/portal/:path*'],
}
