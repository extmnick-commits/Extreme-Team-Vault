import { NextResponse } from 'next/server'
import { isAdmin } from '@/app/lib/session'
import { readObject } from '@/lib/bunnyStorage'

type RouteContext = { params: Promise<{ name: string }> }

export async function GET(_request: Request, context: RouteContext) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name: encoded } = await context.params
  const name = decodeURIComponent(encoded)
  if (!name || name.includes('/') || name.includes('\\') || name.includes('..')) {
    return NextResponse.json({ error: 'Invalid file name.' }, { status: 400 })
  }

  try {
    const { body, contentType } = await readObject('documents', name)
    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType || 'application/pdf',
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('[admin/documents]', error)
    return NextResponse.json({ error: 'File not found.' }, { status: 404 })
  }
}
