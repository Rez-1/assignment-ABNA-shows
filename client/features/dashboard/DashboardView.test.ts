import { afterEach, describe, expect, it } from 'vitest'
import { makeGenreRow, makeShow } from '@/testing/fixtures'
import { fakeApi, renderApp } from '@/testing/renderApp'

afterEach(() => {
  document.body.innerHTML = ''
})

const texts = (elements: { text(): string }[]) => elements.map((element) => element.text())

describe('dashboard', () => {
  it('shows a row per genre with its shows, in the order the server ranked them', async () => {
    fakeApi({
      '/api/genres?limit=20': [
        makeGenreRow('Drama', [makeShow({ name: 'Breaking Bad' }), makeShow({ name: 'The Wire' })]),
        makeGenreRow('Comedy', [makeShow({ name: 'Fleabag' })]),
      ],
    })

    const { wrapper } = await renderApp('/')

    const rows = wrapper.findAll('[data-test="genre-row"]')
    expect(texts(rows.map((row) => row.get('h2')))).toEqual(['Drama', 'Comedy'])
    expect(texts(rows[0]!.findAll('[data-test="show-name"]'))).toEqual(['Breaking Bad', 'The Wire'])
    expect(texts(rows[1]!.findAll('[data-test="show-name"]'))).toEqual(['Fleabag'])
  })

  it('links each show to its detail page and shows its rating and year', async () => {
    fakeApi({
      '/api/genres?limit=20': [
        makeGenreRow('Drama', [
          makeShow({ id: 169, name: 'Breaking Bad', rating: 9.2, year: 2008 }),
          makeShow({ id: 7, name: 'Whole Number', rating: 8, year: null }),
          makeShow({ id: 8, name: 'Obscure', rating: null, year: 1999 }),
        ]),
      ],
    })

    const { wrapper } = await renderApp('/')
    const [rated, wholeNumber, unrated] = wrapper.findAll('[data-test="show-card"]')

    expect(rated!.attributes('href')).toBe('/shows/169')
    expect(rated!.text()).toContain('9.2')
    expect(rated!.text()).toContain('2008')
    expect(rated!.get('[data-test="rating"]').attributes('aria-label')).toBe('Rated 9.2 out of 10')
    expect(wholeNumber!.get('[data-test="rating"]').text()).toBe('8.0')
    expect(unrated!.get('[data-test="rating"]').text()).toBe('Not rated')
  })
})
