import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Disc3 } from 'lucide-react'
import { getLibrary } from '@/lib/bunnyStorage'
import { GROUP_LABELS, findGroup } from '@/lib/libraryTypes'
import AlbumPlayer, { type AlbumTrack } from '../../components/AlbumPlayer'

type Props = { params: Promise<{ albumId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { albumId } = await params
  const album = findGroup(await getLibrary('audio'), albumId)
  return { title: `${album?.name ?? 'Album'} | Extreme Team Vault` }
}

export default async function AlbumPage({ params }: Props) {
  const { albumId } = await params
  const view = await getLibrary('audio')
  const album = findGroup(view, albumId)
  if (!album || album.files.length === 0) notFound()

  const parent = album.parentId ? findGroup(view, album.parentId) : undefined
  const kindLabel = album.parentId ? GROUP_LABELS.audio.child : GROUP_LABELS.audio.parent
  const tracks: AlbumTrack[] = album.files.map((file) => ({
    id: file.id,
    title: file.title,
    description: file.description,
    src: file.cdnUrl,
    badge: `${file.fileType} · ${file.fileSize}`,
  }))

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <Link
        href="/portal/audio"
        className="-ml-2 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-ink-muted transition hover:bg-zinc-100 hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All audio trainings
      </Link>

      <header className="flex items-center gap-4 sm:items-end sm:gap-6">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-line bg-linear-to-br from-violet-100 via-violet-50 to-fuchsia-50 shadow-sm sm:size-32">
          <Disc3 className="size-7 text-violet-500 sm:size-14" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <div className="flex min-w-0 flex-col gap-1 sm:gap-1.5">
          <span className="truncate text-xs font-semibold uppercase tracking-wider text-violet-600">
            {parent ? `${parent.name} · ${kindLabel}` : kindLabel}
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-3xl">{album.name}</h1>
          {album.description && (
            <p className="hidden max-w-2xl text-ink-muted sm:block">{album.description}</p>
          )}
          <span className="text-sm text-ink-subtle">
            {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
          </span>
        </div>
      </header>
      {album.description && <p className="-mt-2 text-sm text-ink-muted sm:hidden">{album.description}</p>}

      <AlbumPlayer albumName={album.name} tracks={tracks} />
    </div>
  )
}
