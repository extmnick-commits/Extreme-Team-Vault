'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Play } from 'lucide-react'

type ZoomMeetingEmbedProps = {
  meetingNumber: string
  passcode: string
  sdkConfigured: boolean
}

export default function ZoomMeetingEmbed({
  meetingNumber,
  passcode,
  sdkConfigured,
}: ZoomMeetingEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<ReturnType<
    typeof import('@zoom/meetingsdk/embedded').default.createClient
  > | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [phase, setPhase] = useState<'idle' | 'joining' | 'joined' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      const client = clientRef.current
      clientRef.current = null
      void client?.leaveMeeting?.()
    }
  }, [])

  const joinMeeting = useCallback(async () => {
    if (!sdkConfigured) {
      setError(
        'Zoom in-page meetings need Meeting SDK credentials (ZOOM_MEETING_SDK_CLIENT_ID and ZOOM_MEETING_SDK_CLIENT_SECRET).',
      )
      setPhase('error')
      return
    }

    const name = displayName.trim() || 'Guest'
    if (!containerRef.current) return

    setPhase('joining')
    setError(null)

    try {
      const authResponse = await fetch('/api/portal/zoom-meeting/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingNumber }),
      })
      const auth = (await authResponse.json()) as {
        signature?: string
        sdkKey?: string
        error?: string
      }
      if (!authResponse.ok || !auth.signature || !auth.sdkKey) {
        throw new Error(auth.error ?? 'Could not authorize the Zoom meeting.')
      }

      const ZoomMtgEmbedded = (await import('@zoom/meetingsdk/embedded')).default
      if (!clientRef.current) {
        clientRef.current = ZoomMtgEmbedded.createClient()
      }
      const client = clientRef.current

      await client.init({
        zoomAppRoot: containerRef.current,
        language: 'en-US',
        patchJsMedia: true,
        leaveOnPageUnload: true,
      })

      await client.join({
        signature: auth.signature,
        sdkKey: auth.sdkKey,
        meetingNumber,
        password: passcode,
        userName: name,
      })

      setPhase('joined')
    } catch (joinError) {
      console.error('[ZoomMeetingEmbed]', joinError)
      setError(joinError instanceof Error ? joinError.message : 'Could not join the Zoom meeting.')
      setPhase('error')
    }
  }, [displayName, meetingNumber, passcode, sdkConfigured])

  return (
    <div className="relative size-full bg-black">
      <div
        ref={containerRef}
        className={`absolute inset-0 ${phase === 'joined' ? 'z-10' : 'pointer-events-none opacity-0'}`}
      />

      {phase !== 'joined' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-6 text-center">
          {phase === 'joining' ? (
            <>
              <Loader2 className="size-10 animate-spin text-violet-400" aria-hidden="true" />
              <p className="text-sm text-zinc-200">Connecting to Zoom…</p>
            </>
          ) : (
            <>
              <label className="flex w-full max-w-xs flex-col gap-1.5 text-left text-xs font-medium text-zinc-300">
                Your name
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Guest"
                  maxLength={64}
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500"
                />
              </label>
              <button
                type="button"
                onClick={() => void joinMeeting()}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
              >
                <Play className="size-4 fill-current" aria-hidden="true" />
                Join live room
              </button>
              {error && <p className="max-w-sm text-sm text-red-300">{error}</p>}
            </>
          )}
        </div>
      )}
    </div>
  )
}
