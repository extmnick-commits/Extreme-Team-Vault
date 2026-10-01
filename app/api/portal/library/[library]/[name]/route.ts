import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/session'
import { readObject } from '@/lib/bunnyStorage'
import { isDocumentCoverObjectName } from '@/lib/documentCovers'
import { contentDispositionAttachment } from '@/lib/portalDownload'
import { isLibrary } from '@/lib/libraryTypes'

type RouteContext = { params: Promise<{ library: string; name: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession()
  if (!session?.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { library: libraryRaw, name: encoded } = await context.params
  if (!isLibrary(libraryRaw)) {
    return NextResponse.json({ error: 'Invalid library.' }, { status: 400 })
  }

  const name = decodeURIComponent(encoded)
  if (
    !name ||
    name.includes('/') ||
    name.includes('\\') ||
    name.includes('..') ||
    isDocumentCoverObjectName(name)
  ) {
    return NextResponse.json({ error: 'Invalid file name.' }, { status: 400 })
  }

  try {
    const { body, contentType } = await readObject(libraryRaw, name)
    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Disposition': contentDispositionAttachment(name),
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('[portal/library]', error)
    return NextResponse.json({ error: 'File not found.' }, { status: 404 })
  }
}
