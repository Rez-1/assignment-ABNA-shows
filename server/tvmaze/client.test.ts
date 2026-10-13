import { describe, expect, it, vi } from 'vitest'
import { jsonResponse } from '../testing/fixtures.ts'
import { createTvMazeClient, TvMazeError } from './client.ts'

/** A client whose only fake is `fetch`: everything else, mapping included, is the real thing. */
function setup(...responses: Array<Response | Error>) {
  const fetch = vi.fn<typeof globalThis.fetch>()
  for (const response of responses) {
    if (response instanceof Error) fetch.mockRejectedValueOnce(response)
    else fetch.mockResolvedValueOnce(response)
  }
  const sleep = vi.fn(async () => {})
  return { fetch, sleep, client: createTvMazeClient({ fetch, sleep, retryDelayMs: 100 }) }
}

// Shaped like a real TVMaze show payload.
const rawShow = {
  id: 169,
  name: 'Breaking Bad',
  genres: ['Drama', 'Crime', 'Thriller'],
  status: 'Ended',
  language: 'English',
  runtime: 60,
  premiered: '2008-01-20',
  ended: '2013-09-29',
  officialSite: 'http://www.amc.com/shows/breaking-bad',
  schedule: { time: '22:00', days: ['Sunday'] },
  rating: { average: 9.2 },
  weight: 99,
  network: { name: 'AMC' },
  webChannel: null,
  image: {
    medium: 'https://static.tvmaze.com/uploads/images/medium_portrait/501/1253519.jpg',
    original: 'https://static.tvmaze.com/uploads/images/original_untouched/501/1253519.jpg',
  },
  summary: '<p><b>Breaking Bad</b> follows Walter White.</p><p>He teaches chemistry &amp; cooks.</p>',
}

describe('the show index', () => {
  it('returns a page of shows reduced to the fields lists need', async () => {
    const { client, fetch } = setup(jsonResponse([rawShow]))

    const shows = await client.fetchIndexPage(3)

    expect(fetch).toHaveBeenCalledWith('https://api.tvmaze.com/shows?page=3', expect.any(Object))
    expect(shows).toEqual([
      {
        id: 169,
        name: 'Breaking Bad',
        genres: ['Drama', 'Crime', 'Thriller'],
        rating: 9.2,
        weight: 99,
        image: 'https://static.tvmaze.com/uploads/images/medium_portrait/501/1253519.jpg',
        year: 2008,
      },
    ])
  })

  it('copes with shows that have almost no data', async () => {
    const { client } = setup(jsonResponse([{ id: 5, name: 'Bare', rating: { average: null }, image: null }]))

    expect(await client.fetchIndexPage(0)).toEqual([
      { id: 5, name: 'Bare', genres: [], rating: null, weight: 0, image: null, year: null },
    ])
  })

  it('skips records without a usable id and name instead of failing the page', async () => {
    const { client } = setup(jsonResponse([{ id: 1, name: 'Kept' }, { broken: true }, { id: -4, name: 'Bad id' }, 'text', null]))

    expect((await client.fetchIndexPage(0))?.map((show) => show.name)).toEqual(['Kept'])
  })

  it.each([
    'http://static.tvmaze.com/poster.jpg',
    'https://evil.example/poster.jpg',
    'javascript:alert(1)',
    'not a url',
  ])('drops the poster when its URL is %s', async (medium) => {
    const { client } = setup(jsonResponse([{ id: 1, name: 'Show', image: { medium } }]))

    expect((await client.fetchIndexPage(0))?.[0]?.image).toBeNull()
  })

  it('reports the end of the index, which TVMaze signals with a 404', async () => {
    const { client } = setup(jsonResponse({ name: 'Not Found' }, 404))

    expect(await client.fetchIndexPage(999)).toBeNull()
  })
})

describe('show details', () => {
  const embedded = {
    cast: [
      {
        person: { id: 1, name: 'Bryan Cranston', image: { medium: 'https://static.tvmaze.com/person.jpg' } },
        character: { id: 2, name: 'Walter White' },
      },
      { person: {}, character: { name: 'Nobody' } },
    ],
    seasons: [{ id: 753, number: 1, episodeOrder: 7, premiereDate: '2008-01-20', image: null }],
    images: [
      { type: 'poster', resolutions: { original: { url: 'https://static.tvmaze.com/poster.jpg' } } },
      { type: 'background', resolutions: { original: { url: 'https://static.tvmaze.com/background.jpg' } } },
    ],
  }

  it('asks TVMaze for the show with cast, seasons and images in one call', async () => {
    const { client, fetch } = setup(jsonResponse(rawShow))

    await client.fetchShowDetails(169)

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.tvmaze.com/shows/169?embed[]=cast&embed[]=seasons&embed[]=images')
  })

  it('returns facts, cast, seasons and backdrop', async () => {
    const { client } = setup(jsonResponse({ ...rawShow, _embedded: embedded }))

    expect(await client.fetchShowDetails(169)).toMatchObject({
      id: 169,
      name: 'Breaking Bad',
      status: 'Ended',
      language: 'English',
      runtime: 60,
      premiered: '2008-01-20',
      ended: '2013-09-29',
      network: 'AMC',
      schedule: 'Sundays at 22:00',
      officialSite: 'http://www.amc.com/shows/breaking-bad',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/501/1253519.jpg',
      backdrop: 'https://static.tvmaze.com/background.jpg',
      cast: [{ id: '1-2', name: 'Bryan Cranston', character: 'Walter White', image: 'https://static.tvmaze.com/person.jpg' }],
      seasons: [{ id: 753, number: 1, episodeCount: 7, premiereDate: '2008-01-20', image: null }],
    })
  })

  it('turns the HTML summary into plain-text paragraphs', async () => {
    const { client } = setup(jsonResponse(rawShow))

    expect((await client.fetchShowDetails(169))?.summary).toEqual([
      'Breaking Bad follows Walter White.',
      'He teaches chemistry & cooks.',
    ])
  })

  it('leaves no markup in a summary that carries a script payload', async () => {
    const summary = '<p>Hi<script>alert(1)</script><img src=x onerror=alert(1)> &lt;b&gt;there&#33;</p>'
    const { client } = setup(jsonResponse({ ...rawShow, summary }))

    expect((await client.fetchShowDetails(169))?.summary).toEqual(['Hialert(1) <b>there!'])
  })

  it.each(['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'ftp://example.com/file', '/relative'])(
    'drops an official site of %s',
    async (officialSite) => {
      const { client } = setup(jsonResponse({ ...rawShow, officialSite }))

      expect((await client.fetchShowDetails(169))?.officialSite).toBeNull()
    },
  )

  it('falls back to the web channel, and to empty lists when nothing is embedded', async () => {
    const { client } = setup(jsonResponse({ ...rawShow, network: null, webChannel: { name: 'Netflix' }, schedule: { time: '', days: [] } }))

    expect(await client.fetchShowDetails(169)).toMatchObject({
      network: 'Netflix',
      schedule: null,
      backdrop: null,
      cast: [],
      seasons: [],
    })
  })

  it('returns null for a show TVMaze does not know', async () => {
    const { client } = setup(jsonResponse({}, 404))

    expect(await client.fetchShowDetails(1)).toBeNull()
  })
})

describe('season episodes', () => {
  it('returns the episodes of a season with plain-text summaries', async () => {
    const { client, fetch } = setup(
      jsonResponse([
        {
          id: 1,
          season: 1,
          number: 1,
          name: 'Pilot',
          airdate: '2013-06-24',
          runtime: 60,
          rating: { average: 7 },
          image: { medium: 'https://static.tvmaze.com/episode.jpg' },
          summary: '<p>It <i>begins</i>.</p>',
        },
        { name: 'No id' },
      ]),
    )

    const episodes = await client.fetchSeasonEpisodes(42)

    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.tvmaze.com/seasons/42/episodes')
    expect(episodes).toEqual([
      {
        id: 1,
        season: 1,
        number: 1,
        name: 'Pilot',
        airdate: '2013-06-24',
        runtime: 60,
        rating: 7,
        image: 'https://static.tvmaze.com/episode.jpg',
        summary: 'It begins.',
      },
    ])
  })
})

describe('when TVMaze misbehaves', () => {
  it('backs off and retries when rate limited', async () => {
    const { client, fetch, sleep } = setup(jsonResponse({}, 429), jsonResponse({}, 429), jsonResponse([]))

    expect(await client.fetchIndexPage(0)).toEqual([])
    expect(fetch).toHaveBeenCalledTimes(3)
    expect(sleep.mock.calls).toEqual([[100], [200]])
  })

  it('gives up after the configured number of retries', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => jsonResponse({}, 429))
    const client = createTvMazeClient({ fetch, sleep: async () => {}, maxRetries: 2 })

    await expect(client.fetchIndexPage(0)).rejects.toMatchObject({ name: 'TvMazeError', status: 429 })
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('reports server errors and network failures as TvMazeError', async () => {
    const failing = setup(jsonResponse({}, 500))
    await expect(failing.client.fetchShowDetails(1)).rejects.toBeInstanceOf(TvMazeError)

    const offline = setup(new TypeError('fetch failed'))
    await expect(offline.client.fetchShowDetails(1)).rejects.toMatchObject({ name: 'TvMazeError', status: null })
  })

  it('reports an unreadable body as TvMazeError', async () => {
    const { client } = setup(new Response('<html>oops</html>', { status: 200 }))

    await expect(client.fetchIndexPage(0)).rejects.toBeInstanceOf(TvMazeError)
  })

  it('puts a timeout on every request', async () => {
    const { client, fetch } = setup(jsonResponse([]))

    await client.fetchIndexPage(0)

    expect(fetch.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal)
  })
})
