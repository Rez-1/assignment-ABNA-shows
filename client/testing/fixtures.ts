import type { Episode, GenreRow, Page, ShowDetails, ShowSummary } from '../../shared/types.ts'

import { makeShow } from '../../shared/testing.ts'

export { makeShow }

let nextId = 1

export function makeShowDetails(overrides: Partial<ShowDetails> = {}): ShowDetails {
  return {
    ...makeShow({ id: 169, name: 'Breaking Bad', genres: ['Drama', 'Crime'], rating: 9.2, year: 2008 }),
    summary: ['A chemistry teacher is diagnosed with cancer.', 'He turns to making drugs.'],
    status: 'Ended',
    language: 'English',
    runtime: 60,
    premiered: '2008-01-20',
    ended: '2013-09-29',
    network: 'AMC',
    schedule: 'Sundays at 22:00',
    officialSite: 'http://www.amc.com/shows/breaking-bad',
    poster: 'https://static.tvmaze.com/uploads/images/original_untouched/501/1253519.jpg',
    backdrop: 'https://static.tvmaze.com/uploads/images/original_untouched/219/547904.jpg',
    cast: [],
    seasons: [],
    ...overrides,
  }
}

export function makeEpisode(overrides: Partial<Episode> = {}): Episode {
  const id = overrides.id ?? nextId++
  return {
    id,
    season: 1,
    number: 1,
    name: `Episode ${id}`,
    airdate: '2008-01-20',
    runtime: 60,
    rating: 8,
    image: null,
    summary: '',
    ...overrides,
  }
}

export function makeGenreRow(genre: string, shows: ShowSummary[], total = shows.length): GenreRow {
  return { genre, total, shows }
}

export function makePage<T>(items: T[], overrides: Partial<Page<T>> = {}): Page<T> {
  return { items, total: items.length, page: 1, pageSize: 24, pageCount: 1, ...overrides }
}
