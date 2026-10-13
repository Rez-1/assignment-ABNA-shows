/** An element id for a genre, usable as a URL fragment: "Science-Fiction" becomes "genre-science-fiction". */
export function genreAnchor(genre: string): string {
  return `genre-${genre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

const numberFormat = new Intl.NumberFormat('en-GB')

/** "26,512 shows", "1 show". */
export function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${numberFormat.format(count)} ${count === 1 ? singular : plural}`
}
