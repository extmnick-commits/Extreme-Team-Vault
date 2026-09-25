'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { Loader2, RefreshCw, Trash2 } from 'lucide-react'
import type { LibraryFile, PdfLibrary } from '@/lib/libraryTypes'
import { THUMBNAIL_ACCEPT } from '@/lib/videoTypes'
import DocumentCoverPicker from './DocumentCoverPicker'
import {
  fetchPdfBytesForCover,
  postDocumentCoverBlob,
  postDocumentCoverFile,
} from './documentCoverClient'
import { renderPdfCover, pdfCoverErrorMessage } from './generatePdfCover'
import { removeDocumentCover } from './actions'
import { ghostButtonClass, iconButtonClass } from './ui'

export default function DocumentCoverControls({
  library,
  file,
  disabled,
  onError,
}: {
  library: PdfLibrary
  file: LibraryFile
  disabled: boolean
  onError: (message: string | null) => void
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  const preview =
    localPreview ??
    (file.thumbnailUrl ? `${file.thumbnailUrl}${file.thumbnailUrl.includes('?') ? '&' : '?'}v=${version}` : undefined)

  async function uploadBlob(blob: Blob) {
    setBusy(true)
    onError(null)
    const result = await postDocumentCoverBlob(library, file.name, blob)
    setBusy(false)
    if (!result.ok) {
      onError(result.error)
      return
    }
    if (localPreview) URL.revokeObjectURL(localPreview)
    setLocalPreview(URL.createObjectURL(blob))
    setVersion((v) => v + 1)
    router.refresh()
  }

  async function regenerateFromPdf() {
    setBusy(true)
    onError(null)
    try {
      const bytes = await fetchPdfBytesForCover(library, file.name, file.cdnUrl)
      const blob = await renderPdfCover(bytes)
      await uploadBlob(blob)
    } catch (error) {
      setBusy(false)
      onError(pdfCoverErrorMessage(error))
    }
  }

  async function removeCover() {
    setBusy(true)
    onError(null)
    const result = await removeDocumentCover(file.name, library)
    setBusy(false)
    if (!result.ok) {
      onError(result.error)
      return
    }
    if (localPreview) URL.revokeObjectURL(localPreview)
    setLocalPreview(null)
    setVersion((v) => v + 1)
    router.refresh()
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <DocumentCoverPicker
        preview={preview}
        generating={busy}
        disabled={disabled || busy}
        onPick={(picked) => {
          void (async () => {
            setBusy(true)
            onError(null)
            const result = await postDocumentCoverFile(library, file.name, picked)
            setBusy(false)
            if (!result.ok) {
              onError(result.error)
              return
            }
            if (localPreview) URL.revokeObjectURL(localPreview)
            setLocalPreview(URL.createObjectURL(picked))
            setVersion((v) => v + 1)
            router.refresh()
          })()
        }}
        onClear={() => {
          if (file.thumbnailUrl || localPreview) void removeCover()
          else if (localPreview) {
            URL.revokeObjectURL(localPreview)
            setLocalPreview(null)
          }
        }}
      />
      <div className="flex flex-wrap justify-center gap-1">
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => regenerateFromPdf()}
          className={iconButtonClass}
          title="Regenerate from PDF page 1"
          aria-label="Regenerate cover from PDF"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
        </button>
        {(file.thumbnailUrl || localPreview) && (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => removeCover()}
            className={`${iconButtonClass} hover:text-red-600`}
            title="Remove cover"
            aria-label="Remove cover"
          >
            <Trash2 className="size-4" />
          </button>
        )}
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className={ghostButtonClass}
        >
          Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={THUMBNAIL_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const picked = e.target.files?.[0]
            e.target.value = ''
            if (picked) {
              void (async () => {
                setBusy(true)
                onError(null)
                const result = await postDocumentCoverFile(library, file.name, picked)
                setBusy(false)
                if (!result.ok) {
                  onError(result.error)
                  return
                }
                if (localPreview) URL.revokeObjectURL(localPreview)
                setLocalPreview(URL.createObjectURL(picked))
                setVersion((v) => v + 1)
                router.refresh()
              })()
            }
          }}
        />
      </div>
    </div>
  )
}

/** Call after replacing a PDF to rebuild the cover from the new file bytes. */
export async function uploadCoverFromPdfFile(
  library: PdfLibrary,
  pdfName: string,
  pdfFile: File,
) {
  const blob = await renderPdfCover(pdfFile)
  return postDocumentCoverBlob(library, pdfName, blob)
}
