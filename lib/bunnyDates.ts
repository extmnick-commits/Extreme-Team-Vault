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
