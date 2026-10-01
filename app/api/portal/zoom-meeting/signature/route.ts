import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/session'
import { normalizeZoomMeetingNumber, resolveZoomMeeting } from '@/lib/liveRoomConfig'
import { readLiveRoomSettings } from '@/lib/liveRoomStore'
import {
  createMeetingSdkSignature,
  readZoomSdkCredentials,
} from '@/lib/zoomMeetingSdkAuth'

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session?.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const creds = readZoomSdkCredentials()
  if (!creds) {
    return NextResponse.json(
      { error: 'Zoom Meeting SDK is not configured on the server.' },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const meetingNumberRaw =
    typeof body === 'object' && body !== null && 'meetingNumber' in body
      ? (body as { meetingNumber: unknown }).meetingNumber
      : undefined
  const meetingNumber = normalizeZoomMeetingNumber(
    typeof meetingNumberRaw === 'string' || typeof meetingNumberRaw === 'number'
      ? String(meetingNumberRaw)
      : '',
  )
  if (!meetingNumber) {
    return NextResponse.json({ error: 'Meeting number is required.' }, { status: 400 })
  }

  const settings = await readLiveRoomSettings({ fresh: true })
  const configured = resolveZoomMeeting(settings)
  if (!configured || configured.meetingNumber !== meetingNumber) {
    return NextResponse.json({ error: 'Meeting not configured for this portal.' }, { status: 403 })
  }

  try {
    const signature = await createMeetingSdkSignature(meetingNumber, 0)
    return NextResponse.json({
      signature,
      sdkKey: creds.clientId,
    })
  } catch (error) {
    console.error('[zoom-meeting/signature]', error)
    return NextResponse.json({ error: 'Could not authorize Zoom meeting.' }, { status: 500 })
  }
}
