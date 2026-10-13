import { describe, expect, it } from 'vitest'
import { makeShow } from '../testing/fixtures.ts'
import { createCatalogue } from './catalogue.ts'

const shows = [
  makeShow({ name: 'Lost', genres: ['Drama', 'Adventure'], rating: 8.1 }),
  makeShow({ name: 'Lost Girl', genres: ['Drama', 'Fantasy'], rating: 7.6 }),
  makeShow({ name: 'The Lost Room', genres: ['Science-Fiction'], rating: 8.4 }),
  makeShow({ name: 'Holocaust', genres: ['Drama'], rating: 9.0 }),
  makeShow({ name: 'Pokémon', genres: ['Anime', 'Adventure'], rating: 7.9 }),
  makeShow({ name: 'Unrated Drama', genres: ['Drama'], rating: null }),
  makeShow({ name: 'No Genre', genres: [], rating: 9.9 }),
]
const catalogue = createCatalogue(shows)
const names = (items: { name: string }[]) => items.map((item) => item.name)
const firstPage = { page: 1, pageSize: 10 }

describe('genreRows', () => {
  it('orders genres by size, then name', () => {
    expect(catalogue.genreRows(20).map((row) => [row.genre, row.total])).toEqual([
      ['Drama', 4],
      ['Adventure', 2],
      ['Anime', 1],
      ['Fantasy', 1],
      ['Science-Fiction', 1],
    ])
  })

  it('sorts each row by rating with unrated shows last, and honours the limit', () => {
    const [drama] = catalogue.genreRows(20)
    expect(names(drama!.shows)).toEqual(['Holocaust', 'Lost', 'Lost Girl', 'Unrated Drama'])

    expect(names(catalogue.genreRows(2)[0]!.shows)).toEqual(['Holocaust', 'Lost'])
  })
})

describe('showsByGenre', () => {
  it('pages through a genre', () => {
    const page = catalogue.showsByGenre('Drama', { page: 2, pageSize: 3 })

    expect(page).toMatchObject({ total: 4, page: 2, pageSize: 3, pageCount: 2 })
    expect(names(page!.items)).toEqual(['Unrated Drama'])
  })

  it('finds genres regardless of case', () => {
    expect(catalogue.showsByGenre('science-fiction', firstPage)?.total).toBe(1)
  })

  it('returns null for unknown genres, including object property names', () => {
    expect(catalogue.showsByGenre('Westerns', firstPage)).toBeNull()
    expect(catalogue.showsByGenre('__proto__', firstPage)).toBeNull()
    expect(catalogue.showsByGenre('constructor', firstPage)).toBeNull()
  })

  it('returns an empty page beyond the last one', () => {
    expect(catalogue.showsByGenre('Drama', { page: 9, pageSize: 3 })).toMatchObject({ items: [], total: 4 })
  })
})

describe('search', () => {
  it('ranks exact, then prefix, then word-start, then inner matches', () => {
    const results = catalogue.search({ query: 'lost', ...firstPage })

    expect(names(results.items)).toEqual(['Lost', 'Lost Girl', 'The Lost Room'])
  })

  it('falls back to rating order within the same match quality', () => {
    const tied = createCatalogue([
      makeShow({ name: 'Star Low', rating: 5 }),
      makeShow({ name: 'Star High', rating: 9 }),
    ])

    expect(names(tied.search({ query: 'star', ...firstPage }).items)).toEqual(['Star High', 'Star Low'])
  })

  it('ignores case and accents', () => {
    expect(names(catalogue.search({ query: 'POKEMON', ...firstPage }).items)).toEqual(['Pokémon'])
  })

  it('can be narrowed to a genre', () => {
    const results = catalogue.search({ query: 'lost', genre: 'drama', ...firstPage })

    expect(names(results.items)).toEqual(['Lost', 'Lost Girl'])
  })

  it('returns nothing for a blank query or an unknown genre', () => {
    expect(catalogue.search({ query: '   ', ...firstPage }).total).toBe(0)
    expect(catalogue.search({ query: 'lost', genre: 'Westerns', ...firstPage }).total).toBe(0)
  })

  it('treats regular-expression characters as plain text', () => {
    expect(catalogue.search({ query: '.*', ...firstPage }).total).toBe(0)
  })

  it('pages results', () => {
    const page = catalogue.search({ query: 'lost', page: 2, pageSize: 2 })

    expect(page).toMatchObject({ total: 3, pageCount: 2 })
    expect(names(page.items)).toEqual(['The Lost Room'])
  })
})

it('reports its size and does not reorder the input', () => {
  expect(catalogue.size).toBe(7)
  expect(shows[0]!.name).toBe('Lost')
})
