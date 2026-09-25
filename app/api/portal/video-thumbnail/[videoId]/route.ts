import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/session'
import { BunnyStreamError, fetchStreamThumbnail, getStreamVideoThumbnailUrl } from '@/lib/bunnyStream'

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
    const thumbnailUrl = await getStreamVideoThumbnailUrl(videoId)
    if (!thumbnailUrl) {
      return NextResponse.json({ error: 'Thumbnail not found' }, { status: 404 })
    }
    const { body, contentType } = await fetchStreamThumbnail(thumbnailUrl)
    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    const message = error instanceof BunnyStreamError ? error.message : 'Thumbnail unavailable'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
