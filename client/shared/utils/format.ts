const numberFormat = new Intl.NumberFormat('en-GB')

/** "26,512 shows", "1 show". */
export function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${numberFormat.format(count)} ${count === 1 ? singular : plural}`
}

/** The year of an ISO date such as "2008-01-20", or null when there is no date. */
export function yearOf(isoDate: string | null): string | null {
  return isoDate?.slice(0, 4) || null
}

/** "2008 – 2013", "2019 – present" for a running show, or "2020" for a single year. */
export function formatYears(premiered: string | null, ended: string | null, status: string | null): string | null {
  const start = yearOf(premiered)
  if (!start) return null
  const end = yearOf(ended) ?? (status === 'Running' ? 'present' : null)
  return end && end !== start ? `${start} – ${end}` : start
}

export function formatRuntime(minutes: number | null): string | null {
  return minutes ? `${minutes} min` : null
}

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

/** Formats an ISO date such as "2008-01-20" as "20 Jan 2008"; null when missing or invalid. */
export function formatDate(isoDate: string | null): string | null {
  if (!isoDate) return null
  const date = new Date(isoDate)
  return Number.isNaN(date.getTime()) ? null : dateFormat.format(date)
}
