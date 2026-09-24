import type { LucideIcon } from 'lucide-react'

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
      <header className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            {title}
          </h1>
          <p className="text-zinc-400">{description}</p>
        </div>
      </header>

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
