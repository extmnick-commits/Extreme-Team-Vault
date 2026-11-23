'use client'

import { useCallback, useState } from 'react'
import { Check, Copy, Video } from 'lucide-react'

type ZoomLinkCardProps = {
  zoomUrl: string
}

export default function ZoomLinkCard({ zoomUrl }: ZoomLinkCardProps) {
  const [copied, setCopied] = useState(false)
  const trimmed = zoomUrl.trim()

  const copy = useCallback(async () => {
    if (!trimmed) return
    try {
      await navigator.clipboard.writeText(trimmed)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [trimmed])

  if (!trimmed) {
    return (
      <div className="rounded-2xl border border-line bg-surface px-6 py-10 text-center shadow-sm">
        <Video className="mx-auto size-8 text-ink-subtle" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-ink">Zoom link not available yet</p>
        <p className="mt-1 text-sm text-ink-muted">Check back before your next live session.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
            <Video className="size-5" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-base font-semibold text-ink sm:text-lg">Zoom meeting link</h2>
            <p className="text-sm text-ink-muted">
              Copy the link below and paste it into Zoom or your browser to join live trainings and
              opportunity night.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <label className="sr-only" htmlFor="zoom-join-url">
            Zoom join URL
          </label>
          <input
            id="zoom-join-url"
            type="text"
            readOnly
            value={trimmed}
            className="min-h-11 flex-1 rounded-xl border border-line bg-white px-3 py-2 font-mono text-sm text-ink shadow-inner focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
            onFocus={(e) => e.target.select()}
          />
          <button
            type="button"
            onClick={() => void copy()}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
          >
            {copied ? (
              <>
                <Check className="size-4" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-4" aria-hidden="true" />
                Copy link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}