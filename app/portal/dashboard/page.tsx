import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { NAV_ITEMS } from '../components/navItems'

export const metadata: Metadata = {
  title: 'Dashboard | Extreme Team Vault',
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Welcome to the Team Portal
        </h1>
        <p className="text-sm text-ink-muted sm:text-base">
          Pick a section below to get started.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {NAV_ITEMS.map(({ href, label, description, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex h-full items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 sm:flex-col sm:items-start sm:p-5"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100 transition group-hover:bg-violet-600 group-hover:text-white">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-semibold text-ink">{label}</span>
                <span className="text-sm text-ink-muted">{description}</span>
              </div>
              <ArrowRight
                className="size-5 shrink-0 text-ink-subtle sm:hidden"
                aria-hidden="true"
              />
              <span className="mt-auto hidden items-center gap-1 text-sm font-medium text-violet-600 sm:flex">
                Open
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
