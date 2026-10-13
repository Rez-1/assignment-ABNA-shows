import type { ShowSummary } from '../../shared/types.ts'

/**
 * Orders shows best first: highest average rating, then TVMaze's popularity
 * weight (the API exposes no vote count, so this keeps ties sensible), then
 * name for a stable order. Unrated shows always come last.
 */
export function compareBestFirst(a: ShowSummary, b: ShowSummary): number {
  if (a.rating !== b.rating) {
    if (a.rating === null) return 1
    if (b.rating === null) return -1
    return b.rating - a.rating
  }
  return b.weight - a.weight || a.name.localeCompare(b.name)
}

/** Lower-cases and strips accents so "pokemon" finds "Pokémon". */
export function normalise(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export const MATCH_RANKS = 4

/**
 * How well a (normalised) name matches a (normalised) query: 0 exact,
 * 1 starts with it, 2 a later word starts with it, 3 contains it; null for no match.
 */
export function matchRank(name: string, query: string): number | null {
  const index = name.indexOf(query)
  if (index === -1) return null
  if (index === 0) return name.length === query.length ? 0 : 1
  return name.includes(` ${query}`) ? 2 : 3
}
