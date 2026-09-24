import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SESSION_COOKIE = 'etv_session'
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function getEncodedKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET environment variable is not set')
  return new TextEncoder().encode(secret)
}

export type SessionPayload = {
  authenticated: true
  expiresAt: number
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
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

export async function createSession(): Promise<void> {
  const expiresAt = Date.now() + SESSION_DURATION_MS
  const token = await encrypt({ authenticated: true, expiresAt })
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

export { SESSION_COOKIE }
