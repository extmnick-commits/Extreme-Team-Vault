'use client'

import { useRouter } from 'next/navigation'
import { Headphones, MonitorPlay, FileText, RefreshCw, Users } from 'lucide-react'
import type { AdminActivityReport } from '@/lib/adminMemberActivity'

function formatWhen(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const diff = Date.now() - date.getTime()
  if (diff < 60_000) return 'Just now'
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)}m ago`
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function kindIcon(kind: string) {
  if (kind === 'audio') return <Headphones className="size-4 text-violet-600" aria-hidden="true" />
  if (kind === 'pdf') return <FileText className="size-4 text-violet-600" aria-hidden="true" />
  return <MonitorPlay className="size-4 text-violet-600" aria-hidden="true" />
}

export default function ActivityAdminPanel({ initial }: { initial: AdminActivityReport }) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-6">
      <div aria-live="polite" className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-950">
        <p>
          Members sign in with their <strong>name</strong> and the shared <strong>team PIN</strong>.
          Names appear here after they sign in again; older sessions may show only a device ID until
          the next login. &quot;Active now&quot; = heartbeat in the last 5 minutes.
        </p>
      </div>

      <p className="text-xs text-ink-subtle tabular-nums">
        Last updated {formatWhen(initial.generatedAt)} · Scanned {initial.historyMembersScanned} saved
        history files
      </p>

      <button
        type="button"
        onClick={() => router.refresh()}
        className="inline-flex w-fit items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink shadow-sm transition hover:bg-zinc-50"
      >
        <RefreshCw className="size-4" aria-hidden="true" />
        Refresh
      </button>

      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <header className="flex items-center gap-2 border-b border-line px-4 py-3">
          <Users className="size-5 text-violet-600" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-ink">Active now</h2>
          <span className="ml-auto text-xs text-ink-subtle tabular-nums">
            {initial.activeNow.length} {initial.activeNow.length === 1 ? 'session' : 'sessions'}
          </span>
        </header>
        {initial.activeNow.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-ink-muted">
            No one has sent a heartbeat in the last 5 minutes.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {initial.activeNow.map((row) => (
              <li key={row.memberId} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0 shrink-0 sm:w-40">
                  <p className="truncate font-semibold text-ink">
                    {row.displayName ?? 'Unknown name'}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(row.memberId)}
                    title="Copy device ID"
                    className="font-mono text-[11px] text-ink-subtle hover:text-ink"
                  >
                    {row.shortId}
                  </button>
                </div>
                <span
                  className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    row.role === 'admin' ? 'bg-violet-100 text-violet-800' : 'bg-zinc-100 text-ink-muted'
                  }`}
                >
                  {row.role}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{row.activityLabel}</p>
                  <p className="truncate text-xs text-ink-subtle">{row.path}</p>
                </div>
                <span className="shrink-0 text-xs text-ink-subtle tabular-nums">{formatWhen(row.lastSeenAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <header className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">Recent listening & reading</h2>
          <p className="mt-0.5 text-xs text-ink-subtle">
            Latest saved progress per browser (audio and PDF). Videos appear under Active now while
            someone is watching.
          </p>
        </header>
        {initial.recent.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-ink-muted">
            No saved member history yet. History syncs when people listen to audio or open PDFs.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {initial.recent.map((row, index) => (
              <li
                key={`${row.memberId}-${row.kind}-${row.at}-${index}`}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-50">
                  {kindIcon(row.kind)}
                </span>
                <div className="min-w-0 w-36 shrink-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {row.displayName ?? 'Unknown'}
                  </p>
                  <p className="font-mono text-[10px] text-ink-subtle">{row.shortId}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{row.title}</p>
                  <p className="truncate text-sm text-ink-muted">{row.subtitle}</p>
                </div>
                <span className="shrink-0 text-xs text-ink-subtle tabular-nums">{formatWhen(row.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}