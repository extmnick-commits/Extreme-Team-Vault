import { Disc3, Waves } from 'lucide-react'
import VideoThumbnailImage from './VideoThumbnailImage'

export function AlbumArtworkPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/90 shadow-inner ${className}`}
    >
      <div className="absolute inset-0 bg-linear-to-br from-violet-950/80 via-zinc-900 to-fuchsia-950/60" />
      <div className="absolute inset-0 opacity-40">
        <Waves className="absolute -right-4 -bottom-6 size-32 text-violet-500/30" strokeWidth={1} aria-hidden="true" />
      </div>
      <Disc3 className="relative size-10 text-violet-300/90 sm:size-14" strokeWidth={1.25} aria-hidden="true" />
    </div>
  )
}

export default function AlbumArtwork({
  src,
  alt,
  className = '',
  loading = 'lazy',
}: {
  src?: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
}) {
  if (!src) {
    return <AlbumArtworkPlaceholder className={className} />
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-line bg-zinc-900 shadow-md shadow-zinc-900/10 ${className}`}
    >
      <VideoThumbnailImage src={src} alt={alt} loading={loading} imageClassName="object-cover" />
    </div>
  )
}
