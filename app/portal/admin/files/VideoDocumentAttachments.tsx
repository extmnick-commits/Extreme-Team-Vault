'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Link2, Loader2, Trash2, Upload } from 'lucide-react'
import type { LibraryFile, LibraryView } from '@/lib/libraryTypes'
import { ACCEPT_ATTRIBUTE } from '@/lib/libraryTypes'
import { collectLibraryFiles, resolveLinkedDocuments } from '@/lib/videoResourceUtils'
import type { VideoAttachmentEntry } from '@/lib/videoTypes'
import { finalizeUpload } from './actions'
import {
  attachVideoDocumentAction,
  detachVideoDocumentAction,
} from './videoResourceActions'
import { useBlobUpload, validateFile } from './useBlobUpload'
import { ErrorText, ghostButtonClass, inputClass, primaryButtonClass, selectClass, useAction } from './ui'

export default function VideoDocumentAttachments({
  videoId,
  attachments,
  documentsView,
  blobAccess,
}: {
  videoId: string
  attachments: VideoAttachmentEntry[]
  documentsView: LibraryView
  blobAccess: 'public' | 'private'
}) {
  const router = useRouter()
  const uploadBlob = useBlobUpload('documents', blobAccess)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { pending, error, run, setError } = useAction()
  const [selectedDocument, setSelectedDocument] = useState('')
  const [linkLabel, setLinkLabel] = useState('')
  const [uploading, setUploading] = useState(false)

  const lookup = useMemo(() => {
    const map = new Map<string, LibraryFile>()
    for (const file of collectLibraryFiles(documentsView)) {
      map.set(file.name, file)
    }
    return map
  }, [documentsView])

  const linked = useMemo(
    () => resolveLinkedDocuments(attachments, lookup),
    [attachments, lookup],
  )

  const attachedNames = useMemo(
    () => new Set(attachments.map((entry) => entry.documentName)),
    [attachments],
  )

  const availableDocuments = useMemo(
    () =>
      collectLibraryFiles(documentsView)
        .filter((file) => !attachedNames.has(file.name))
        .sort((a, b) => a.title.localeCompare(b.title)),
    [documentsView, attachedNames],
  )

  function refresh() {
    router.refresh()
  }

  function linkExisting() {
    if (!selectedDocument) {
      setError('Choose a PDF from the library.')
      return
    }
    run(
      () =>
        attachVideoDocumentAction({
          videoId,
          documentName: selectedDocument,
          label: linkLabel || undefined,
        }),
      () => {
        setSelectedDocument('')
        setLinkLabel('')
        refresh()
      },
    )
  }

  async function uploadPdf(file: File) {
    const validationError = validateFile(file, 'documents')
    if (validationError) {
      setError(validationError)
      return
    }

    setUploading(true)
    setError(null)
    try {
      const blobUrl = await uploadBlob(file)
      const result = await finalizeUpload({
        library: 'documents',
        blobUrl,
        originalName: file.name,
        title: file.name.replace(/\.pdf$/i, ''),
        sectionId: null,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }

      const attachResult = await attachVideoDocumentAction({
        videoId,
        documentName: result.name,
        label: linkLabel || undefined,
      })
      if (!attachResult.ok) {
        setError(attachResult.error)
        return
      }
      setLinkLabel('')
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const busy = pending || uploading

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-xl border border-dashed border-line bg-zinc-50/60 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        <FileText className="size-3.5" aria-hidden="true" />
        Training PDFs
      </div>

      {linked.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {linked.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-2.5 py-2"
            >
              <span className="min-w-0 truncate text-sm text-ink">{doc.title}</span>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(
                    () =>
                      detachVideoDocumentAction({ videoId, documentName: doc.id }),
                    refresh,
                  )
                }
                className={`${ghostButtonClass} shrink-0 px-2 text-red-600 hover:text-red-700`}
                aria-label={`Remove ${doc.title}`}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-ink-subtle">No PDFs linked yet.</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_ATTRIBUTE.documents}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void uploadPdf(file)
          event.target.value = ''
        }}
      />

      <label className="text-xs text-ink-muted">
        Optional label for next PDF
        <input
          value={linkLabel}
          onChange={(e) => setLinkLabel(e.target.value)}
          disabled={busy}
          placeholder="e.g. Worksheet"
          className={`${inputClass} mt-1`}
        />
      </label>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-xs text-ink-muted">
          Link existing PDF
          <select
            value={selectedDocument}
            onChange={(e) => setSelectedDocument(e.target.value)}
            disabled={busy || availableDocuments.length === 0}
            className={`${selectClass} mt-1 w-full`}
          >
            <option value="">
              {availableDocuments.length === 0 ? 'No other PDFs available' : 'Choose a document…'}
            </option>
            {availableDocuments.map((file) => (
              <option key={file.name} value={file.name}>
                {file.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={busy || !selectedDocument}
          onClick={linkExisting}
          className={`${primaryButtonClass} shrink-0`}
        >
          {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
          <Link2 className="size-3.5" aria-hidden="true" />
          Link
        </button>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => fileInputRef.current?.click()}
        className={`${ghostButtonClass} w-full justify-center border border-line bg-surface`}
      >
        {uploading && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
        <Upload className="size-3.5" aria-hidden="true" />
        Upload new PDF
      </button>

      <ErrorText error={error} />
    </div>
  )
}
