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

async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false
  try {
    await jwtVerify(token, getEncodedKey(), { algorithms: ['HS256'] })
    return true
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const authenticated = await isValidSession(token)

  if (!authenticated) {
    // Redirect unauthenticated users to the login page
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Only protect /portal and its sub-paths.
// Excludes API routes, Next.js internals, and static assets.
export const config = {
  matcher: ['/portal/:path*'],
}
