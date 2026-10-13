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
})
