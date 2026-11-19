'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  FileText,
  Headphones,
  Play,
  Search,
  X,
} from 'lucide-react'
import AlbumArtwork from './AlbumArtwork'
import VideoThumbnailImage from './VideoThumbnailImage'
import { NAV_ITEMS } from './navItems'
import type {
  ContinueAudio,
  DashboardPayload,
  FreshItem,
  RecentPdf,
  SearchHit,
  VaultKind,
} from '@/lib/vaultTypes'

type FreshFilter = 'all' | VaultKind

const FRESH_FILTERS: { id: FreshFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'video', label: 'Videos' },
  { id: 'audio', label: 'Audio' },
  { id: 'pdf', label: 'PDFs' },
]

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

function formatOpenedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Recently opened'
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfThatDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const dayDiff = Math.round((startOfToday - startOfThatDay) / 86_400_000)
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (dayDiff <= 0) return `Last opened today · ${time}`
  if (dayDiff === 1) return 'Last opened yesterday'
  if (dayDiff < 7) return `Last opened ${dayDiff} days ago`
  return `Last opened ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

function OpenedMeta({ iso, page }: { iso: string; page: number | null }) {
  return (
    <p className="text-xs text-ink-subtle" suppressHydrationWarning>
      {formatOpenedAt(iso)}
      {page ? ` · Page ${page}` : ''}
    </p>
  )
}

function progressPercent(position: number, duration: number): number {
  if (!(duration > 0)) return 0
  return Math.min(100, Math.max(0, (position / duration) * 100))
}

export default function DashboardHub({ data }: { data: DashboardPayload }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FreshFilter>('all')
  const continueListening = data.continueListening
  const recentPdfs = data.recentPdfs
  const current = continueListening[0]
  const moreAudio = continueListening.slice(1)
  const trimmed = query.trim().toLowerCase()
  const results = useMemo(() => {
    if (trimmed.length < 2) return []
    return data.searchIndex
      .filter((item) => `${item.title} ${item.subtitle}`.toLowerCase().includes(trimmed))
      .slice(0, 8)
  }, [data.searchIndex, trimmed])
  const fresh = useMemo(() => {
    const items = filter === 'all' ? data.fresh : data.fresh.filter((item) => item.kind === filter)
    return items.slice(0, 12)
  }, [data.fresh, filter])

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <header className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-violet-600 uppercase">
              Your training starts here
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Welcome back.
            </h1>
            <p className="max-w-xl text-sm text-ink-muted sm:text-base">
              Pick up where you left off. Build on what you know.
            </p>
          </div>
          <SearchBox query={query} onQuery={setQuery} results={results} />
        </div>
        {data.catalogError && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Some library content could not be loaded. Try refreshing in a moment.
          </p>
        )}
      </header>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.85fr)]">
        <ContinueListening current={current} more={moreAudio} />
        <RecentPdfs items={recentPdfs} />
      </section>

      <FreshInTheVault items={fresh} filter={filter} onFilter={setFilter} />
      <QuickAccess />
    </div>
  )
}

function SearchBox({
  query,
  onQuery,
  results,
}: {
  query: string
  onQuery: (value: string) => void
  results: SearchHit[]
}) {
  return (
    <div className="relative w-full lg:max-w-sm">
      <label className="relative block">
        <span className="sr-only">Search the vault</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-subtle"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search the vault…"
          className="h-11 w-full rounded-full border border-line bg-surface pr-10 pl-10 text-sm text-ink shadow-sm outline-none placeholder:text-ink-subtle focus:border-violet-300 focus:ring-4 focus:ring-violet-100 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQuery('')}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-subtle hover:bg-zinc-100 hover:text-ink"
          >
            <X className="size-4" />
          </button>
        )}
      </label>
      {query.trim().length >= 2 && (
        <ul
          role="listbox"
          aria-label="Search results"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-surface py-1 shadow-xl shadow-zinc-900/10"
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-ink-muted">No matching videos, audio, or PDFs.</li>
          ) : (
            results.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex flex-col gap-0.5 px-4 py-2.5 hover:bg-violet-50"
                >
                  <span className="text-sm font-medium text-ink">{item.title}</span>
                  <span className="text-xs text-ink-subtle">
                    {item.kind === 'video' ? 'Video' : item.kind === 'audio' ? 'Audio' : 'PDF'}
                    {item.subtitle ? ` · ${item.subtitle}` : ''}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

function ContinueListening({
  current,
  more,
}: {
  current?: ContinueAudio
  more: ContinueAudio[]
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Continue listening</h2>
        <Link
          href="/portal/audio"
          className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
        >
          All audio
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
      {current ? (
        <div className="overflow-hidden rounded-3xl bg-linear-to-br from-violet-950 via-violet-900 to-fuchsia-950 p-5 text-white shadow-lg shadow-violet-900/20 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <AlbumArtwork
              src={current.artworkUrl}
              alt=""
              className="size-28 shrink-0 sm:size-32"
              loading="eager"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-violet-200 uppercase">
                Pick up where you left off
              </p>
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl font-semibold tracking-tight">{current.title}</h3>
                <p className="text-sm text-violet-100/90">
                  {current.albumName} · Track {current.trackNumber} of {current.trackCount}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-white/15"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={Math.round(current.durationSec) || 100}
                  aria-valuenow={Math.round(current.positionSec)}
                  aria-label="Listening progress"
                >
                  <span
                    className="block h-full rounded-full bg-violet-300"
                    style={{ width: `${progressPercent(current.positionSec, current.durationSec)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-violet-100/80 tabular-nums">
                  <span>{formatClock(current.positionSec)} listened</span>
                  <span>
                    {current.durationSec > 0 ? `${formatClock(current.durationSec)} total` : 'Duration pending'}
                  </span>
                </div>
              </div>
              <Link
                href={current.resumeHref}
                className="inline-flex h-11 w-fit items-center gap-2 rounded-full bg-violet-500 px-5 text-sm font-semibold text-white shadow-md shadow-violet-950/40 transition hover:bg-violet-400"
              >
                <Play className="size-4 fill-current" aria-hidden="true" />
                Resume listening
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-3xl border border-dashed border-line bg-surface px-5 py-8">
          <Headphones className="size-6 text-violet-600" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-ink">No listening history yet</p>
            <p className="max-w-md text-sm text-ink-muted">
              Start an audio training and we&apos;ll save your place here, including the track and timestamp.
            </p>
          </div>
          <Link
            href="/portal/audio"
            className="inline-flex h-11 items-center rounded-full bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm shadow-violet-600/30 hover:bg-violet-700"
          >
            Explore audio trainings
          </Link>
        </div>
      )}
      {more.length > 0 && (
        <ul className="flex flex-col gap-2">
          {more.map((item) => (
            <li key={item.recordingId}>
              <Link
                href={item.resumeHref}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5 hover:border-zinc-300"
              >
                <AlbumArtwork src={item.artworkUrl} alt="" className="size-11 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{item.title}</span>
                  <span className="block text-xs text-ink-subtle">
                    {item.albumName} · {formatClock(item.positionSec)}
                    {item.durationSec > 0 ? ` / ${formatClock(item.durationSec)}` : ''}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function RecentPdfs({ items }: { items: RecentPdf[] }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Your recent PDFs</h2>
        <Link
          href="/portal/documents"
          className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
        >
          View all
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
      <div className="flex flex-1 flex-col rounded-3xl border border-line bg-surface p-4 shadow-sm sm:p-5">
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center gap-2 py-8 text-center">
            <FileText className="mx-auto size-6 text-violet-600" aria-hidden="true" />
            <p className="font-semibold text-ink">No documents opened yet</p>
            <p className="text-sm text-ink-muted">
              Open a guide or book and it will show up here. Reopen restores the last page when the viewer can track it.
            </p>
            <Link
              href="/portal/documents"
              className="mt-2 text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              Browse PDF documents
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col">
            {items.map((item, index) => (
              <li
                key={`${item.library}:${item.documentId}`}
                className={`flex items-center gap-3 py-3 ${index > 0 ? 'border-t border-line' : ''}`}
              >
                <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-violet-50 text-xs font-bold text-violet-700 ring-1 ring-violet-100">
                  {item.thumbnailUrl ? (
                    <VideoThumbnailImage src={item.thumbnailUrl} alt="" />
                  ) : (
                    'PDF'
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{item.title}</p>
                  <OpenedMeta
                    iso={item.lastOpenedAt}
                    page={item.canRestorePage ? item.page : null}
                  />
                </div>
                <Link
                  href={item.href}
                  className="inline-flex h-9 shrink-0 items-center rounded-full border border-line px-3 text-xs font-semibold text-ink-muted hover:bg-zinc-50 hover:text-ink"
                >
                  Reopen
                  <ArrowUpRight className="ml-1 size-3.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-auto pt-4 text-xs text-ink-subtle">
          Your most recently opened guides, right here.
        </p>
      </div>
    </section>
  )
}

function FreshInTheVault({
  items,
  filter,
  onFilter,
}: {
  items: FreshItem[]
  filter: FreshFilter
  onFilter: (value: FreshFilter) => void
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-ink">Fresh in the vault</h2>
        <div className="flex flex-wrap gap-1.5 rounded-full bg-zinc-100 p-1" role="tablist" aria-label="Content type">
          {FRESH_FILTERS.map((item) => {
            const active = filter === item.id
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onFilter(item.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  active ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-surface px-5 py-10 text-center">
          <p className="font-medium text-ink">No recent uploads in this view</p>
          <p className="mt-1 text-sm text-ink-muted">
            New videos, audio, and PDFs appear here after they are published.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <li key={item.id}>
              <FreshCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function FreshCard({ item }: { item: FreshItem }) {
  const action =
    item.kind === 'video'
      ? 'Explore the training'
      : item.kind === 'audio'
        ? 'Listen to the series'
        : 'Open the document'

  return (
    <Link
      href={item.href}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className={`relative aspect-4/3 overflow-hidden ${
          item.kind === 'pdf' ? 'bg-violet-50' : 'bg-zinc-950'
        }`}
      >
        {item.artworkUrl ? (
          item.kind === 'audio' ? (
            <AlbumArtwork src={item.artworkUrl} alt="" className="size-full rounded-none border-0 shadow-none" />
          ) : (
            <VideoThumbnailImage src={item.artworkUrl} alt="" />
          )
        ) : item.kind === 'pdf' ? (
          <div className="flex size-full flex-col justify-end p-4">
            <p className="text-2xl font-semibold tracking-tight text-violet-950">{item.title}</p>
          </div>
        ) : (
          <AlbumArtwork alt="" className="size-full rounded-none border-0 shadow-none" />
        )}
        <span className="absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-white uppercase">
          {item.badge}
        </span>
        {item.meta && (
          <span className="absolute right-3 bottom-3 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white tabular-nums">
            {item.meta}
          </span>
        )}
        {item.kind === 'video' && (
          <span className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-violet-700">
            <Play className="size-3.5 fill-current" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-1.5">
          {item.isNew && (
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
              New
            </span>
          )}
          {item.isUpdated && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
              Updated
            </span>
          )}
        </div>
        <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-subtle uppercase">
          {item.kind === 'video' ? 'Video' : item.kind === 'audio' ? 'Audio' : 'PDF'}
        </p>
        <h3 className="line-clamp-2 font-semibold text-ink">{item.title}</h3>
        <p className="line-clamp-2 text-sm text-ink-muted">{item.subtitle}</p>
        <span className="mt-auto pt-2 text-sm font-medium text-violet-600">
          {action} →
        </span>
      </div>
    </Link>
  )
}

function QuickAccess() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="sr-only">Quick access</h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-medium text-ink shadow-sm transition hover:border-zinc-300 hover:shadow-md"
            >
              <span className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <item.icon className="size-4" aria-hidden="true" />
                </span>
                {item.label}
              </span>
              <ArrowUpRight className="size-4 text-ink-subtle" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
