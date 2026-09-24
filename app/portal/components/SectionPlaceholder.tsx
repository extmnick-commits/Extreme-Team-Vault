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

      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-6 py-16 text-center">
        <Icon className="size-8 text-zinc-600" aria-hidden="true" />
        <p className="font-medium text-zinc-200">Content coming soon</p>
        <p className="max-w-sm text-sm text-zinc-500">
          New material for this section will appear here once it&apos;s published.
        </p>
      </div>
    </div>
  )
}
