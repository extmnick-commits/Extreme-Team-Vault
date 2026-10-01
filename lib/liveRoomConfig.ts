export type LiveRoomProvider = 'whereby' | 'zoom'

export type LiveRoomSettings = {
  provider: LiveRoomProvider
  wherebyUrl: string
  /** Paste link for convenience; meeting ID is parsed on save. */
  zoomEmbedUrl: string
  zoomMeetingNumber: string
  /** Plain meeting passcode (not the pwd token from the join URL). */
  zoomPasscode: string
}

export const DEFAULT_LIVE_ROOM_SETTINGS: LiveRoomSettings = {
  provider: 'whereby',
  wherebyUrl: '',
  zoomEmbedUrl: '',
  zoomMeetingNumber: '',
  zoomPasscode: '',
}

export type ParsedZoomMeeting = {
  meetingNumber: string
  passcodeFromUrl: string
}

export function normalizeZoomMeetingNumber(value: string): string {
  return value.replace(/\D/g, '')
}

export function parseZoomMeetingLink(url: string): ParsedZoomMeeting | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  try {
    const parsed = new URL(trimmed)
    if (!isZoomHost(parsed.hostname)) return null

    const passcodeFromUrl =
      parsed.searchParams.get('pwd')?.trim() ||
      parsed.searchParams.get('password')?.trim() ||
      ''

    const path = parsed.pathname
    let meetingNumber = ''

    const patterns = [
      /\/j\/(\d[\d\s-]*\d|\d+)/,
      /\/wc\/join\/(\d[\d\s-]*\d|\d+)/,
      /\/wc\/(\d[\d\s-]*\d|\d+)\/join/,
    ]
    for (const pattern of patterns) {
      const match = path.match(pattern)
      if (match?.[1]) {
        meetingNumber = normalizeZoomMeetingNumber(match[1])
        break
      }
    }

    if (!meetingNumber) return null
    return { meetingNumber, passcodeFromUrl }
  } catch {
    return null
  }
}

export function resolveZoomMeeting(settings: LiveRoomSettings): {
  meetingNumber: string
  passcode: string
} | null {
  const fromFields = normalizeZoomMeetingNumber(settings.zoomMeetingNumber)
  const fromUrl = settings.zoomEmbedUrl.trim()
    ? parseZoomMeetingLink(settings.zoomEmbedUrl)
    : null

  const meetingNumber = fromFields || fromUrl?.meetingNumber || ''
  if (!meetingNumber) return null

  const passcode =
    settings.zoomPasscode.trim() || fromUrl?.passcodeFromUrl.trim() || ''

  return { meetingNumber, passcode }
}

export function isPlaceholderWherebyUrl(url: string | undefined): boolean {
  if (!url) return false
  try {
    const host = new URL(url).hostname
    return host === 'mycustomname.whereby.com' || host === 'subdomain.whereby.com'
  } catch {
    return false
  }
}

function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

function isWherebyHost(hostname: string): boolean {
  return hostname === 'whereby.com' || hostname.endsWith('.whereby.com')
}

function isZoomHost(hostname: string): boolean {
  return hostname === 'zoom.us' || hostname.endsWith('.zoom.us')
}

export function isUsableWherebyUrl(url: string | undefined): url is string {
  if (!url?.trim() || isPlaceholderWherebyUrl(url)) return false
  try {
    const parsed = new URL(url.trim())
    return isHttpsUrl(url) && isWherebyHost(parsed.hostname)
  } catch {
    return false
  }
}

export function isUsableZoomEmbedUrl(url: string | undefined): url is string {
  if (!url?.trim()) return false
  try {
    const parsed = new URL(url.trim())
    return isHttpsUrl(url) && isZoomHost(parsed.hostname)
  } catch {
    return false
  }
}

export type ResolvedLiveEmbed =
  | { provider: 'whereby'; src: string }
  | { provider: 'zoom'; meetingNumber: string; passcode: string }

/** Picks the active embed from admin settings, with env fallback for Whereby. */
export function resolveLiveEmbed(
  settings: LiveRoomSettings,
  envWherebyUrl?: string,
): ResolvedLiveEmbed | null {
  if (settings.provider === 'zoom') {
    const zoom = resolveZoomMeeting(settings)
    if (!zoom) return null
    return { provider: 'zoom', ...zoom }
  }

  if (isUsableWherebyUrl(settings.wherebyUrl)) {
    return { provider: 'whereby', src: settings.wherebyUrl.trim() }
  }
  if (isUsableWherebyUrl(envWherebyUrl)) {
    return { provider: 'whereby', src: envWherebyUrl.trim() }
  }
  return null
}

export function validateLiveRoomSettings(
  input: LiveRoomSettings,
  options: { envWherebyUrl?: string } = {},
): string | undefined {
  const wherebyUrl = input.wherebyUrl.trim()
  const zoomEmbedUrl = input.zoomEmbedUrl.trim()
  const zoomMeetingNumber = normalizeZoomMeetingNumber(input.zoomMeetingNumber)

  if (wherebyUrl && !isUsableWherebyUrl(wherebyUrl)) {
    return 'Whereby URL must be a valid https://…whereby.com/… room link.'
  }
  if (zoomEmbedUrl && !isUsableZoomEmbedUrl(zoomEmbedUrl)) {
    return 'Zoom link must be a valid https://zoom.us/… join link.'
  }
  if (zoomEmbedUrl && !parseZoomMeetingLink(zoomEmbedUrl) && !zoomMeetingNumber) {
    return 'Could not read a meeting ID from that Zoom link. Enter the meeting ID below.'
  }

  if (input.provider === 'zoom') {
    const zoom = resolveZoomMeeting(input)
    if (!zoom) {
      return 'Add a Zoom join link or meeting ID before switching the live room to Zoom.'
    }
  }
  if (
    input.provider === 'whereby' &&
    !isUsableWherebyUrl(wherebyUrl) &&
    !isUsableWherebyUrl(options.envWherebyUrl)
  ) {
    return 'Add a Whereby room URL (or set NEXT_PUBLIC_WHEREBY_URL) before using Whereby.'
  }
  return undefined
}

export function mergeZoomFieldsOnSave(input: LiveRoomSettings): LiveRoomSettings {
  const parsed = input.zoomEmbedUrl.trim() ? parseZoomMeetingLink(input.zoomEmbedUrl) : null
  const meetingNumber =
    normalizeZoomMeetingNumber(input.zoomMeetingNumber) || parsed?.meetingNumber || ''
  const passcode =
    input.zoomPasscode.trim() || parsed?.passcodeFromUrl.trim() || ''

  return {
    ...input,
    zoomMeetingNumber: meetingNumber,
    zoomPasscode: passcode,
  }
}

export const LIVE_ROOM_PROVIDER_LABELS: Record<LiveRoomProvider, string> = {
  whereby: 'Whereby',
  zoom: 'Zoom',
}
