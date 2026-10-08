'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import type { LibraryGroup } from '@/lib/libraryTypes'
import { validateThumbnailFile, THUMBNAIL_ACCEPT } from '@/lib/videoTypes'
import DocumentCoverPicker from './DocumentCoverPicker'
import { albumArtworkAspectHint, postAudioAlbumCoverFile } from './audioAlbumCoverClient'
import { removeAudioAlbumCover } from './actions'
import { ghostButtonClass, iconButtonClass } from './ui'

export default function AudioAlbumCoverControls({
  group,
  disabled,
  onError,
  onHint,
}: {
  group: LibraryGroup
  disabled: boolean
  onError: (message: string | null) => void
  onHint?: (message: string | null) => void
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  const preview =
    localPreview ??
    (group.coverUrl
      ? `${group.coverUrl}${group.coverUrl.includes('?') ? '&' : '?'}v=${version}`
      : undefined)

  async function uploadFile(picked: File) {
    const validationError = validateThumbnailFile(picked)
    if (validationError) {
      onError(validationError)
      return
    }
    const hint = await albumArtworkAspectHint(picked)
    onHint?.(hint ?? null)

    setBusy(true)
    onError(null)
    const result = await postAudioAlbumCoverFile(group.id, picked)
    setBusy(false)
    if (!result.ok) {
      onError(result.error)
      return
    }
    if (localPreview) URL.revokeObjectURL(localPreview)
    setLocalPreview(URL.createObjectURL(picked))
    setVersion((v) => v + 1)
    router.refresh()
  }

  async function removeCover() {
    setBusy(true)
    onError(null)
    const result = await removeAudioAlbumCover(group.id)
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
        aspectClassName="aspect-square"
        hint="Square JPG/PNG/WebP"
        preview={preview}
        generating={busy}
        disabled={disabled || busy}
        onPick={(picked) => {
          void uploadFile(picked)
        }}
        onClear={() => {
          if (group.coverUrl || localPreview) void removeCover()
          else if (localPreview) {
            URL.revokeObjectURL(localPreview)
            setLocalPreview(null)
          }
        }}
      />
      <div className="flex flex-wrap justify-center gap-1">
        {(group.coverUrl || localPreview) && (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => removeCover()}
            className={`${iconButtonClass} hover:text-red-600`}
            title="Remove artwork"
            aria-label="Remove album artwork"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </button>
        )}
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className={ghostButtonClass}
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : 'Upload'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={THUMBNAIL_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const picked = e.target.files?.[0]
            e.target.value = ''
            if (picked) void uploadFile(picked)
          }}
        />
      </div>
    </div>
  )
}
