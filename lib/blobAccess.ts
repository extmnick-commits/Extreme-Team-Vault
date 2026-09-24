import 'server-only'
import type { BlobAccessType } from '@vercel/blob'

// Must match the access type chosen when the Vercel Blob store was created.
export function getBlobAccess(): BlobAccessType {
  return process.env.BLOB_STORE_ACCESS === 'public' ? 'public' : 'private'
}
