import { flushPromises } from '@vue/test-utils'
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

  it('tells how many shows a genre has and links to all of them', async () => {
    fakeApi({
      '/api/genres?limit=20': [
        makeGenreRow('Science-Fiction', [makeShow()], 26512),
        makeGenreRow('Western', [makeShow()], 1),
      ],
    })

    const { wrapper } = await renderApp('/')
    const [scienceFiction, western] = wrapper.findAll('[data-test="genre-row"]')

    expect(scienceFiction!.text()).toContain('26,512 shows')
    expect(scienceFiction!.get('[data-test="view-all"]').attributes('href')).toBe('/genres/Science-Fiction')
    expect(scienceFiction!.get('[data-test="view-all"]').attributes('aria-label')).toBe('View all Science-Fiction shows')
    expect(western!.text()).toContain('1 show')
    expect(western!.text()).not.toContain('1 shows')
  })

  it('offers a quick link to every genre row', async () => {
    fakeApi({
      '/api/genres?limit=20': [makeGenreRow('Drama', [makeShow()]), makeGenreRow('Science-Fiction', [makeShow()])],
    })

    const { wrapper } = await renderApp('/')
    const links = wrapper.get('nav[aria-label="Jump to a genre"]').findAll('a')

    expect(texts(links)).toEqual(['Drama', 'Science-Fiction'])
    expect(links.map((link) => link.attributes('href'))).toEqual(['/#genre-drama', '/#genre-science-fiction'])
    expect(wrapper.findAll('[data-test="genre-row"]').map((row) => row.attributes('id'))).toEqual([
      'genre-drama',
      'genre-science-fiction',
    ])
  })

  it('shows placeholders while the genres load', async () => {
    let respond!: (rows: unknown) => void
    fakeApi({ '/api/genres?limit=20': () => new Promise((resolve) => (respond = resolve)) })

    const { wrapper } = await renderApp('/')

    expect(wrapper.get('[role="status"]').text()).toBe('Loading shows')
    expect(wrapper.findAll('[data-test="skeleton-card"]').length).toBeGreaterThan(0)
    expect(wrapper.find('[data-test="genre-row"]').exists()).toBe(false)

    respond([makeGenreRow('Drama', [makeShow()])])
    await flushPromises()

    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="skeleton-card"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-test="genre-row"]')).toHaveLength(1)
  })

  it('shows each poster lazily, with a placeholder when it is missing or fails to load', async () => {
    const poster = 'https://static.tvmaze.com/uploads/images/medium_portrait/1/1.jpg'
    fakeApi({
      '/api/genres?limit=20': [
        makeGenreRow('Drama', [makeShow({ image: poster }), makeShow({ image: null }), makeShow({ image: poster })]),
      ],
    })

    const { wrapper } = await renderApp('/')
    const [withPoster, withoutPoster, broken] = wrapper.findAll('[data-test="show-card"]')

    expect(withPoster!.get('img').attributes()).toMatchObject({ src: poster, alt: '', loading: 'lazy' })
    expect(withPoster!.find('[data-test="artwork-placeholder"]').exists()).toBe(false)
    expect(withoutPoster!.find('img').exists()).toBe(false)
    expect(withoutPoster!.find('[data-test="artwork-placeholder"]').exists()).toBe(true)

    await broken!.get('img').trigger('error')

    expect(broken!.find('img').exists()).toBe(false)
    expect(broken!.find('[data-test="artwork-placeholder"]').exists()).toBe(true)
  })
})
