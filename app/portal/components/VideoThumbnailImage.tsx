'use client'

import { useEffect, useState, type ImgHTMLAttributes } from 'react'

type VideoThumbnailImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt'> & {
  alt?: string
  /** Extra classes merged with fit/position utilities. */
  imageClassName?: string
}

/**
 * Thumbnail in a fixed 16:9 (or similar) frame. Landscape uses cover; portrait uses contain so nothing is cropped off.
 */
export default function VideoThumbnailImage({
  src,
  alt = '',
  className = '',
  imageClassName = '',
  onLoad,
  ...rest
}: VideoThumbnailImageProps) {
  const [portrait, setPortrait] = useState<boolean | null>(null)

  useEffect(() => {
    setPortrait(null)
  }, [src])

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      {...rest}
      onLoad={(event) => {
        const img = event.currentTarget
        setPortrait(img.naturalHeight > img.naturalWidth)
        onLoad?.(event)
      }}
      className={`absolute inset-0 size-full ${
        portrait
          ? 'object-contain object-center'
          : 'object-cover object-center'
      } ${imageClassName} ${className}`}
    />
  )
}
