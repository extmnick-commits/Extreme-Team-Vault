import Link from 'next/link'
import { Play } from 'lucide-react'
import type { LibraryGroup } from '@/lib/libraryTypes'
import AlbumArtwork from './AlbumArtwork'

export default function AlbumCard({ album }: { album: LibraryGroup }) {
  const count = album.files.length
  const coverUrl = album.coverUrl ?? album.artworkUrl

  return (
    <Link
      href={`/portal/audio/${album.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
    >
      <div className="relative aspect-4/3 sm:aspect-square">
        <AlbumArtwork src={coverUrl} alt="" className="size-full rounded-none border-0 shadow-none" />
        <span className="absolute right-3 bottom-3 flex size-10 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/30 transition group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:hover)]:translate-y-1 [@media(hover:hover)]:opacity-0">
          <Play className="size-5 translate-x-px fill-current" aria-hidden="true" />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-line p-3 sm:p-4">
        <span className="line-clamp-2 text-sm font-semibold text-ink sm:text-base">{album.name}</span>
        <span className="text-xs text-ink-subtle">
          {count} {count === 1 ? 'track' : 'tracks'}
        </span>
        {album.description && (
          <p className="line-clamp-2 hidden text-sm text-ink-muted sm:block">{album.description}</p>
        )}
      </div>
    </Link>
  )
}
