'use client'

import dynamic from 'next/dynamic'
import type { ResolvedLiveEmbed } from '@/lib/liveRoomConfig'

const ZoomMeetingEmbed = dynamic(() => import('./ZoomMeetingEmbed'), { ssr: false })

const WHEREBY_IFRAME_ALLOW =
  'camera; microphone; fullscreen; speaker; display-capture; autoplay; compute-pressure'

type LiveRoomEmbedProps = {
  embed: ResolvedLiveEmbed
  zoomSdkConfigured: boolean
}

export default function LiveRoomEmbed({ embed, zoomSdkConfigured }: LiveRoomEmbedProps) {
  if (embed.provider === 'whereby') {
    return (
      <iframe
        src={embed.src}
        title="Live training room"
        allow={WHEREBY_IFRAME_ALLOW}
        width="100%"
        height="100%"
        className="block border-0"
      />
    )
  }

  return (
    <ZoomMeetingEmbed
      meetingNumber={embed.meetingNumber}
      passcode={embed.passcode}
      sdkConfigured={zoomSdkConfigured}
    />
  )
}
