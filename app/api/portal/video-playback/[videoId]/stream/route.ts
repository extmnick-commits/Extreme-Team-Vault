import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/session'
import { BunnyStreamError, fetchStreamVideoMp4Response } from '@/lib/bunnyStream'

const PASSTHROUGH_HEADERS = [
  'content-type',
  'content-length',
  'content-range',
  'accept-ranges',
] as const

export async function GET(
  request: Request,
  context: { params: Promise<{ videoId: string }> },
): Promise<NextResponse> {
  const session = await getSession()
  if (!session?.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { videoId } = await context.params
  if (!videoId || videoId.includes('/') || videoId.includes('..')) {
    return NextResponse.json({ error: 'Invalid video id' }, { status: 400 })
  }

  try {
    const upstream = await fetchStreamVideoMp4Response(videoId, request.headers.get('range'))
    const headers = new Headers()
    for (const name of PASSTHROUGH_HEADERS) {
      const value = upstream.headers.get(name)
      if (value) headers.set(name, value)
    }
    headers.set('Cache-Control', 'private, no-store')
    if (!headers.has('content-type')) {
      headers.set('Content-Type', 'video/mp4')
    }
    headers.set('Content-Disposition', 'inline')

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    })
  } catch (error) {
    const message =
      error instanceof BunnyStreamError ? error.message : 'Playback unavailable'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
