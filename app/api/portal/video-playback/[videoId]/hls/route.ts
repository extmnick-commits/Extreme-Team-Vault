import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/session'
import { BunnyStreamError, fetchRewrittenHlsPlaylist } from '@/lib/bunnyStream'

export async function GET(
  _request: Request,
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
    const playlist = await fetchRewrittenHlsPlaylist(videoId)
    return new NextResponse(playlist, {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    const message =
      error instanceof BunnyStreamError ? error.message : 'Playback unavailable'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
