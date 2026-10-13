import { afterEach, describe, expect, it } from 'vitest'
import { makePage, makeShowDetails } from '@/testing/fixtures'
import { type FakeRoutes, fakeApi, renderApp } from '@/testing/renderApp'

afterEach(() => {
  document.body.innerHTML = ''
})

/** A fake server that knows one show; related shows and episodes default to empty. */
function showApi(details = makeShowDetails(), routes: FakeRoutes = {}) {
  return fakeApi({
    [`/api/shows/${details.id}`]: details,
    [`/api/genres/${details.genres[0]}/shows?page=1`]: makePage([]),
    ...routes,
  })
}

describe('show detail page', () => {
  it('presents the show: title, rating, key facts and the summary as paragraphs', async () => {
    showApi()

    const { wrapper } = await renderApp('/shows/169')

    expect(wrapper.get('h1').text()).toBe('Breaking Bad')
    expect(wrapper.get('[data-test="show-facts"] [data-test="rating"]').text()).toBe('9.2')
    const facts = wrapper.findAll('[data-test="show-facts"] li').map((fact) => fact.text())
    expect(facts).toEqual(['9.2', '2008 – 2013', '60 min', 'Drama, Crime', 'Ended', 'English'])
    expect(wrapper.findAll('[data-test="show-summary"] p').map((paragraph) => paragraph.text())).toEqual([
      'A chemistry teacher is diagnosed with cancer.',
      'He turns to making drugs.',
    ])
    expect(wrapper.get('[data-test="show-airing"]').text()).toBe('AMC · Sundays at 22:00')
  })

  it('links to the official site in a new tab, without handing over the referrer', async () => {
    showApi()

    const { wrapper } = await renderApp('/shows/169')

    expect(wrapper.get('[data-test="official-site"]').attributes()).toMatchObject({
      href: 'http://www.amc.com/shows/breaking-bad',
      target: '_blank',
      rel: 'noopener noreferrer',
    })
  })

  it('fills the header with the show’s backdrop artwork', async () => {
    const details = makeShowDetails()
    showApi(details)

    const { wrapper } = await renderApp('/shows/169')
    const backdrop = wrapper.get('[data-test="backdrop"]')

    expect(backdrop.attributes()).toMatchObject({ src: details.backdrop, alt: '', 'data-source': 'backdrop' })
    expect(wrapper.find('[data-test="hero-poster"]').exists()).toBe(false)
  })

  it('falls back to a blurred poster behind the title, with the sharp poster beside it', async () => {
    const details = makeShowDetails({ backdrop: null })
    showApi(details)

    const { wrapper } = await renderApp('/shows/169')

    expect(wrapper.get('[data-test="backdrop"]').attributes()).toMatchObject({ src: details.poster, 'data-source': 'poster' })
    expect(wrapper.get('[data-test="hero-poster"] img').attributes('src')).toBe(details.poster)
  })

  it('shows a plain header when a show has no artwork at all', async () => {
    showApi(makeShowDetails({ backdrop: null, poster: null, image: null }))

    const { wrapper } = await renderApp('/shows/169')

    expect(wrapper.find('[data-test="backdrop"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="hero-poster"]').exists()).toBe(false)
    expect(wrapper.get('h1').text()).toBe('Breaking Bad')
  })

  it('copes with a show we know little about', async () => {
    showApi(
      makeShowDetails({
        id: 5,
        name: 'Obscure',
        genres: [],
        rating: null,
        summary: [],
        status: 'Running',
        language: null,
        runtime: null,
        premiered: '2019-03-01',
        ended: null,
        network: null,
        schedule: null,
        officialSite: null,
      }),
    )

    const { wrapper } = await renderApp('/shows/5')

    expect(wrapper.findAll('[data-test="show-facts"] li').map((fact) => fact.text())).toEqual([
      'Not rated',
      '2019 – present',
      'Running',
    ])
    expect(wrapper.find('[data-test="show-summary"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="show-airing"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="official-site"]').exists()).toBe(false)
  })
})
