/**
 * Single place for scorecard header datetime — avoids mixing getDate/getHours
 * (local) with API instants and bad parses. Uses event timezone when valid (Betfair-style).
 */
export function formatScorecardSubtitle(openDate: string, eventTimezone?: string | null): string | null {
  const trimmed = String(openDate || '').trim()
  if (!trimmed) return null

  const d = new Date(trimmed)
  if (Number.isNaN(d.getTime())) return null

  const opts: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }

  const tz = eventTimezone?.trim()
  if (tz) {
    try {
      new Intl.DateTimeFormat('en', { timeZone: tz }).format(d)
      return new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: tz }).format(d)
    } catch {
      /* invalid IANA — fall back */
    }
  }

  return new Intl.DateTimeFormat('en-GB', opts).format(d)
}
