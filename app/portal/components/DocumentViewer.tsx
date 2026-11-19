'use client'

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { ChevronLeft, ChevronRight, Download, ExternalLink, FileText } from 'lucide-react'
import { bindHistoryFlush, queuePdfHistory } from '@/lib/client/historySync'
import type { PdfLibrary } from '@/lib/libraryTypes'
import PdfPageViewer from './PdfPageViewer'
import VideoThumbnailImage from './VideoThumbnailImage'

export type ViewerDocument = {
  id: string
  documentId: string
  title: string
  description: string
  /** CDN URL for in-browser preview (iframe / open in new tab). */
  src: string
  /** Same-origin URL used by the integrated PDF viewer. */
  previewHref: string
  /** Same-origin URL that forces a file download. */
  downloadHref: string
  /** Suggested save-as file name. */
  fileName: string
  badge: string
  thumbnailUrl?: string
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

export default function DocumentViewer({
  documents,
  library,
  albumId,
  initialDocumentId,
  initialPage,
}: {
  documents: ViewerDocument[]
  library: PdfLibrary
  albumId: string
  initialDocumentId?: string
  initialPage?: number
}) {
  const isDesktop = useIsDesktop()
  useEffect(() => bindHistoryFlush(), [])
  return (
    <>
      <MobileDocumentList
        documents={documents}
        library={library}
        albumId={albumId}
        initialDocumentId={initialDocumentId}
        initialPage={initialPage}
      />
      {isDesktop && (
        <DesktopDocumentViewer
          documents={documents}
          library={library}
          albumId={albumId}
          initialDocumentId={initialDocumentId}
          initialPage={initialPage}
        />
      )}
    </>
  )
}

function usePdfHistory(library: PdfLibrary, albumId: string) {
  return useCallback(
    (doc: ViewerDocument, page: number | null, immediate = false) => {
      queuePdfHistory(
        {
          documentId: doc.documentId,
          library,
          albumId,
          page,
          lastOpenedAt: new Date().toISOString(),
        },
        immediate,
      )
    },
    [albumId, library],
  )
}

function MobileDocumentList({
  documents,
  library,
  albumId,
  initialDocumentId,
  initialPage,
}: {
  documents: ViewerDocument[]
  library: PdfLibrary
  albumId: string
  initialDocumentId?: string
  initialPage?: number
}) {
  const requestedIndex = useMemo(() => {
    if (!initialDocumentId) return -1
    return documents.findIndex((doc) => doc.documentId === initialDocumentId)
  }, [documents, initialDocumentId])
  const [activeId, setActiveId] = useState<string | null>(
    requestedIndex >= 0 ? documents[requestedIndex]?.id ?? null : null,
  )
  const persist = usePdfHistory(library, albumId)

  return (
    <ul className="flex flex-col gap-3 lg:hidden">
      {documents.map((doc) => {
        const open = activeId === doc.id
        return (
          <li
            key={doc.id}
            className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <DocumentThumb thumbnailUrl={doc.thumbnailUrl} title={doc.title} />
              <div className="flex min-w-0 flex-col gap-1">
                <span className="font-semibold text-ink">{doc.title}</span>
                <span className="text-xs text-ink-subtle tabular-nums">{doc.badge}</span>
                {doc.description && (
                  <p className="line-clamp-2 text-sm text-ink-muted">{doc.description}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={secondaryButton}
                onClick={() => {
                  setActiveId(doc.id)
                  persist(doc, initialDocumentId === doc.documentId ? initialPage ?? 1 : 1, true)
                }}
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                {open ? 'Reading' : 'Open'}
              </button>
              <a href={doc.downloadHref} download={doc.fileName} className={primaryButton}>
                <Download className="size-4" aria-hidden="true" />
                Download
              </a>
            </div>
            {open && (
              <PdfPageViewer
                src={doc.previewHref}
                title={doc.title}
                initialPage={initialDocumentId === doc.documentId ? initialPage : undefined}
                onPageChange={(page) => persist(doc, page)}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

function DocumentThumb({ thumbnailUrl, title }: { thumbnailUrl?: string; title: string }) {
  if (thumbnailUrl) {
    return (
      <span className="relative block size-11 shrink-0 overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-line">
        <VideoThumbnailImage src={thumbnailUrl} alt="" />
      </span>
    )
  }
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 ring-1 ring-red-100">
      <FileText className="size-5" aria-hidden="true" />
      <span className="sr-only">{title}</span>
    </span>
  )
}

function SidebarThumb({
  thumbnailUrl,
  active,
}: {
  thumbnailUrl?: string
  title: string
  active: boolean
}) {
  if (thumbnailUrl) {
    return (
      <span
        className={`relative mt-0.5 block size-9 shrink-0 overflow-hidden rounded-lg bg-zinc-900 ring-1 ${
          active ? 'ring-violet-300' : 'ring-line'
        }`}
      >
        <VideoThumbnailImage src={thumbnailUrl} alt="" />
      </span>
    )
  }
  return (
    <FileText
      className={`mt-0.5 size-4 shrink-0 ${active ? 'text-violet-600' : 'text-ink-subtle'}`}
      aria-hidden="true"
    />
  )
}

function DesktopDocumentViewer({
  documents,
  library,
  albumId,
  initialDocumentId,
  initialPage,
}: {
  documents: ViewerDocument[]
  library: PdfLibrary
  albumId: string
  initialDocumentId?: string
  initialPage?: number
}) {
  const requestedIndex = useMemo(() => {
    if (!initialDocumentId) return 0
    const found = documents.findIndex((doc) => doc.documentId === initialDocumentId)
    return found >= 0 ? found : 0
  }, [documents, initialDocumentId])
  const [index, setIndex] = useState(requestedIndex)
  const persist = usePdfHistory(library, albumId)
  const restoreInitialPage = Boolean(initialDocumentId)
  const doc = documents[index]
  if (!doc) return null

  const hasPrev = index > 0
  const hasNext = index < documents.length - 1

  function select(next: number) {
    const nextDoc = documents[next]
    if (nextDoc) persist(nextDoc, 1, true)
    setIndex(next)
  }

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
                  onClick={() => select(i)}
                  aria-current={current ? 'true' : undefined}
                  className={`flex w-full items-start gap-3 rounded-xl border-l-[3px] px-3 py-2.5 text-left transition-colors ${
                    current
                      ? 'border-violet-600 bg-violet-50'
                      : 'border-transparent hover:bg-zinc-50'
                  }`}
                >
                  <SidebarThumb thumbnailUrl={d.thumbnailUrl} title={d.title} active={current} />
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
              onClick={() => select(index - 1)}
              disabled={!hasPrev}
              aria-label="Previous document"
              className={iconButton}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => select(index + 1)}
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
            <a href={doc.downloadHref} download={doc.fileName} className={primaryButton}>
              <Download className="size-4" aria-hidden="true" />
              Download
            </a>
          </div>
        </div>
        {doc.description && (
          <p className="border-b border-line px-5 py-3 text-sm text-ink-muted">{doc.description}</p>
        )}
        <div className="bg-zinc-100 p-4">
          <PdfPageViewer
            key={doc.id}
            src={doc.previewHref}
            title={doc.title}
            initialPage={
              restoreInitialPage && initialDocumentId === doc.documentId
                ? initialPage
                : undefined
            }
            onPageChange={(page) => {
              if (!restoreInitialPage && page <= 1 && index === requestedIndex) return
              persist(doc, page)
            }}
          />
        </div>
      </div>
    </div>
  )
}
