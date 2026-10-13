import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeGenreRow, makePage, makeShow } from '@/testing/fixtures'
import { fakeApi, jsonResponse, renderApp, settle } from '@/testing/renderApp'

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

type App = Awaited<ReturnType<typeof renderApp>>['wrapper']
const names = (wrapper: App) => wrapper.findAll('[data-test="show-name"]').map((name) => name.text())
const searchBox = (wrapper: App) => wrapper.get('header input[type="search"]')

describe('searching by name', () => {
  it('searches as you type, once you pause, and shows the matches in the server’s order', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const fetch = fakeApi({
      '/api/genres?limit=20': [],
      '/api/shows/search?q=lost&page=1': makePage([makeShow({ name: 'Lost' }), makeShow({ name: 'Lost Girl' })]),
    })
    const { wrapper, router } = await renderApp('/')

    await searchBox(wrapper).setValue('lo')
    vi.advanceTimersByTime(200)
    await searchBox(wrapper).setValue('lost')
    vi.advanceTimersByTime(200)
    await settle()
    expect(router.currentRoute.value.name).toBe('dashboard')

    vi.advanceTimersByTime(200)
    await settle()

    expect(router.currentRoute.value.fullPath).toBe('/search?q=lost')
    expect(names(wrapper)).toEqual(['Lost', 'Lost Girl'])
    expect(fetch.mock.calls.some(([url]) => String(url).includes('q=lo&'))).toBe(false)
  })

  it('searches straight away when you press Enter', async () => {
    fakeApi({ '/api/genres?limit=20': [], '/api/shows/search?q=fargo&page=1': makePage([makeShow({ name: 'Fargo' })]) })
    const { wrapper, router } = await renderApp('/')

    await searchBox(wrapper).setValue('  fargo ')
    await wrapper.get('header form[role="search"]').trigger('submit')
    await settle()

    expect(router.currentRoute.value.fullPath).toBe('/search?q=fargo')
    expect(names(wrapper)).toEqual(['Fargo'])
  })

  it('opens a shared search link with the results, the count and the search box filled in', async () => {
    fakeApi({
      '/api/genres?limit=20': [],
      '/api/shows/search?q=lost&page=1': makePage([makeShow({ name: 'Lost' })], { total: 276, pageCount: 12 }),
    })

    const { wrapper } = await renderApp('/search?q=lost')

    expect((searchBox(wrapper).element as HTMLInputElement).value).toBe('lost')
    expect(wrapper.get('h1').text()).toBe('276 results for “lost”')
    expect(names(wrapper)).toEqual(['Lost'])
  })

  it('narrows the results to a genre, starting again from the first page', async () => {
    fakeApi({
      '/api/genres?limit=20': [makeGenreRow('Drama', []), makeGenreRow('Fantasy', [])],
      '/api/shows/search?q=lost&page=3': makePage([makeShow({ name: 'Lost in Space' })], { page: 3, total: 60, pageCount: 3 }),
      '/api/shows/search?q=lost&genre=Fantasy&page=1': makePage([makeShow({ name: 'Lost Girl' })]),
    })
    const { wrapper, router } = await renderApp('/search?q=lost&page=3')
    const genreSelect = wrapper.get('select[aria-label="Genre"]')

    expect(genreSelect.findAll('option').map((option) => option.text())).toEqual(['All genres', 'Drama', 'Fantasy'])

    await genreSelect.setValue('Fantasy')
    await settle()

    expect(router.currentRoute.value.fullPath).toBe('/search?q=lost&genre=Fantasy')
    expect(wrapper.get('h1').text()).toBe('1 result for “lost” in Fantasy')
    expect(names(wrapper)).toEqual(['Lost Girl'])
  })

  it('asks for a name when the search is empty, without asking the server', async () => {
    const fetch = fakeApi({ '/api/genres?limit=20': [] })

    const { wrapper } = await renderApp('/search')

    expect(wrapper.get('h1').text()).toBe('Search shows')
    expect(wrapper.text()).toContain('Type a show’s name in the search box above')
    expect(fetch.mock.calls.filter(([url]) => String(url).includes('/shows/search'))).toHaveLength(0)
  })

  it('says when nothing matches, and offers to search all genres if one was chosen', async () => {
    fakeApi({
      '/api/genres?limit=20': [makeGenreRow('Western', [])],
      '/api/shows/search?q=zzzz&genre=Western&page=1': makePage([]),
    })

    const { wrapper } = await renderApp('/search?q=zzzz&genre=Western')

    expect(wrapper.get('h1').text()).toBe('0 results for “zzzz” in Western')
    expect(wrapper.text()).toContain('No shows match “zzzz” in Western')
    expect(wrapper.get('[data-test="all-genres"]').attributes('href')).toBe('/search?q=zzzz')
  })

  it('pages through the results', async () => {
    fakeApi({
      '/api/genres?limit=20': [],
      '/api/shows/search?q=star&genre=Drama&page=2': makePage([makeShow({ name: 'Star Trek' })], { page: 2, total: 70, pageCount: 3 }),
    })

    const { wrapper } = await renderApp('/search?q=star&genre=Drama&page=2')
    const pages = wrapper.get('nav[aria-label="Pages"]')

    expect(pages.text()).toContain('Page 2 of 3')
    expect(pages.get('a[rel="prev"]').attributes('href')).toBe('/search?q=star&genre=Drama')
    expect(pages.get('a[rel="next"]').attributes('href')).toBe('/search?q=star&genre=Drama&page=3')
  })

  it('shows placeholders while searching, and explains a failure with a way to retry', async () => {
    let attempts = 0
    let respond!: (response: unknown) => void
    fakeApi({
      '/api/genres?limit=20': [],
      '/api/shows/search?q=lost&page=1': () =>
        ++attempts === 1 ? new Promise((resolve) => (respond = resolve)) : makePage([makeShow({ name: 'Lost' })]),
    })

    const { wrapper } = await renderApp('/search?q=lost')
    expect(wrapper.get('h1').text()).toBe('Searching for “lost”')
    expect(wrapper.get('[role="status"]').text()).toBe('Searching')
    expect(wrapper.findAll('[data-test="skeleton-card"]').length).toBeGreaterThan(0)

    respond(jsonResponse({ message: 'q must be at most 100 characters' }, 400))
    await settle()
    expect(wrapper.get('[role="alert"]').text()).toContain('q must be at most 100 characters')

    await wrapper.get('[role="alert"] button').trigger('click')
    await settle()
    expect(names(wrapper)).toEqual(['Lost'])
  })

  it('keeps the chosen genre when the search text changes, and can clear it again', async () => {
    fakeApi({
      '/api/genres?limit=20': [makeGenreRow('Fantasy', [])],
      '/api/shows/search?q=lost&genre=Fantasy&page=1': makePage([makeShow({ name: 'Lost Girl' })]),
      '/api/shows/search?q=girl&genre=Fantasy&page=1': makePage([makeShow({ name: 'Supergirl' })]),
      '/api/shows/search?q=girl&page=1': makePage([makeShow({ name: 'Gossip Girl' })]),
    })
    const { wrapper, router } = await renderApp('/search?q=lost&genre=Fantasy')
    const genreSelect = wrapper.get('select[aria-label="Genre"]')
    expect((genreSelect.element as HTMLSelectElement).value).toBe('Fantasy')

    await searchBox(wrapper).setValue('girl')
    await wrapper.get('header form[role="search"]').trigger('submit')
    await settle()
    expect(router.currentRoute.value.fullPath).toBe('/search?q=girl&genre=Fantasy')
    expect(names(wrapper)).toEqual(['Supergirl'])

    await genreSelect.setValue('')
    await settle()
    expect(router.currentRoute.value.fullPath).toBe('/search?q=girl')
    expect(names(wrapper)).toEqual(['Gossip Girl'])
  })
})
