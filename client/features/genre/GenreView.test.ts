import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { makePage, makeShow } from '@/testing/fixtures'
import { fakeApi, jsonResponse, renderApp } from '@/testing/renderApp'

afterEach(() => {
  document.body.innerHTML = ''
})

const names = (wrapper: Awaited<ReturnType<typeof renderApp>>['wrapper']) =>
  wrapper.findAll('[data-test="show-name"]').map((name) => name.text())

describe('genre page', () => {
  it('lists the genre’s shows in the order the server ranked them, with the total', async () => {
    fakeApi({
      '/api/genres/Science-Fiction/shows?page=1': makePage(
        [makeShow({ name: 'Firefly' }), makeShow({ name: 'The Expanse' })],
        { total: 3210, pageCount: 134 },
      ),
    })

    const { wrapper } = await renderApp('/genres/Science-Fiction')

    expect(wrapper.get('h1').text()).toBe('Science-Fiction')
    expect(wrapper.text()).toContain('3,210 shows, best rated first')
    expect(names(wrapper)).toEqual(['Firefly', 'The Expanse'])
  })

  it('never shows the previous genre’s total under a genre that is still loading', async () => {
    let respond!: (page: unknown) => void
    fakeApi({
      '/api/genres/Drama/shows?page=1': makePage([makeShow({ name: 'Lost' })], { total: 3210, pageCount: 134 }),
      '/api/genres/Comedy/shows?page=1': () => new Promise((resolve) => (respond = resolve)),
    })
    const { wrapper, router } = await renderApp('/genres/Drama')
    expect(wrapper.text()).toContain('3,210 shows')

    await router.push('/genres/Comedy')
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('Comedy')
    expect(wrapper.text()).not.toContain('3,210 shows')

    respond(makePage([makeShow({ name: 'Scrubs' })], { total: 12 }))
    await flushPromises()
    expect(wrapper.text()).toContain('12 shows')
  })

  it('shows placeholders while a page loads, and abandons the request if you leave', async () => {
    let respond!: (page: unknown) => void
    const fetch = fakeApi({ '/api/genres/Drama/shows?page=1': () => new Promise((resolve) => (respond = resolve)) })

    const { wrapper, router } = await renderApp('/genres/Drama')

    expect(wrapper.get('h1').text()).toBe('Drama')
    expect(wrapper.get('[role="status"]').text()).toBe('Loading Drama shows')
    expect(wrapper.findAll('[data-test="skeleton-card"]').length).toBeGreaterThan(0)

    respond(makePage([makeShow({ name: 'Lost' })]))
    await flushPromises()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(names(wrapper)).toEqual(['Lost'])

    const signal = fetch.mock.calls[0]![1]!.signal!
    expect(signal.aborted).toBe(false)
    await router.push('/')
    expect(signal.aborted).toBe(true)
  })

  it('says when a genre does not exist and points back to the dashboard', async () => {
    fakeApi({})

    const { wrapper } = await renderApp('/genres/Westerns')

    expect(wrapper.text()).toContain('There is no genre called “Westerns”')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('[data-test="back-to-genres"]').attributes('href')).toBe('/')
  })

  it('explains a failure and recovers on "Try again"', async () => {
    let attempts = 0
    fakeApi({
      '/api/genres/Drama/shows?page=1': () =>
        ++attempts === 1 ? jsonResponse({ message: 'Something went wrong' }, 500) : makePage([makeShow({ name: 'Lost' })]),
    })

    const { wrapper } = await renderApp('/genres/Drama')
    expect(wrapper.get('[role="alert"]').text()).toContain('Something went wrong')

    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(names(wrapper)).toEqual(['Lost'])
  })

  it('says when a page has no shows', async () => {
    fakeApi({ '/api/genres/Drama/shows?page=9': makePage([], { page: 9, total: 30, pageCount: 2 }) })

    const { wrapper } = await renderApp('/genres/Drama?page=9')

    expect(wrapper.text()).toContain('There are no shows on this page')
    expect(wrapper.get('[data-test="first-page"]').attributes('href')).toBe('/genres/Drama')
  })

  it('pages through the genre, keeping the page in the URL', async () => {
    fakeApi({
      '/api/genres/Drama/shows?page=2': makePage([makeShow({ name: 'On page two' })], { page: 2, total: 50, pageCount: 3 }),
      '/api/genres/Drama/shows?page=3': makePage([makeShow({ name: 'On page three' })], { page: 3, total: 50, pageCount: 3 }),
    })

    const { wrapper, router } = await renderApp('/genres/Drama?page=2')
    const pages = () => wrapper.get('nav[aria-label="Pages"]')

    expect(names(wrapper)).toEqual(['On page two'])
    expect(pages().text()).toContain('Page 2 of 3')
    expect(pages().get('a[rel="prev"]').attributes('href')).toBe('/genres/Drama')

    await pages().get('a[rel="next"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/genres/Drama?page=3')
    expect(names(wrapper)).toEqual(['On page three'])
    expect(pages().find('a[rel="next"]').exists()).toBe(false)
    expect(pages().get('a[rel="prev"]').attributes('href')).toBe('/genres/Drama?page=2')
  })
})
