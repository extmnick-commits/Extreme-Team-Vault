import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import {
  MEMBER_COOKIE,
  isMemberId,
  memberCookieSetOptions,
  newMemberId,
  signMemberToken,
  verifyMemberToken,
} from '@/lib/memberCookie'

const SESSION_COOKIE = 'etv_session'
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
export const REMEMBER_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
export { MEMBER_COOKIE }

function getEncodedKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET environment variable is not set')
  return new TextEncoder().encode(secret)
}

export type SessionRole = 'admin' | 'member'

export type SessionPayload = {
  authenticated: true
  // Sessions issued before roles existed have no role and are treated as members.
  role?: SessionRole
  // Stable per-browser member identity for personal history. Not a login username.
  memberId?: string
  expiresAt: number
}

export async function encrypt(
  payload: SessionPayload,
  durationMs: number = SESSION_DURATION_MS
): Promise<string> {
  const maxAgeDays = Math.ceil(durationMs / (24 * 60 * 60 * 1000))
  const expiration =
    maxAgeDays >= 30 ? '30d' : maxAgeDays >= 7 ? '7d' : `${Math.ceil(durationMs / 1000)}s`
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(getEncodedKey())
}

export async function decrypt(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ['HS256'],
    })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

async function readMemberIdFromCookieStore(): Promise<string | null> {
  const cookieStore = await cookies()
  return verifyMemberToken(cookieStore.get(MEMBER_COOKIE)?.value)
}

export async function persistMemberCookie(memberId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(MEMBER_COOKIE, await signMemberToken(memberId), memberCookieSetOptions())
}

export async function resolveMemberId(
  session: SessionPayload | null = null,
): Promise<string | null> {
  if (session?.memberId && isMemberId(session.memberId)) return session.memberId
  return readMemberIdFromCookieStore()
}

export async function getOrCreateMemberId(
  session: SessionPayload | null | undefined = undefined,
): Promise<string> {
  const resolved = session === undefined ? await getSession() : session
  const existing = await resolveMemberId(resolved)
  if (existing) {
    await persistMemberCookie(existing)
    return existing
  }
  const memberId = newMemberId()
  await persistMemberCookie(memberId)
  return memberId
}

export async function createSession(
  role: SessionRole,
  options?: { remember?: boolean }
): Promise<void> {
  const durationMs =
    options?.remember === true ? REMEMBER_SESSION_DURATION_MS : SESSION_DURATION_MS
  const expiresAt = Date.now() + durationMs
  const memberId = await getOrCreateMemberId(null)
  const token = await encrypt(
    { authenticated: true, role, memberId, expiresAt },
    durationMs,
  )
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(expiresAt),
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  return decrypt(token)
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession()
  return session?.role === 'admin'
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error('Unauthorized: admin access required')
  }
}

export { SESSION_COOKIE }
