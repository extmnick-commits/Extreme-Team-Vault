'use client'

import { useRef } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import VideoThumbnailImage from '../../components/VideoThumbnailImage'
import { THUMBNAIL_ACCEPT } from '@/lib/videoTypes'

export default function DocumentCoverPicker({
  preview,
  generating,
  disabled,
  onPick,
  onClear,
}: {
  preview?: string
  generating?: boolean
  disabled?: boolean
  onPick: (file: File) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg border border-line bg-zinc-900 sm:w-28">
      {generating ? (
        <div className="flex size-full flex-col items-center justify-center gap-1 text-xs text-ink-muted">
          <Loader2 className="size-5 animate-spin text-violet-500" aria-hidden="true" />
          <span>Preview…</span>
        </div>
      ) : preview ? (
        <>
          <VideoThumbnailImage src={preview} alt="" />
          {!disabled && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Remove cover"
              className="absolute top-1 right-1 z-10 rounded-md bg-black/60 p-1 text-white transition hover:bg-black/80"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </>
      ) : (
        <label
          className={`flex size-full cursor-pointer flex-col items-center justify-center gap-1 px-2 text-center text-xs text-ink-muted transition ${
            disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-violet-50 hover:text-violet-700'
          }`}
        >
          <ImagePlus className="size-5 text-violet-400" aria-hidden="true" />
          <span className="font-medium">Cover</span>
          <span className="text-[10px] leading-tight text-ink-subtle">Optional image</span>
          <input
            ref={inputRef}
            type="file"
            accept={THUMBNAIL_ACCEPT}
            disabled={disabled}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onPick(file)
              e.target.value = ''
            }}
          />
        </label>
      )}
    </div>
  )
}
