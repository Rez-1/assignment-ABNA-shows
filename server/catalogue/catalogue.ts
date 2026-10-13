import type { GenreRow, Page, ShowSummary } from '../../shared/types.ts'
import { compareBestFirst, MATCH_RANKS, matchRank, normalise } from './ranking.ts'

export interface Paging {
  page: number
  pageSize: number
}

export interface SearchParams extends Paging {
  query: string
  genre?: string
}

export interface Catalogue {
  readonly size: number
  /** Every genre with its best-rated shows, largest genre first. */
  genreRows(limit: number): GenreRow[]
  /** A page of one genre, best rated first; null when the genre does not exist. */
  showsByGenre(genre: string, paging: Paging): Page<ShowSummary> | null
  /** Shows whose name contains the query, best match first, optionally within one genre. */
  search(params: SearchParams): Page<ShowSummary>
}

interface Genre {
  name: string
  shows: ShowSummary[]
}

function paginate<T>(items: T[], { page, pageSize }: Paging): Page<T> {
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
    pageCount: Math.ceil(items.length / pageSize),
  }
}

/** Groups shows under each of their genres, keeping the order they come in. Keyed by normalised name. */
function groupByGenre(shows: readonly ShowSummary[]): Map<string, Genre> {
  // A Map, not a plain object: genre names come from request URLs.
  const genres = new Map<string, Genre>()
  for (const show of shows) {
    for (const name of show.genres) {
      const key = normalise(name)
      let genre = genres.get(key)
      if (!genre) genres.set(key, (genre = { name, shows: [] }))
      genre.shows.push(show)
    }
  }
  return genres
}

const bySizeThenName = (a: Genre, b: Genre) => b.shows.length - a.shows.length || a.name.localeCompare(b.name)

/**
 * Builds the in-memory index once, up front: all sorting happens here so that
 * every request afterwards is a lookup and a slice.
 */
export function createCatalogue(shows: readonly ShowSummary[]): Catalogue {
  const ranked = [...shows].sort(compareBestFirst)
  const searchNames = ranked.map((show) => normalise(show.name))
  // `ranked` is already sorted, so each genre's list is too.
  const genres = groupByGenre(ranked)
  const genresBySize = [...genres.values()].sort(bySizeThenName)

  /** The shows whose name matches, best match first and, within one quality of match, best rated first. */
  function matching(needle: string, wanted: (show: ShowSummary) => boolean): ShowSummary[] {
    // One bucket per match quality; scanning in ranked order keeps each bucket sorted by rating.
    const buckets = Array.from({ length: MATCH_RANKS }, (): ShowSummary[] => [])
    ranked.forEach((show, index) => {
      const rank = matchRank(searchNames[index] ?? '', needle)
      if (rank !== null && wanted(show)) buckets[rank]?.push(show)
    })
    return buckets.flat()
  }

  return {
    size: ranked.length,

    genreRows(limit) {
      return genresBySize.map(({ name, shows }) => ({ genre: name, total: shows.length, shows: shows.slice(0, limit) }))
    },

    showsByGenre(genre, paging) {
      const found = genres.get(normalise(genre))
      return found ? paginate(found.shows, paging) : null
    },

    search({ query, genre, ...paging }) {
      const needle = normalise(query)
      if (needle === '') return paginate([], paging)
      if (!genre) return paginate(matching(needle, () => true), paging)

      const inGenre = new Set(genres.get(normalise(genre))?.shows)
      return paginate(matching(needle, (show) => inGenre.has(show)), paging)
    },
  }
}
