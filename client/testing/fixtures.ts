import type { GenreRow, Page, ShowSummary } from '../../shared/types.ts'

let nextId = 1

/** Builds a show for tests; only the fields a test cares about need to be given. */
export function makeShow(overrides: Partial<ShowSummary> = {}): ShowSummary {
  const id = overrides.id ?? nextId++
  return { id, name: `Show ${id}`, genres: ['Drama'], rating: 7, weight: 50, image: null, year: 2020, ...overrides }
}

export function makeGenreRow(genre: string, shows: ShowSummary[], total = shows.length): GenreRow {
  return { genre, total, shows }
}

export function makePage<T>(items: T[], overrides: Partial<Page<T>> = {}): Page<T> {
  return { items, total: items.length, page: 1, pageSize: 24, pageCount: 1, ...overrides }
}
