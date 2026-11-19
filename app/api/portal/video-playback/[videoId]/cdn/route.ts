import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/session'
import { BunnyStreamError, fetchStreamCdnAssetResponse } from '@/lib/bunnyStream'

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

  const cdnUrl = new URL(request.url).searchParams.get('url')?.trim()
  if (!cdnUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  try {
    const upstream = await fetchStreamCdnAssetResponse(
      videoId,
      cdnUrl,
      request.headers.get('range'),
    )
    const headers = new Headers()
    for (const name of PASSTHROUGH_HEADERS) {
      const value = upstream.headers.get(name)
      if (value) headers.set(name, value)
    }
    headers.set('Cache-Control', 'private, no-store')

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
