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
})
