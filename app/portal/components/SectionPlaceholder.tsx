import type { LucideIcon } from 'lucide-react'
import PageHeader from './PageHeader'

type SectionPlaceholderProps = {
  icon: LucideIcon
  title: string
  description: string
}

export default function SectionPlaceholder({
  icon: Icon,
  title,
  description,
}: SectionPlaceholderProps) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader icon={Icon} title={title} description={description} />

      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-surface px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-500 ring-1 ring-violet-100">
          <Icon className="size-7" aria-hidden="true" />
        </span>
        <p className="font-semibold text-ink">Content coming soon</p>
        <p className="max-w-sm text-sm text-ink-muted">
          New material for this section will appear here once it&apos;s published.
        </p>
      </div>
    </div>
  )
}
