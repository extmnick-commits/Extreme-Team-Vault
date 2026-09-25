'use client'

import { useState, useSyncExternalStore } from 'react'
import { ChevronLeft, ChevronRight, Download, ExternalLink, FileText } from 'lucide-react'

export type ViewerDocument = {
  id: string
  title: string
  description: string
  src: string
  badge: string
}

const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-medium text-ink shadow-sm transition-colors hover:bg-zinc-50 lg:min-h-10 lg:px-3'
const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm shadow-violet-600/30 transition-colors hover:bg-violet-700 lg:min-h-10 lg:px-3'
const iconButton =
  'flex size-10 items-center justify-center rounded-xl border border-line bg-surface text-ink-muted shadow-sm transition-colors hover:bg-zinc-50 hover:text-ink disabled:pointer-events-none disabled:opacity-40'

const DESKTOP_QUERY = '(min-width: 64rem)'

function subscribeDesktop(onChange: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  )
}

export default function DocumentViewer({ documents }: { documents: ViewerDocument[] }) {
  const isDesktop = useIsDesktop()
  return (
    <>
      <MobileDocumentList documents={documents} />
      {isDesktop && <DesktopDocumentViewer documents={documents} />}
    </>
  )
}

function MobileDocumentList({ documents }: { documents: ViewerDocument[] }) {
  return (
    <ul className="flex flex-col gap-3 lg:hidden">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 ring-1 ring-red-100">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="font-semibold text-ink">{doc.title}</span>
              <span className="text-xs text-ink-subtle tabular-nums">{doc.badge}</span>
              {doc.description && (
                <p className="line-clamp-2 text-sm text-ink-muted">{doc.description}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a href={doc.src} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
              <ExternalLink className="size-4" aria-hidden="true" />
              Open
            </a>
            <a href={doc.src} download className={primaryButton}>
              <Download className="size-4" aria-hidden="true" />
              Download
            </a>
          </div>
        </li>
      ))}
    </ul>
  )
}

function DesktopDocumentViewer({ documents }: { documents: ViewerDocument[] }) {
  const [index, setIndex] = useState(0)
  const doc = documents[index]
  if (!doc) return null

  const hasPrev = index > 0
  const hasNext = index < documents.length - 1

  return (
    <div className="hidden gap-6 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
      <nav
        aria-label="Documents"
        className="sticky top-6 flex max-h-[calc(100vh-3rem)] flex-col self-start overflow-hidden rounded-2xl border border-line bg-surface shadow-sm"
      >
        <span className="border-b border-line px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
          {documents.length} {documents.length === 1 ? 'document' : 'documents'}
        </span>
        <ol className="flex flex-col gap-0.5 overflow-y-auto p-2">
          {documents.map((d, i) => {
            const current = i === index
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-current={current ? 'true' : undefined}
                  className={`flex w-full items-start gap-3 rounded-xl border-l-[3px] px-3 py-2.5 text-left transition-colors ${
                    current
                      ? 'border-violet-600 bg-violet-50'
                      : 'border-transparent hover:bg-zinc-50'
                  }`}
                >
                  <FileText
                    className={`mt-0.5 size-4 shrink-0 ${current ? 'text-violet-600' : 'text-ink-subtle'}`}
                    aria-hidden="true"
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span
                      className={`line-clamp-2 text-sm font-medium ${current ? 'text-violet-900' : 'text-ink'}`}
                    >
                      {d.title}
                    </span>
                    <span className="text-xs text-ink-subtle tabular-nums">{d.badge}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-semibold text-ink">{doc.title}</span>
            <span className="text-xs text-ink-subtle tabular-nums">
              {index + 1} of {documents.length} · {doc.badge}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setIndex(index - 1)}
              disabled={!hasPrev}
              aria-label="Previous document"
              className={iconButton}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setIndex(index + 1)}
              disabled={!hasNext}
              aria-label="Next document"
              className={iconButton}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
            <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
            <a href={doc.src} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
              <ExternalLink className="size-4" aria-hidden="true" />
              Open
            </a>
            <a href={doc.src} download className={primaryButton}>
              <Download className="size-4" aria-hidden="true" />
              Download
            </a>
          </div>
        </div>
        {doc.description && (
          <p className="border-b border-line px-5 py-3 text-sm text-ink-muted">{doc.description}</p>
        )}
        <div className="bg-zinc-100 p-4">
          <iframe
            key={doc.id}
            src={`${doc.src}#view=FitH`}
            title={doc.title}
            className="h-[78vh] w-full rounded-lg bg-white shadow-md ring-1 ring-zinc-200"
          />
        </div>
      </div>
    </div>
  )
}
