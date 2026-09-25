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
  }))

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/portal/documents"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-zinc-400 transition hover:text-zinc-100"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All PDF documents
      </Link>

      <header className="flex flex-col gap-5 sm:flex-row sm:items-end">
        <div className="flex size-36 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-linear-to-br from-sky-900/40 via-zinc-900 to-zinc-950">
          <FileText className="size-16 text-sky-300/60" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-300">
            {parent ? `${parent.name} · ${kindLabel}` : kindLabel}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">{album.name}</h1>
          {album.description && <p className="max-w-2xl text-zinc-400">{album.description}</p>}
          <span className="text-sm text-zinc-500">
            {documents.length} {documents.length === 1 ? 'document' : 'documents'}
          </span>
        </div>
      </header>

      <DocumentViewer documents={documents} />
    </div>
  )
}
