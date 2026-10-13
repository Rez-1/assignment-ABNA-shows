import { describe, expect, it } from 'vitest'
import { pageLocation, readPage, readSearch, searchLocation } from './locations'

describe('reading a page number from the URL', () => {
  it('reads a positive whole number', () => {
    expect(readPage({ query: { page: '2' } })).toBe(2)
    expect(readPage({ query: { page: '134' } })).toBe(134)
  })

  it.each([null, '', '0', '-1', '1.5', '2.0', '1e3', '0x10', ' 2', 'abc', ['2', '3']])('treats %j as the first page', (page) => {
    expect(readPage({ query: { page } })).toBe(1)
  })

  it('opens the first page when the address names no page', () => {
    expect(readPage({ query: {} })).toBe(1)
  })
})

describe('reading a search from the URL', () => {
  it('reads the text, the genre and the page, trimming stray spaces', () => {
    expect(readSearch({ query: { q: ' lost ', genre: ' Fantasy ', page: '3' } })).toEqual({ query: 'lost', genre: 'Fantasy', page: 3 })
  })

  it('reads an address with nothing in it as an empty search on the first page', () => {
    expect(readSearch({ query: {} })).toEqual({ query: '', genre: undefined, page: 1 })
  })

  it('ignores parameters that are repeated or blank', () => {
    expect(readSearch({ query: { q: ['a', 'b'], genre: ['Drama', 'Crime'] } })).toEqual({ query: '', genre: undefined, page: 1 })
    expect(readSearch({ query: { q: 'lost', genre: '  ' } }).genre).toBeUndefined()
  })
})

describe('the address of a search', () => {
  it('holds the text and the genre, and always starts at the first page', () => {
    expect(searchLocation({ query: 'lost', genre: 'Fantasy' })).toEqual({ name: 'search', query: { q: 'lost', genre: 'Fantasy' } })
  })

  it('leaves out what is empty', () => {
    expect(searchLocation({ query: 'lost' })).toEqual({ name: 'search', query: { q: 'lost' } })
    expect(searchLocation({ query: '', genre: '' })).toEqual({ name: 'search', query: {} })
  })
})

describe('the address of another page of the same list', () => {
  it('changes only the page number', () => {
    expect(pageLocation({ query: { q: 'star', genre: 'Drama', page: '2' } }, 3)).toEqual({
      query: { q: 'star', genre: 'Drama', page: 3 },
    })
  })

  it('leaves the first page out of the address', () => {
    expect(pageLocation({ query: { q: 'star', page: '2' } }, 1)).toEqual({ query: { q: 'star' } })
  })
})
