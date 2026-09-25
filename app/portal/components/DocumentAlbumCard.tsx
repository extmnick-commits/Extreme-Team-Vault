import Link from 'next/link'
import { ArrowRight, FileText } from 'lucide-react'
import type { LibraryGroup } from '@/lib/libraryTypes'
import VideoThumbnailImage from './VideoThumbnailImage'

const PREVIEW_COUNT = 3

export default function DocumentAlbumCard({
  album,
  label,
  basePath = '/portal/documents',
  countLabel = { one: 'doc', other: 'docs' },
}: {
  album: LibraryGroup
  label?: string
  basePath?: string
  countLabel?: { one: string; other: string }
}) {
  const count = album.files.length
  const preview = album.files.slice(0, PREVIEW_COUNT)
  const remaining = count - preview.length
  const coverUrl = album.files.find((file) => file.thumbnailUrl)?.thumbnailUrl

  return (
    <Link
      href={`${basePath}/${album.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-zinc-900 sm:aspect-square">
        {coverUrl ? (
          <>
            <VideoThumbnailImage src={coverUrl} alt="" />
            <span className="absolute top-2.5 left-2.5 z-10 rounded bg-red-500 px-1.5 py-px text-[10px] font-bold tracking-wide text-white shadow-sm">
              PDF
            </span>
          </>
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-sky-50 via-slate-50 to-violet-50">
            <div className="absolute inset-x-[22%] top-[14%] h-full rounded-md bg-white shadow-sm ring-1 ring-zinc-200/70" />
            <div className="absolute inset-x-[17%] top-[19%] h-full rounded-md bg-white shadow-sm ring-1 ring-zinc-200/70" />
            <div className="absolute inset-x-[12%] top-[24%] flex h-full flex-col gap-1.5 rounded-md bg-white p-2.5 shadow-md ring-1 ring-zinc-200 transition duration-300 group-hover:-translate-y-1 sm:gap-2 sm:p-3">
              <span className="mb-0.5 w-fit rounded bg-red-500 px-1.5 py-px text-[10px] font-bold tracking-wide text-white">
                PDF
              </span>
              {preview.map((file) => (
                <div key={file.id} className="flex items-center gap-1.5">
                  <FileText className="size-3 shrink-0 text-sky-500" aria-hidden="true" />
                  <span className="truncate text-[11px] text-ink-muted sm:text-xs">{file.title}</span>
                </div>
              ))}
              {remaining > 0 && (
                <span className="text-[11px] text-ink-subtle sm:text-xs">+{remaining} more</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 border-t border-line p-3 sm:p-4">
        <span className="line-clamp-2 text-sm font-semibold text-ink sm:text-base">
          {label ?? album.name}
        </span>
        {album.description && (
          <p className="line-clamp-2 hidden text-sm text-ink-muted sm:block">{album.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-ink-muted tabular-nums">
            {count} {count === 1 ? countLabel.one : countLabel.other}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-violet-600 transition group-hover:opacity-100 [@media(hover:hover)]:opacity-0">
            View
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  )
}
