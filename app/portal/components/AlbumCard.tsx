import Link from 'next/link'
import { Disc3, Play } from 'lucide-react'
import type { LibraryGroup } from '@/lib/libraryTypes'

export default function AlbumCard({ album }: { album: LibraryGroup }) {
  const count = album.files.length
  return (
    <Link
      href={`/portal/audio/${album.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
    >
      <div className="relative flex aspect-4/3 items-center justify-center overflow-hidden bg-linear-to-br from-violet-100 via-violet-50 to-fuchsia-50 sm:aspect-square">
        <Disc3 className="size-12 text-violet-400 sm:size-14" strokeWidth={1.5} aria-hidden="true" />
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
