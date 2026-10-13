import { afterEach, describe, expect, it } from 'vitest'
import { makeGenreRow, makePage, makeShow, makeShowDetails } from '@/testing/fixtures'
import { fakeApi, renderApp, settle } from '@/testing/renderApp'

afterEach(() => {
  document.body.innerHTML = ''
})

const api = () =>
  fakeApi({
    '/api/genres?limit=20': [makeGenreRow('Drama', [makeShow()])],
    '/api/genres/Drama/shows?page=1': makePage([makeShow()]),
    '/api/shows/search?q=lost&page=1': makePage([makeShow()]),
    '/api/shows/169': makeShowDetails(),
  })

describe('the application frame', () => {
  it('says when a page does not exist and links back home', async () => {
    api()

    const { wrapper } = await renderApp('/no/such/page')

    expect(wrapper.get('h1').text()).toBe('Page not found')
    expect(wrapper.get('main a').attributes('href')).toBe('/')
  })

  it('names each page in the browser tab', async () => {
    api()
    const { router } = await renderApp('/')
    const titleAt = async (path: string) => {
      await router.push(path)
      await settle()
      return document.title
    }

    expect(document.title).toBe('Showtime')
    expect(await titleAt('/genres/Drama')).toBe('Drama · Showtime')
    expect(await titleAt('/search?q=lost')).toBe('“lost” · Showtime')
    expect(await titleAt('/shows/169')).toBe('Breaking Bad · Showtime')
    expect(await titleAt('/nowhere')).toBe('Page not found · Showtime')
    expect(await titleAt('/')).toBe('Showtime')
  })

  it('lets keyboard users skip straight to the content', async () => {
    api()

    const { wrapper } = await renderApp('/')
    const skipLink = wrapper.get('a.skip-link')

    expect(skipLink.text()).toBe('Skip to content')
    expect(skipLink.attributes('href')).toBe('#main')
    expect(wrapper.find('main#main').exists()).toBe(true)
    expect(wrapper.element.parentElement!.querySelector('a')).toBe(skipLink.element)
  })

  it('credits TVMaze as the source of the data', async () => {
    api()

    const { wrapper } = await renderApp('/')
    const credit = wrapper.get('footer a')

    expect(wrapper.get('footer').text()).toContain('Show data provided by TVMaze')
    expect(credit.attributes()).toMatchObject({ href: 'https://www.tvmaze.com', rel: 'noopener noreferrer' })
  })

  it('has a logo that leads home and empties the search box on the way', async () => {
    api()
    const { wrapper, router } = await renderApp('/search?q=lost')
    const searchBox = wrapper.get('header input[type="search"]').element as HTMLInputElement
    expect(searchBox.value).toBe('lost')

    await wrapper.get('header a[aria-label="Showtime home"]').trigger('click')
    await settle()

    expect(router.currentRoute.value.fullPath).toBe('/')
    expect(searchBox.value).toBe('')
  })
})
