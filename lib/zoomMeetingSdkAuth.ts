import 'server-only'
import { SignJWT } from 'jose'

export function readZoomSdkCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId =
    process.env.ZOOM_MEETING_SDK_CLIENT_ID?.trim() || process.env.ZOOM_SDK_KEY?.trim()
  const clientSecret =
    process.env.ZOOM_MEETING_SDK_CLIENT_SECRET?.trim() ||
    process.env.ZOOM_SDK_SECRET?.trim()
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}

export function isZoomMeetingSdkConfigured(): boolean {
  return readZoomSdkCredentials() !== null
}

/** Meeting SDK JWT (role 0 = participant, 1 = host). */
export async function createMeetingSdkSignature(
  meetingNumber: string,
  role: 0 | 1 = 0,
): Promise<string> {
  const creds = readZoomSdkCredentials()
  if (!creds) {
    throw new Error('Zoom Meeting SDK credentials are not configured on the server.')
  }

  const normalized = meetingNumber.replace(/\D/g, '')
  if (!normalized) throw new Error('Invalid meeting number.')

  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + 60 * 60 * 2

  return new SignJWT({
    appKey: creds.clientId,
    mn: normalized,
    role,
    tokenExp: exp,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(new TextEncoder().encode(creds.clientSecret))
}
