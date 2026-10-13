import { afterEach, describe, expect, it } from 'vitest'
import { accessibilityViolations } from '@/testing/accessibility'
import { makeEpisode, makeGenreRow, makePage, makeShow, makeShowDetails } from '@/testing/fixtures'
import { fakeApi, jsonResponse, renderApp, settle } from '@/testing/renderApp'

afterEach(() => {
  document.body.innerHTML = ''
})

const poster = 'https://static.tvmaze.com/poster.jpg'

/** A fake server with enough data to fill every part of every screen. */
function fullApi() {
  const shows = [makeShow({ name: 'Lost', image: poster }), makeShow({ name: 'Unrated', rating: null, year: null })]
  return fakeApi({
    '/api/genres?limit=20': [makeGenreRow('Drama', shows, 26512), makeGenreRow('Comedy', shows, 2)],
    '/api/genres/Drama/shows?page=1': makePage(shows, { total: 50, pageCount: 3 }),
    '/api/genres/Drama/shows?page=2': makePage(shows, { page: 2, total: 50, pageCount: 3 }),
    '/api/shows/search?q=lost&page=1': makePage(shows, { total: 50, pageCount: 3 }),
    '/api/shows/search?q=zzzz&page=1': makePage([]),
    '/api/shows/169': makeShowDetails({
      cast: [{ id: '1-2', name: 'Bryan Cranston', character: 'Walter White', image: null }],
      seasons: [
        { id: 753, number: 1, episodeCount: 7, premiereDate: '2008-01-20', image: null },
        { id: 754, number: 2, episodeCount: 13, premiereDate: '2009-03-08', image: null },
      ],
    }),
    '/api/seasons/753/episodes': [makeEpisode({ number: 1, name: 'Pilot' }), makeEpisode({ number: null, name: 'Special' })],
    '/api/shows/500': jsonResponse({ message: 'Something went wrong' }, 500),
  })
}

const screens = [
  ['the dashboard', '/'],
  ['a genre page', '/genres/Drama?page=2'],
  ['an unknown genre', '/genres/Westerns'],
  ['search results', '/search?q=lost'],
  ['a search without matches', '/search?q=zzzz'],
  ['an empty search', '/search'],
  ['a show', '/shows/169'],
  ['a show that does not exist', '/shows/999'],
  ['a show that failed to load', '/shows/500'],
  ['an unknown page', '/no/such/page'],
] as const

describe('accessibility', () => {
  it.each(screens)('%s passes the automated accessibility checks', async (_name, path) => {
    fullApi()
    await renderApp(path)

    expect(await accessibilityViolations()).toEqual([])
  })

  it.each(screens)('%s has exactly one main heading', async (_name, path) => {
    fullApi()
    const { wrapper } = await renderApp(path)

    expect(wrapper.findAll('h1')).toHaveLength(1)
  })

  it('speaks a rating as a sentence rather than as a bare number', async () => {
    fullApi()
    const { wrapper } = await renderApp('/')
    const [rated, unrated] = wrapper.findAll('[data-test="rating"]')

    expect(rated!.attributes()).toMatchObject({ role: 'img', 'aria-label': 'Rated 7.0 out of 10' })
    expect(unrated!.attributes('role')).toBeUndefined()
    expect(unrated!.text()).toBe('Not rated')
  })

  it('warns that external links open in a new tab', async () => {
    fullApi()
    const { wrapper } = await renderApp('/shows/169')

    expect(wrapper.get('[data-test="official-site"]').text()).toBe('Official site (opens in a new tab)')
    expect(wrapper.get('footer a').text()).toBe('TVMaze (opens in a new tab)')
  })

  it('reads episode numbers in full', async () => {
    fullApi()
    const { wrapper } = await renderApp('/shows/169')
    const [pilot, special] = wrapper.findAll('[data-test="episode"]')

    const number = pilot!.get('[data-test="episode-number"]')
    expect(number.get('.visually-hidden').text()).toBe('Episode 1:')
    expect(number.get('[aria-hidden="true"]').text()).toBe('E1')
    expect(special!.find('[data-test="episode-number"]').exists()).toBe(false)
  })

  // Safari drops list semantics from lists styled with `list-style: none` unless the role is explicit.
  it.each(['/', '/genres/Drama', '/search?q=lost', '/shows/169'])('keeps list semantics on the unstyled lists of %s', async (path) => {
    fullApi()
    const { wrapper } = await renderApp(path)
    const lists = wrapper.findAll('ul')

    expect(lists.length).toBeGreaterThan(0)
    for (const list of lists) expect(list.attributes('role')).toBe('list')
  })

  describe('moving between pages', () => {
    it('moves focus to the new page’s content and announces its name', async () => {
      fullApi()
      const { wrapper, router } = await renderApp('/')
      const announcer = wrapper.get('[data-test="route-announcer"]')
      expect(announcer.attributes()).toMatchObject({ 'aria-live': 'polite', 'aria-atomic': 'true' })

      await router.push('/shows/169')
      await settle()

      expect(document.activeElement).toBe(wrapper.get('main').element)
      expect(announcer.text()).toBe('Breaking Bad')

      await router.push('/genres/Drama')
      await settle()
      expect(announcer.text()).toBe('Drama')
    })

    it('leaves focus alone on first load, and while searching or paging within a page', async () => {
      fullApi()
      const { wrapper, router } = await renderApp('/search?q=lost')
      const searchBox = wrapper.get('header input[type="search"]').element as HTMLInputElement
      expect(document.activeElement).toBe(document.body)

      searchBox.focus()
      await router.replace('/search?q=zzzz')
      await settle()
      expect(document.activeElement).toBe(searchBox)
    })
  })

  it('announces how many results a search found, in a live region', async () => {
    fullApi()
    const { wrapper, router } = await renderApp('/search?q=lost')
    const status = wrapper.get('[data-test="search-status"]')

    expect(status.attributes('role')).toBe('status')
    expect(status.text()).toBe('50 results for “lost”')

    await router.replace('/search?q=zzzz')
    await settle()
    expect(status.text()).toBe('0 results for “zzzz”')
  })
})
