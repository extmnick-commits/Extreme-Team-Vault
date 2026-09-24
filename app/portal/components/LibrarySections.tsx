import type { LucideIcon } from 'lucide-react'
import {
  countGroupFiles,
  type LibraryFile,
  type LibraryGroup,
  type LibraryView,
} from '@/lib/libraryTypes'
import MediaList, { type MediaListRow } from './MediaList'

function GroupHeading({ group, level }: { group: LibraryGroup; level: 2 | 3 }) {
  const Heading = level === 2 ? 'h2' : 'h3'
  return (
    <div className="flex flex-col gap-1">
      <Heading
        className={
          level === 2
            ? 'text-sm font-semibold uppercase tracking-wider text-zinc-400'
            : 'text-sm font-medium text-zinc-300'
        }
      >
        {group.name}
      </Heading>
      {group.description && <p className="text-sm text-zinc-500">{group.description}</p>}
    </div>
  )
}

export default function LibrarySections({
  view,
  icon,
  toRow,
}: {
  view: LibraryView
  icon: LucideIcon
  toRow: (file: LibraryFile) => MediaListRow
}) {
  const categories = view.sections.filter((s) => countGroupFiles(s) > 0)

  if (categories.length === 0) {
    return <MediaList icon={icon} rows={view.unsorted.map(toRow)} />
  }

  return (
    <div className="flex flex-col gap-10">
      {categories.map((category) => (
        <section key={category.id} className="flex flex-col gap-4">
          <GroupHeading group={category} level={2} />
          {category.files.length > 0 && (
            <MediaList icon={icon} rows={category.files.map(toRow)} />
          )}
          {category.children
            .filter((child) => child.files.length > 0)
            .map((child) => (
              <div key={child.id} className="flex flex-col gap-3 border-l border-zinc-800 pl-4">
                <GroupHeading group={child} level={3} />
                <MediaList icon={icon} rows={child.files.map(toRow)} />
              </div>
            ))}
        </section>
      ))}

      {view.unsorted.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Other</h2>
          <MediaList icon={icon} rows={view.unsorted.map(toRow)} />
        </section>
      )}
    </div>
  )
}
