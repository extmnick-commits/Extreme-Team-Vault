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
    <div className="flex flex-col gap-8">
      <Link
        href="/portal/audio"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-zinc-400 transition hover:text-zinc-100"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All audio trainings
      </Link>

      <header className="flex flex-col gap-5 sm:flex-row sm:items-end">
        <div className="flex size-36 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-linear-to-br from-violet-900/40 via-zinc-900 to-zinc-950">
          <Disc3 className="size-16 text-violet-300/60" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-violet-300">
            {parent ? `${parent.name} · ${kindLabel}` : kindLabel}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">{album.name}</h1>
          {album.description && <p className="max-w-2xl text-zinc-400">{album.description}</p>}
          <span className="text-sm text-zinc-500">
            {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
          </span>
        </div>
      </header>

      <AlbumPlayer albumName={album.name} tracks={tracks} />
    </div>
  )
}
