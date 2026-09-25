import type { LucideIcon } from 'lucide-react'

type PageHeaderProps = {
  icon: LucideIcon
  title: string
  description: string
}

export default function PageHeader({
  icon: Icon,
  title,
  description,
}: PageHeaderProps) {
  return (
    <header className="flex items-start gap-3 sm:gap-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100 sm:size-11">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {title}
        </h1>
        <p className="text-sm text-ink-muted sm:text-base">{description}</p>
      </div>
    </header>
  )
}
