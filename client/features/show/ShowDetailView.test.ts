import { afterEach, describe, expect, it } from 'vitest'
import { makeEpisode, makePage, makeShow, makeShowDetails } from '@/testing/fixtures'
import { type FakeRoutes, fakeApi, jsonResponse, renderApp, settle } from '@/testing/renderApp'

afterEach(() => {
  document.body.innerHTML = ''
})

type App = Awaited<ReturnType<typeof renderApp>>['wrapper']

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

  it('lists the cast with the characters they play', async () => {
    showApi(
      makeShowDetails({
        cast: [
          { id: '1-2', name: 'Bryan Cranston', character: 'Walter White', image: 'https://static.tvmaze.com/cranston.jpg' },
          { id: '3-4', name: 'Narrator', character: '', image: null },
        ],
      }),
    )

    const { wrapper } = await renderApp('/shows/169')
    const cast = wrapper.get('section[aria-labelledby="cast-heading"]')
    const members = cast.findAll('li')

    expect(cast.get('h2').text()).toBe('Cast')
    expect(members.map((member) => member.get('[data-test="cast-name"]').text())).toEqual(['Bryan Cranston', 'Narrator'])
    expect(members[0]!.text()).toContain('Walter White')
    expect(members[0]!.get('img').attributes('src')).toBe('https://static.tvmaze.com/cranston.jpg')
    expect(members[1]!.find('[data-test="artwork-placeholder"]').exists()).toBe(true)
  })

  it('leaves out the cast section when no cast is known', async () => {
    showApi(makeShowDetails({ cast: [] }))

    const { wrapper } = await renderApp('/shows/169')

    expect(wrapper.find('section[aria-labelledby="cast-heading"]').exists()).toBe(false)
  })

  describe('seasons and episodes', () => {
    const seasons = [
      { id: 753, number: 1, episodeCount: 7, premiereDate: '2008-01-20', image: 'https://static.tvmaze.com/season1.jpg' },
      { id: 754, number: 2, episodeCount: 1, premiereDate: '2009-03-08', image: null },
    ]
    const seasonButtons = (wrapper: App) => wrapper.findAll('[data-test="season"]')
    const episodeNames = (wrapper: App) => wrapper.findAll('[data-test="episode-name"]').map((name) => name.text())

    it('lists the seasons and opens with the first season’s episodes', async () => {
      showApi(makeShowDetails({ seasons }), {
        '/api/seasons/753/episodes': [
          makeEpisode({ number: 1, name: 'Pilot', airdate: '2008-01-20', image: 'https://static.tvmaze.com/pilot.jpg' }),
          makeEpisode({ number: 2, name: 'Cat’s in the Bag...', airdate: null }),
        ],
      })

      const { wrapper } = await renderApp('/shows/169')

      expect(wrapper.get('#seasons-heading').text()).toBe('2 seasons')
      expect(seasonButtons(wrapper).map((button) => button.text())).toEqual(['Season 12008 · 7 episodes', 'Season 22009 · 1 episode'])
      expect(seasonButtons(wrapper).map((button) => button.attributes('aria-pressed'))).toEqual(['true', 'false'])

      expect(wrapper.get('#episodes-heading').text()).toBe('Season 1 episodes')
      expect(episodeNames(wrapper)).toEqual(['Pilot', 'Cat’s in the Bag...'])
      const [pilot, second] = wrapper.findAll('[data-test="episode"]')
      expect(pilot!.text()).toContain('E1')
      expect(pilot!.text()).toContain('20 Jan 2008')
      expect(pilot!.get('img').attributes('src')).toBe('https://static.tvmaze.com/pilot.jpg')
      expect(second!.text()).toContain('E2')
    })

    it('shows another season’s episodes when you pick it', async () => {
      showApi(makeShowDetails({ seasons }), {
        '/api/seasons/753/episodes': [makeEpisode({ name: 'Pilot' })],
        '/api/seasons/754/episodes': [makeEpisode({ season: 2, name: 'Seven Thirty-Seven' })],
      })
      const { wrapper } = await renderApp('/shows/169')

      await seasonButtons(wrapper)[1]!.trigger('click')
      await settle()

      expect(seasonButtons(wrapper).map((button) => button.attributes('aria-pressed'))).toEqual(['false', 'true'])
      expect(wrapper.get('#episodes-heading').text()).toBe('Season 2 episodes')
      expect(episodeNames(wrapper)).toEqual(['Seven Thirty-Seven'])
    })

    it('shows placeholders while episodes load, then explains a failure with a way to retry', async () => {
      let attempts = 0
      let respond!: (response: unknown) => void
      showApi(makeShowDetails({ seasons }), {
        '/api/seasons/753/episodes': () =>
          ++attempts === 1 ? new Promise((resolve) => (respond = resolve)) : [makeEpisode({ name: 'Pilot' })],
      })
      const { wrapper } = await renderApp('/shows/169')
      const episodes = wrapper.get('section[aria-labelledby="episodes-heading"]')

      expect(episodes.get('[role="status"]').text()).toBe('Loading episodes')
      expect(episodes.findAll('[data-test="skeleton-card"]').length).toBeGreaterThan(0)
      expect(wrapper.get('h1').text()).toBe('Breaking Bad')

      respond(jsonResponse({ message: 'Too many requests. Try again in a moment.' }, 429))
      await settle()
      expect(episodes.get('[role="alert"]').text()).toContain('Too many requests. Try again in a moment.')

      await episodes.get('[role="alert"] button').trigger('click')
      await settle()
      expect(episodeNames(wrapper)).toEqual(['Pilot'])
    })

    it('says when a season has no episodes listed', async () => {
      showApi(makeShowDetails({ seasons }), { '/api/seasons/753/episodes': [] })

      const { wrapper } = await renderApp('/shows/169')

      expect(wrapper.get('section[aria-labelledby="episodes-heading"]').text()).toContain('No episodes are listed for this season')
    })

    it('leaves out both sections when a show has no seasons', async () => {
      showApi(makeShowDetails({ seasons: [] }))

      const { wrapper } = await renderApp('/shows/169')

      expect(wrapper.find('#seasons-heading').exists()).toBe(false)
      expect(wrapper.find('#episodes-heading').exists()).toBe(false)
    })
  })

  describe('related shows', () => {
    const related = (wrapper: App) => wrapper.find('section[aria-labelledby="related-heading"]')

    it('suggests the best of the show’s first genre, leaving out the show itself', async () => {
      showApi(makeShowDetails({ id: 169, genres: ['Drama', 'Crime'] }), {
        '/api/genres/Drama/shows?page=1': makePage([
          makeShow({ id: 169, name: 'Breaking Bad' }),
          makeShow({ name: 'The Wire' }),
          makeShow({ name: 'Chernobyl' }),
        ]),
      })

      const { wrapper } = await renderApp('/shows/169')

      expect(related(wrapper).get('h2').text()).toBe('More in Drama')
      expect(related(wrapper).findAll('[data-test="show-name"]').map((name) => name.text())).toEqual(['The Wire', 'Chernobyl'])
      expect(related(wrapper).get('[data-test="view-all"]').attributes('href')).toBe('/genres/Drama')
    })

    it('is left out when there is nothing to suggest', async () => {
      showApi(makeShowDetails({ id: 169, genres: ['Drama'] }), {
        '/api/genres/Drama/shows?page=1': makePage([makeShow({ id: 169, name: 'Breaking Bad' })]),
      })
      expect(related((await renderApp('/shows/169')).wrapper).exists()).toBe(false)
      document.body.innerHTML = ''

      const fetch = showApi(makeShowDetails({ id: 5, genres: [] }))
      expect(related((await renderApp('/shows/5')).wrapper).exists()).toBe(false)
      expect(fetch.mock.calls.filter(([url]) => String(url).includes('/genres/'))).toHaveLength(0)
    })

    it('is quietly left out when it cannot be loaded, without disturbing the rest of the page', async () => {
      showApi(makeShowDetails(), { '/api/genres/Drama/shows?page=1': jsonResponse({ message: 'Something went wrong' }, 500) })

      const { wrapper } = await renderApp('/shows/169')

      expect(related(wrapper).exists()).toBe(false)
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
      expect(wrapper.get('h1').text()).toBe('Breaking Bad')
    })
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
