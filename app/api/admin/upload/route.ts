import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { isAdmin } from '@/app/lib/session'
import {
  ALLOWED_CONTENT_TYPES,
  BLOB_STAGING_PREFIX,
  MAX_UPLOAD_BYTES,
  isLibrary,
} from '@/lib/libraryTypes'

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  // Only token requests are accepted; completion is handled by finalizeUpload.
  if (body.type !== 'blob.generate-client-token') {
    return NextResponse.json({ error: 'Unsupported event' }, { status: 400 })
  }

  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload: unknown = clientPayload ? JSON.parse(clientPayload) : null
        const library =
          typeof payload === 'object' && payload !== null
            ? (payload as { library?: unknown }).library
            : undefined

        if (!isLibrary(library)) throw new Error('Invalid library')
        if (!pathname.startsWith(BLOB_STAGING_PREFIX)) throw new Error('Invalid path')

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES[library],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
        }
      },
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 },
    )
  }
}
