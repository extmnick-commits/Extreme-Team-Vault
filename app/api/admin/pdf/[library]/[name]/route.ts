import { NextResponse } from 'next/server'
import { isAdmin } from '@/app/lib/session'
import { readObject } from '@/lib/bunnyStorage'
import { isPdfLibrary } from '@/lib/libraryTypes'

type RouteContext = { params: Promise<{ library: string; name: string }> }

export async function GET(_request: Request, context: RouteContext) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { library: libraryRaw, name: encoded } = await context.params
  if (!isPdfLibrary(libraryRaw)) {
    return NextResponse.json({ error: 'Invalid library.' }, { status: 400 })
  }

  const name = decodeURIComponent(encoded)
  if (!name || name.includes('/') || name.includes('\\') || name.includes('..')) {
    return NextResponse.json({ error: 'Invalid file name.' }, { status: 400 })
  }

  try {
    const { body, contentType } = await readObject(libraryRaw, name)
    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType || 'application/pdf',
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('[admin/pdf]', error)
    return NextResponse.json({ error: 'File not found.' }, { status: 404 })
  }
}
