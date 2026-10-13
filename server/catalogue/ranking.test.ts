import { describe, expect, it } from 'vitest'
import { makeShow } from '../testing/fixtures.ts'
import { compareByRating, matchRank, normalise } from './ranking.ts'

describe('compareByRating', () => {
  const names = (shows: ReturnType<typeof makeShow>[]) => shows.sort(compareByRating).map((show) => show.name)

  it('puts higher ratings first', () => {
    expect(names([makeShow({ name: 'Low', rating: 6.1 }), makeShow({ name: 'High', rating: 9.3 })])).toEqual(['High', 'Low'])
  })

  it('puts unrated shows last, even behind a zero rating', () => {
    expect(
      names([makeShow({ name: 'Unrated', rating: null }), makeShow({ name: 'Zero', rating: 0 }), makeShow({ name: 'Rated', rating: 5 })]),
    ).toEqual(['Rated', 'Zero', 'Unrated'])
  })

  it('breaks rating ties by popularity weight, then by name', () => {
    expect(
      names([
        makeShow({ name: 'Obscure', rating: 8, weight: 10 }),
        makeShow({ name: 'Beta', rating: 8, weight: 90 }),
        makeShow({ name: 'Alpha', rating: 8, weight: 90 }),
      ]),
    ).toEqual(['Alpha', 'Beta', 'Obscure'])
  })
})

describe('normalise', () => {
  it('ignores case, accents and surrounding space', () => {
    expect(normalise('  Pokémon ')).toBe('pokemon')
    expect(normalise('ÉLITE')).toBe('elite')
  })
})

describe('matchRank', () => {
  it('ranks exact, prefix, word-start and inner matches in that order', () => {
    expect(matchRank('lost', 'lost')).toBe(0)
    expect(matchRank('lost girl', 'lost')).toBe(1)
    expect(matchRank('the lost room', 'lost')).toBe(2)
    expect(matchRank('holocaust', 'cau')).toBe(3)
  })

  it('returns null when the name does not contain the query', () => {
    expect(matchRank('fargo', 'lost')).toBeNull()
  })
})
