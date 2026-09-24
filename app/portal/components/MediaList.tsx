import type { LucideIcon } from 'lucide-react'

export type MediaListRow = {
  id: string
  title: string
  description: string
  badge: string
  href: string
  actionLabel: string
  actionIcon: LucideIcon
  download?: boolean
}

type MediaListProps = {
  rows: MediaListRow[]
  icon: LucideIcon
}

export default function MediaList({ rows, icon: RowIcon }: MediaListProps) {
  return (
    <ul className="divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
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
        }) => (
          <li
            key={id}
            className="flex flex-col gap-4 p-4 transition-colors hover:bg-zinc-900 sm:flex-row sm:items-center sm:gap-5 sm:p-5"
          >
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300">
                <RowIcon className="size-5" aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-zinc-100">{title}</span>
                  <span className="rounded-full border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-xs font-medium text-zinc-300 tabular-nums">
                    {badge}
                  </span>
                </div>
                <p className="text-sm text-zinc-500">{description}</p>
              </div>
            </div>

            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              download={download || undefined}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
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
