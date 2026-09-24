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
  )
}
