import Link from 'next/link'
import { Eye, FileText } from 'lucide-react'
import type { LibraryGroup } from '@/lib/libraryTypes'

const PREVIEW_COUNT = 3

export default function DocumentAlbumCard({
  album,
  label,
}: {
  album: LibraryGroup
  label?: string
}) {
  const count = album.files.length
  const preview = album.files.slice(0, PREVIEW_COUNT)
  const remaining = count - preview.length

  return (
    <Link
      href={`/portal/documents/${album.id}`}
      className="group flex h-full flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg border border-zinc-800 bg-linear-to-br from-sky-900/40 via-zinc-900 to-zinc-950 p-5">
        <div className="absolute inset-x-8 top-3 h-full rounded-md border border-zinc-700/60 bg-zinc-800/40" />
        <div className="absolute inset-x-6 top-5 h-full rounded-md border border-zinc-700/70 bg-zinc-800/60" />
        <div className="absolute inset-x-4 top-7 flex h-full flex-col gap-2 rounded-md border border-zinc-700 bg-zinc-900 p-3 shadow-lg shadow-black/40 transition group-hover:-translate-y-1">
          {preview.map((file) => (
            <div key={file.id} className="flex items-center gap-2">
              <FileText className="size-3.5 shrink-0 text-sky-300/80" aria-hidden="true" />
              <span className="truncate text-xs text-zinc-300">{file.title}</span>
            </div>
          ))}
          {remaining > 0 && <span className="text-xs text-zinc-500">+{remaining} more</span>}
        </div>
        <span className="absolute right-3 bottom-3 flex size-10 translate-y-1 items-center justify-center rounded-full bg-sky-500 text-white opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100">
          <Eye className="size-5" aria-hidden="true" />
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-medium text-zinc-100">{label ?? album.name}</span>
        <span className="text-xs text-zinc-500">
          {count} {count === 1 ? 'document' : 'documents'}
        </span>
        {album.description && (
          <p className="line-clamp-2 text-sm text-zinc-500">{album.description}</p>
        )}
      </div>
    </Link>
  )
}
