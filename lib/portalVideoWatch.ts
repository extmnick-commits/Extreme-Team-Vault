export function portalVideoWatchPath(videoId: string): string {
  return `/portal/videos/${encodeURIComponent(videoId)}/watch`
}

/** Bunny-hosted play URL (opens their player in a new tab if the OS does not take the file). */
export function bunnyDirectPlayUrl(libraryId: string, bunnyVideoId: string): string {
  return `https://player.mediadelivery.net/play/${libraryId}/${bunnyVideoId}`
}

export function absolutePortalUrl(path: string): string {
  if (typeof window === 'undefined') return path
  return new URL(path, window.location.origin).href
}
