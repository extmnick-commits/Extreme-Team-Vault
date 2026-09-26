export type LiveRoomProvider = 'whereby' | 'zoom'

export type LiveRoomSettings = {
  provider: LiveRoomProvider
  wherebyUrl: string
  zoomEmbedUrl: string
}

export const DEFAULT_LIVE_ROOM_SETTINGS: LiveRoomSettings = {
  provider: 'whereby',
  wherebyUrl: '',
  zoomEmbedUrl: '',
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

export type ResolvedLiveEmbed = {
  provider: LiveRoomProvider
  src: string
}

/** Picks the active embed URL from admin settings, with env fallback for Whereby. */
export function resolveLiveEmbed(
  settings: LiveRoomSettings,
  envWherebyUrl?: string,
): ResolvedLiveEmbed | null {
  if (settings.provider === 'zoom') {
    if (!isUsableZoomEmbedUrl(settings.zoomEmbedUrl)) return null
    return { provider: 'zoom', src: settings.zoomEmbedUrl.trim() }
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

  if (wherebyUrl && !isUsableWherebyUrl(wherebyUrl)) {
    return 'Whereby URL must be a valid https://…whereby.com/… room link.'
  }
  if (zoomEmbedUrl && !isUsableZoomEmbedUrl(zoomEmbedUrl)) {
    return 'Zoom URL must be a valid https://zoom.us/… embed or join link.'
  }
  if (input.provider === 'zoom' && !isUsableZoomEmbedUrl(zoomEmbedUrl)) {
    return 'Add a Zoom embed URL before switching the live room to Zoom.'
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

export const LIVE_ROOM_PROVIDER_LABELS: Record<LiveRoomProvider, string> = {
  whereby: 'Whereby',
  zoom: 'Zoom',
}
