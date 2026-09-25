import type { LucideIcon } from 'lucide-react'
import VideoThumbnailImage from './VideoThumbnailImage'

export type MediaListRow = {
  id: string
  title: string
  description: string
  badge: string
  href: string
  actionLabel: string
  actionIcon: LucideIcon
  download?: boolean
  thumbnailUrl?: string
}

type MediaListProps = {
  rows: MediaListRow[]
  icon: LucideIcon
}

export default function MediaList({ rows, icon: RowIcon }: MediaListProps) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      {rows.map(
        ({
          id,
          title,
          description,
          badge,
          href,
          actionLabel,
          actionIcon: ActionIcon,
          download,
          thumbnailUrl,
        }) => (
          <li
            key={id}
            className="flex flex-col gap-4 p-4 transition-colors hover:bg-zinc-50 sm:flex-row sm:items-center sm:gap-5 sm:p-5"
          >
            <div className="flex min-w-0 flex-1 items-start gap-4">
              {thumbnailUrl ? (
                <span className="relative block aspect-[4/3] w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-line">
                  <VideoThumbnailImage src={thumbnailUrl} alt="" />
                </span>
              ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                  <RowIcon className="size-5" aria-hidden="true" />
                </span>
              )}
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{title}</span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-ink-muted tabular-nums">
                    {badge}
                  </span>
                </div>
                <p className="text-sm text-ink-muted">{description}</p>
              </div>
            </div>

            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              download={download || undefined}
              className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm shadow-violet-600/30 transition-colors hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 sm:min-h-10 sm:w-auto"
            >
              <ActionIcon className="size-4" aria-hidden="true" />
              {actionLabel}
            </a>
          </li>
        ),
      )}
    </ul>
  )
}
