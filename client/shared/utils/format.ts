/** An element id for a genre, usable as a URL fragment: "Science-Fiction" becomes "genre-science-fiction". */
export function genreAnchor(genre: string): string {
  return `genre-${genre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

const numberFormat = new Intl.NumberFormat('en-GB')

/** "26,512 shows", "1 show". */
export function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${numberFormat.format(count)} ${count === 1 ? singular : plural}`
}

/** "2008 – 2013", "2019 – present" for a running show, or "2020" for a single year. */
export function formatYears(premiered: string | null, ended: string | null, status: string | null): string | null {
  const start = premiered?.slice(0, 4)
  if (!start) return null
  const end = ended?.slice(0, 4) ?? (status === 'Running' ? 'present' : null)
  return end && end !== start ? `${start} – ${end}` : start
}

export function formatRuntime(minutes: number | null): string | null {
  return minutes ? `${minutes} min` : null
}
