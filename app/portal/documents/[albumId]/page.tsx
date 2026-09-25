import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, FileText } from 'lucide-react'
import { getLibrary } from '@/lib/bunnyStorage'
import { GROUP_LABELS, findGroup } from '@/lib/libraryTypes'
import DocumentViewer, { type ViewerDocument } from '../../components/DocumentViewer'

type Props = { params: Promise<{ albumId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { albumId } = await params
  const album = findGroup(await getLibrary('documents'), albumId)
  return { title: `${album?.name ?? 'Documents'} | Extreme Team Vault` }
}

export default async function DocumentAlbumPage({ params }: Props) {
  const { albumId } = await params
  const view = await getLibrary('documents')
  const album = findGroup(view, albumId)
  if (!album || album.files.length === 0) notFound()

  const parent = album.parentId ? findGroup(view, album.parentId) : undefined
  const kindLabel = album.parentId ? GROUP_LABELS.documents.child : GROUP_LABELS.documents.parent
  const documents: ViewerDocument[] = album.files.map((file) => ({
    id: file.id,
    title: file.title,
    description: file.description,
    src: file.cdnUrl,
    badge: `${file.fileType} · ${file.fileSize}`,
    thumbnailUrl: file.thumbnailUrl,
  }))

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <Link
        href="/portal/documents"
        className="-ml-2 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-ink-muted transition hover:bg-zinc-100 hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All PDF documents
      </Link>

      <header className="flex items-center gap-4 sm:items-end sm:gap-6">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-line bg-linear-to-br from-sky-50 via-white to-violet-50 shadow-sm sm:size-32">
          <FileText className="size-7 text-sky-500 sm:size-14" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <div className="flex min-w-0 flex-col gap-1 sm:gap-1.5">
          <span className="truncate text-xs font-semibold uppercase tracking-wider text-sky-600">
            {parent ? `${parent.name} · ${kindLabel}` : kindLabel}
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-3xl">{album.name}</h1>
          {album.description && (
            <p className="hidden max-w-2xl text-ink-muted sm:block">{album.description}</p>
          )}
          <span className="text-sm text-ink-subtle">
            {documents.length} {documents.length === 1 ? 'document' : 'documents'}
          </span>
        </div>
      </header>
      {album.description && <p className="-mt-2 text-sm text-ink-muted sm:hidden">{album.description}</p>}

      <DocumentViewer documents={documents} />
    </div>
  )
}
