import Link from 'next/link'
import { Disc3, Play } from 'lucide-react'
import type { LibraryGroup } from '@/lib/libraryTypes'

export default function AlbumCard({ album }: { album: LibraryGroup }) {
  const count = album.files.length
  return (
    <Link
      href={`/portal/audio/${album.id}`}
      className="group flex h-full flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-zinc-800 bg-linear-to-br from-violet-900/40 via-zinc-900 to-zinc-950">
        <Disc3 className="size-14 text-violet-300/60" aria-hidden="true" />
        <span className="absolute right-3 bottom-3 flex size-10 translate-y-1 items-center justify-center rounded-full bg-violet-500 text-white opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100">
          <Play className="size-5 fill-current" aria-hidden="true" />
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-medium text-zinc-100">{album.name}</span>
        <span className="text-xs text-zinc-500">
          {count} {count === 1 ? 'track' : 'tracks'}
        </span>
        {album.description && (
          <p className="line-clamp-2 text-sm text-zinc-500">{album.description}</p>
        )}
      </div>
    </Link>
  )
}
