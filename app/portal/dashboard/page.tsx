import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { NAV_ITEMS } from '../components/navItems'

export const metadata: Metadata = {
  title: 'Dashboard | Extreme Team Vault',
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Welcome to the Team Portal
        </h1>
        <p className="text-zinc-400">
          Pick a section below to get started.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {NAV_ITEMS.map(({ href, label, description, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex h-full flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
            >
              <span className="flex size-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 group-hover:text-zinc-100">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <span className="font-medium text-zinc-100">{label}</span>
                <span className="text-sm text-zinc-500">{description}</span>
              </div>
              <span className="mt-auto flex items-center gap-1 text-sm text-zinc-400 group-hover:text-zinc-200">
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
