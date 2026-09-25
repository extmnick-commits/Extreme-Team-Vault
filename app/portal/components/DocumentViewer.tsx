'use client'

import { useState } from 'react'
import { Download, ExternalLink, FileText } from 'lucide-react'

export type ViewerDocument = {
  id: string
  title: string
  description: string
  src: string
  badge: string
}

export default function DocumentViewer({ documents }: { documents: ViewerDocument[] }) {
  const [index, setIndex] = useState(0)
  const doc = documents[index]
  if (!doc) return null

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <ol className="divide-y divide-zinc-800 self-start overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
        {documents.map((d, i) => {
          const current = i === index
          return (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-current={current ? 'true' : undefined}
                className={`flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-zinc-900 ${
                  current ? 'bg-sky-500/10' : ''
                }`}
              >
                <FileText
                  className={`mt-0.5 size-4 shrink-0 ${current ? 'text-sky-300' : 'text-zinc-500'}`}
                  aria-hidden="true"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className={`font-medium ${current ? 'text-sky-200' : 'text-zinc-100'}`}>
                    {d.title}
                  </span>
                  <span className="text-xs text-zinc-500 tabular-nums">{d.badge}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-medium text-zinc-100">{doc.title}</span>
            {doc.description && <p className="text-sm text-zinc-500">{doc.description}</p>}
          </div>
          <div className="flex shrink-0 gap-2">
            <a
              href={doc.src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              Open
            </a>
            <a
              href={doc.src}
              download
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white"
            >
              <Download className="size-4" aria-hidden="true" />
              Download
            </a>
          </div>
        </div>
        <iframe
          key={doc.id}
          src={`${doc.src}#view=FitH`}
          title={doc.title}
          className="h-[75vh] w-full rounded-lg border border-zinc-800 bg-zinc-950"
        />
      </div>
    </div>
  )
}
