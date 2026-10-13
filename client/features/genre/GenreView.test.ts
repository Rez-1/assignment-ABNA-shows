import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { makePage, makeShow } from '@/testing/fixtures'
import { fakeApi, renderApp } from '@/testing/renderApp'

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
