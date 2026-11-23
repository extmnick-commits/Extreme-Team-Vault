export const DISPLAY_NAME_MIN = 2
export const DISPLAY_NAME_MAX = 80

/** First + last name (or nickname) entered at login. */
export function parseDisplayName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (trimmed.length < DISPLAY_NAME_MIN || trimmed.length > DISPLAY_NAME_MAX) return null
  return trimmed
}