/** True on Android phones/tablets (Chrome, Samsung Internet, etc.). */
export function isAndroidBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}
