import { SignJWT, jwtVerify } from 'jose'

export const MEMBER_COOKIE = 'etv_member'
export const MEMBER_COOKIE_MAX_AGE_SEC = 365 * 24 * 60 * 60

export function isMemberId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
}

export function newMemberId(): string {
  return crypto.randomUUID()
}

function getEncodedKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export async function signMemberToken(memberId: string): Promise<string> {
  return new SignJWT({ memberId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('365d')
    .sign(getEncodedKey())
}

export async function verifyMemberToken(
  token: string | undefined,
): Promise<string | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ['HS256'],
    })
    return isMemberId(payload.memberId) ? payload.memberId : null
  } catch {
    return null
  }
}

export function memberCookieSetOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: MEMBER_COOKIE_MAX_AGE_SEC,
    sameSite: 'lax' as const,
    path: '/',
  }
}
