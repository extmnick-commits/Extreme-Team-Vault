import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const LOGIN_GUARD_COOKIE = 'etv_login_guard'
const MAX_FAILURES = 5
const LOCKOUT_MS = 15 * 60 * 1000
const WINDOW_MS = 15 * 60 * 1000

type GuardPayload = {
  failures: number
  windowStart: number
  lockedUntil?: number
}

function getEncodedKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return new TextEncoder().encode(secret)
}

function guardCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: Math.ceil(LOCKOUT_MS / 1000),
  }
}

async function readGuard(): Promise<GuardPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(LOGIN_GUARD_COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ['HS256'],
    })
    const failures = typeof payload.failures === 'number' ? payload.failures : 0
    const windowStart =
      typeof payload.windowStart === 'number' ? payload.windowStart : Date.now()
    const lockedUntil =
      typeof payload.lockedUntil === 'number' ? payload.lockedUntil : undefined
    return { failures, windowStart, lockedUntil }
  } catch {
    return null
  }
}

async function writeGuard(payload: GuardPayload): Promise<void> {
  const cookieStore = await cookies()
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${Math.ceil(LOCKOUT_MS / 1000)}s`)
    .sign(getEncodedKey())
  cookieStore.set(LOGIN_GUARD_COOKIE, token, guardCookieOptions())
}

function formatLockoutMessage(lockedUntil: number): string {
  const minutes = Math.max(1, Math.ceil((lockedUntil - Date.now()) / 60_000))
  return `Too many failed sign-in attempts. Try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`
}

/** Blocks login when a signed lockout cookie is active. */
export async function assertLoginAllowed(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const guard = await readGuard()
  if (guard?.lockedUntil && guard.lockedUntil > Date.now()) {
    return { ok: false, error: formatLockoutMessage(guard.lockedUntil) }
  }
  return { ok: true }
}

export async function recordLoginFailure(): Promise<void> {
  const now = Date.now()
  const guard = await readGuard()
  let failures = 1
  let windowStart = now

  if (guard) {
    if (guard.lockedUntil && guard.lockedUntil > now) {
      await writeGuard(guard)
      return
    }
    if (now - guard.windowStart <= WINDOW_MS) {
      failures = guard.failures + 1
      windowStart = guard.windowStart
    }
  }

  const lockedUntil = failures >= MAX_FAILURES ? now + LOCKOUT_MS : undefined
  await writeGuard({ failures, windowStart, lockedUntil })
}

export async function clearLoginGuard(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(LOGIN_GUARD_COOKIE)
}