'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { PDFDocumentProxy } from 'pdfjs-dist'

let workerReady: Promise<void> | null = null

async function loadPdfjs() {
  const pdfjs = await import('pdfjs-dist')
  if (!workerReady) {
    workerReady = Promise.resolve().then(() => {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
    })
  }
  await workerReady
  return pdfjs
}

export default function PdfPageViewer({
  src,
  title,
  initialPage,
  onPageChange,
}: {
  src: string
  title: string
  initialPage?: number
  onPageChange?: (page: number, pageCount: number) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const docRef = useRef<PDFDocumentProxy | null>(null)
  const taskRef = useRef<{ destroy: () => Promise<void> } | null>(null)
  const restored = useRef(false)
  const onPageChangeRef = useRef(onPageChange)

  useEffect(() => {
    onPageChangeRef.current = onPageChange
  }, [onPageChange])

  useEffect(() => {
    let cancelled = false
    restored.current = false

    async function load() {
      try {
        const pdfjs = await loadPdfjs()
        const response = await fetch(src, { credentials: 'same-origin' })
        if (!response.ok) throw new Error('Could not open this PDF.')
        const data = await response.arrayBuffer()
        const loadingTask = pdfjs.getDocument({ data })
        const pdf = await loadingTask.promise
        if (cancelled) {
          await loadingTask.destroy()
          return
        }
        const previous = taskRef.current
        taskRef.current = loadingTask
        docRef.current = pdf
        await previous?.destroy().catch(() => undefined)
        const wanted =
          initialPage && initialPage >= 1 && initialPage <= pdf.numPages ? initialPage : 1
        restored.current = true
        setPageCount(pdf.numPages)
        setPage(wanted)
        setLoading(false)
        setError(null)
      } catch (err: unknown) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Could not open this PDF.')
        setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
      taskRef.current?.destroy().catch(() => undefined)
      docRef.current = null
    }
  }, [src, initialPage])

  useEffect(() => {
    const pdf = docRef.current
    const canvas = canvasRef.current
    if (!pdf || !canvas || page < 1) return
    let cancelled = false

    async function render() {
      const doc = docRef.current
      const target = canvasRef.current
      if (!doc || !target) return
      const pdfPage = await doc.getPage(page)
      if (cancelled) return
      const base = pdfPage.getViewport({ scale: 1 })
      const width = Math.min(target.parentElement?.clientWidth || base.width, 960)
      const scale = width / base.width
      const viewport = pdfPage.getViewport({ scale: Math.min(2, scale) })
      target.width = Math.floor(viewport.width)
      target.height = Math.floor(viewport.height)
      const context = target.getContext('2d')
      if (!context) return
      await pdfPage.render({ canvasContext: context, viewport, canvas: target }).promise
    }

    void render().catch(() => {
      if (!cancelled) setError('Could not render this page.')
    })

    if (restored.current && pageCount > 0) onPageChangeRef.current?.(page, pageCount)

    return () => {
      cancelled = true
    }
  }, [page, pageCount, src])

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-zinc-100 px-4 py-16 text-center">
        <p className="text-sm text-ink-muted">{error}</p>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-violet-600 hover:text-violet-700"
        >
          Open in a new tab
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-center gap-2 text-sm text-ink-muted">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page <= 1 || loading}
          className="flex size-10 items-center justify-center rounded-xl border border-line bg-surface text-ink-muted shadow-sm transition hover:bg-zinc-50 hover:text-ink disabled:pointer-events-none disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="min-w-32 text-center tabular-nums">
          {loading ? 'Loading…' : `Page ${page} of ${pageCount}`}
        </span>
        <button
          type="button"
          onClick={() => setPage((current) => Math.min(pageCount || current, current + 1))}
          disabled={!pageCount || page >= pageCount || loading}
          className="flex size-10 items-center justify-center rounded-xl border border-line bg-surface text-ink-muted shadow-sm transition hover:bg-zinc-50 hover:text-ink disabled:pointer-events-none disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="relative overflow-auto rounded-lg bg-zinc-100 p-3">
        {loading && (
          <div className="flex min-h-80 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-violet-600" aria-label="Loading PDF" />
          </div>
        )}
        <canvas
          ref={canvasRef}
          title={title}
          className={`mx-auto max-w-full bg-white shadow-md ring-1 ring-zinc-200 ${loading ? 'hidden' : 'block'}`}
        />
      </div>
    </div>
  )
}
