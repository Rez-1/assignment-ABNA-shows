import type { LocationQuery, RouteLocationRaw } from 'vue-router'

/**
 * How the app's state is written in the URL: `?q=`, `?genre=` and `?page=` for
 * search and paging, and the fragment that points at a genre row. Everything
 * that reads or writes those goes through here.
 */

/** Anything with the query of the current address, such as the current route. */
type HasQuery = { query: LocationQuery }

export interface Search {
  query: string
  genre?: string
  page: number
}

function readText(value: LocationQuery[string] | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** The page in the address; anything that is not a plain positive whole number means page 1. */
export function readPage({ query }: HasQuery): number {
  const { page } = query
  return typeof page === 'string' && /^[1-9]\d{0,5}$/.test(page) ? Number(page) : 1
}

export function readSearch(route: HasQuery): Search {
  return { query: readText(route.query.q), genre: readText(route.query.genre) || undefined, page: readPage(route) }
}

/**
 * The address of a search. It takes no page: a search with different text or
 * another genre is a different list, so it starts again from the first page.
 */
export function searchLocation({ query, genre }: { query: string; genre?: string }): RouteLocationRaw {
  return { name: 'search', query: { q: query || undefined, genre: genre || undefined } }
}

/** The address of another page of the list being shown, keeping everything else in the address. */
export function pageLocation(route: HasQuery, page: number): RouteLocationRaw {
  // Page 1 is the default, so it is left out of the URL.
  return { query: { ...route.query, page: page > 1 ? page : undefined } }
}

/** The element id of a genre's row, usable as a URL fragment: "Science-Fiction" becomes "genre-science-fiction". */
export function genreAnchor(genre: string): string {
  return `genre-${genre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}
