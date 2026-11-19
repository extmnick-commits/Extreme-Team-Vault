'use client'

import { forwardRef } from 'react'

type PortalStreamVideoProps = {
  videoId: string
  title: string
  poster?: string
}

const PortalStreamVideo = forwardRef<HTMLVideoElement, PortalStreamVideoProps>(
  function PortalStreamVideo({ videoId, title, poster }, ref) {
    const streamSrc = `/api/portal/video-playback/${encodeURIComponent(videoId)}/hls`

    return (
      <video
        ref={ref}
        className="absolute inset-0 size-full bg-black object-contain"
        title={title}
        controls
        playsInline
        poster={poster}
        preload="auto"
        src={streamSrc}
      />
    )
  },
)

export default PortalStreamVideo
