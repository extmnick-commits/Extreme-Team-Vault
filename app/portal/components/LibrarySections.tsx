import type { LucideIcon } from 'lucide-react'
import type { LibraryFile, LibraryView } from '@/lib/libraryTypes'
import MediaList, { type MediaListRow } from './MediaList'

export function countLibraryFiles(view: LibraryView): number {
  return view.unsorted.length + view.sections.reduce((sum, s) => sum + s.files.length, 0)
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
  const groups = [
    ...view.sections.map((s) => ({ key: s.id, name: s.name, files: s.files })),
    { key: 'other', name: 'Other', files: view.unsorted },
  ].filter((group) => group.files.length > 0)

  if (groups.length === 1 && view.sections.every((s) => s.files.length === 0)) {
    return <MediaList icon={icon} rows={groups[0].files.map(toRow)} />
  }

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            {group.name}
          </h2>
          <MediaList icon={icon} rows={group.files.map(toRow)} />
        </section>
      ))}
    </div>
  )
}
