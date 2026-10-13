import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeGenreRow, makePage, makeShow } from '@/testing/fixtures'
import { fakeApi, renderApp, settle } from '@/testing/renderApp'

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
