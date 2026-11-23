/** Bunny timestamps are UTC and often omit a timezone suffix. */
export function parseBunnyDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const msMatch = /^\/Date\((\d+)\)\/$/.exec(trimmed)
  if (msMatch) {
    const date = new Date(Number(msMatch[1]))
    return Number.isNaN(date.getTime()) ? null : date
  }

  const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed) ? trimmed : `${trimmed}Z`
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

export function bunnyDateToIso(value: unknown): string | undefined {
  const date = parseBunnyDate(value)
  return date ? date.toISOString() : undefined
}

const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/

/** `YYYY-MM-DD` from an HTML date input → ISO timestamp (noon UTC). */
export function calendarDateToIso(value: string): string | undefined {
  const trimmed = value.trim()
  if (!CALENDAR_DATE.test(trimmed)) return undefined
  const [y, m, d] = trimmed.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0))
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() + 1 !== m ||
    date.getUTCDate() !== d
  ) {
    return undefined
  }
  return date.toISOString()
}

const DISPLAY_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

/** Portal-facing label for a video session or upload date (`Mar 15, 2019`). */
export function formatVideoDisplayDate(iso?: string): string | undefined {
  const date = iso?.trim() ? parseBunnyDate(iso) ?? new Date(iso) : null
  if (!date || Number.isNaN(date.getTime())) return undefined
  const month = DISPLAY_MONTHS[date.getUTCMonth()]
  if (!month) return undefined
  return `${month} ${date.getUTCDate()}, ${date.getUTCFullYear()}`
}
