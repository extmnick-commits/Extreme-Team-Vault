'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, Radio, Video } from 'lucide-react'
import {
  LIVE_ROOM_PROVIDER_LABELS,
  type LiveRoomProvider,
  type LiveRoomSettings,
} from '@/lib/liveRoomConfig'
import { setLiveRoomProvider, updateLiveRoomSettings } from './liveRoomActions'
import { ErrorText, inputClass, primaryButtonClass } from './ui'

const providerButtonClass = (active: boolean) =>
  `inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${
    active
      ? 'border-violet-600 bg-violet-50 text-violet-800 shadow-sm'
      : 'border-line bg-surface text-ink-muted hover:bg-zinc-50 hover:text-ink'
  }`

export default function LiveRoomSettingsPanel({
  settings,
  envWherebyConfigured,
  zoomSdkConfigured,
}: {
  settings: LiveRoomSettings
  envWherebyConfigured: boolean
  zoomSdkConfigured: boolean
}) {
  const router = useRouter()
  const [provider, setProvider] = useState<LiveRoomProvider>(settings.provider)
  const [wherebyUrl, setWherebyUrl] = useState(settings.wherebyUrl)
  const [zoomEmbedUrl, setZoomEmbedUrl] = useState(settings.zoomEmbedUrl)
  const [zoomMeetingNumber, setZoomMeetingNumber] = useState(settings.zoomMeetingNumber)
  const [zoomPasscode, setZoomPasscode] = useState(settings.zoomPasscode)
  const [pending, setPending] = useState(false)
  const [togglePending, setTogglePending] = useState<LiveRoomProvider | null>(null)
  const [error, setError] = useState<string | undefined>()

  const dirty =
    provider !== settings.provider ||
    wherebyUrl !== settings.wherebyUrl ||
    zoomEmbedUrl !== settings.zoomEmbedUrl ||
    zoomMeetingNumber !== settings.zoomMeetingNumber ||
    zoomPasscode !== settings.zoomPasscode

  async function handleProviderSwitch(next: LiveRoomProvider) {
    if (next === provider || togglePending) return
    setError(undefined)
    setTogglePending(next)
    const result = await setLiveRoomProvider(next)
    setTogglePending(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setProvider(next)
    router.refresh()
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(undefined)
    const result = await updateLiveRoomSettings({
      provider,
      wherebyUrl,
      zoomEmbedUrl,
      zoomMeetingNumber,
      zoomPasscode,
    })
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
          <Video className="size-5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-lg font-semibold text-ink">Live room embed</h2>
          <p className="text-sm text-ink-muted">
            Choose Whereby or Zoom for the portal live page. Members see whichever provider is
            active below.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Active provider
        </span>
        <div className="flex flex-col gap-2 sm:flex-row" role="group" aria-label="Active provider">
          {(['whereby', 'zoom'] as const).map((id) => {
            const active = provider === id
            const switching = togglePending === id
            return (
              <button
                key={id}
                type="button"
                disabled={Boolean(togglePending) || pending}
                aria-pressed={active}
                onClick={() => handleProviderSwitch(id)}
                className={providerButtonClass(active)}
              >
                {switching ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Radio className="size-4" aria-hidden="true" />
                )}
                {LIVE_ROOM_PROVIDER_LABELS[id]}
                {active && (
                  <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Live
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
          Whereby room URL
          <input
            type="url"
            value={wherebyUrl}
            onChange={(e) => setWherebyUrl(e.target.value)}
            disabled={pending || Boolean(togglePending)}
            placeholder="https://yourname.whereby.com/room-name"
            className={inputClass}
            autoComplete="off"
          />
          <span className="normal-case font-normal text-ink-subtle">
            Paste the full room link from Whereby (must use https).
            {envWherebyConfigured && !wherebyUrl.trim()
              ? ' If empty, the site falls back to NEXT_PUBLIC_WHEREBY_URL until you save a URL here.'
              : null}
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
          Zoom join link
          <input
            type="url"
            value={zoomEmbedUrl}
            onChange={(e) => setZoomEmbedUrl(e.target.value)}
            disabled={pending || Boolean(togglePending)}
            placeholder="https://zoom.us/j/123456789"
            className={inputClass}
            autoComplete="off"
          />
          <span className="normal-case font-normal text-ink-subtle">
            Paste your normal Zoom invite link. The meeting loads inside the portal (not the Zoom
            app) using Zoom&apos;s Meeting SDK.
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
          Zoom meeting ID
          <input
            type="text"
            inputMode="numeric"
            value={zoomMeetingNumber}
            onChange={(e) => setZoomMeetingNumber(e.target.value)}
            disabled={pending || Boolean(togglePending)}
            placeholder="Optional if the join link includes it"
            className={inputClass}
            autoComplete="off"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
          Zoom passcode
          <input
            type="text"
            value={zoomPasscode}
            onChange={(e) => setZoomPasscode(e.target.value)}
            disabled={pending || Boolean(togglePending)}
            placeholder="Meeting passcode if required"
            className={inputClass}
            autoComplete="off"
          />
          <span className="normal-case font-normal text-ink-subtle">
            Use the plain passcode from the invite (not the long pwd token in the URL).
          </span>
        </label>

        {!zoomSdkConfigured && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Add{' '}
            <code className="text-amber-950">ZOOM_MEETING_SDK_CLIENT_ID</code> and{' '}
            <code className="text-amber-950">ZOOM_MEETING_SDK_CLIENT_SECRET</code> to your server
            env (Zoom Marketplace → Meeting SDK app) so members can join in-page.
          </p>
        )}

        <ErrorText error={error ?? null} />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending || Boolean(togglePending) || !dirty}
            className={primaryButtonClass}
          >
            {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
            Save URLs
          </button>
          {!dirty && (
            <p className="text-sm text-ink-subtle">
              Currently showing{' '}
              <span className="font-medium text-ink">{LIVE_ROOM_PROVIDER_LABELS[provider]}</span>{' '}
              on the live page.
            </p>
          )}
        </div>
      </form>
    </section>
  )
}
