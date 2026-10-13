import { describe, expect, it, vi } from 'vitest'
import { jsonResponse } from '../testing/fixtures.ts'
import { createTvMazeClient, TvMazeError } from './client.ts'

function setup(...responses: Array<Response | Error>) {
  const fetch = vi.fn<typeof globalThis.fetch>()
  for (const response of responses) {
    if (response instanceof Error) fetch.mockRejectedValueOnce(response)
    else fetch.mockResolvedValueOnce(response)
  }
  const sleep = vi.fn(async () => {})
  return { fetch, sleep, client: createTvMazeClient({ fetch, sleep, retryDelayMs: 100 }) }
}

describe('createTvMazeClient', () => {
  it('fetches an index page and skips malformed shows', async () => {
    const { client, fetch } = setup(jsonResponse([{ id: 1, name: 'One' }, { broken: true }]))

    const shows = await client.fetchIndexPage(3)

    expect(fetch).toHaveBeenCalledWith('https://api.tvmaze.com/shows?page=3', expect.any(Object))
    expect(shows).toHaveLength(1)
    expect(shows?.[0]).toMatchObject({ id: 1, name: 'One' })
  })

  it('returns null for a 404, which marks the end of the index', async () => {
    const { client } = setup(jsonResponse({ name: 'Not Found' }, 404))

    expect(await client.fetchIndexPage(999)).toBeNull()
  })

  it('requests details with cast, seasons and images embedded', async () => {
    const { client, fetch } = setup(jsonResponse({ id: 7, name: 'Seven' }))

    const details = await client.fetchShowDetails(7)

    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.tvmaze.com/shows/7?embed[]=cast&embed[]=seasons&embed[]=images')
    expect(details).toMatchObject({ id: 7, cast: [], seasons: [] })
  })

  it('fetches the episodes of a season', async () => {
    const { client, fetch } = setup(jsonResponse([{ id: 1, season: 2, number: 1, name: 'Opener' }]))

    const episodes = await client.fetchSeasonEpisodes(42)

    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.tvmaze.com/seasons/42/episodes')
    expect(episodes).toMatchObject([{ id: 1, season: 2, name: 'Opener' }])
  })

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

  it('wraps server and network failures in TvMazeError', async () => {
    const failing = setup(jsonResponse({}, 500))
    await expect(failing.client.fetchShowDetails(1)).rejects.toBeInstanceOf(TvMazeError)

    const offline = setup(new TypeError('fetch failed'))
    await expect(offline.client.fetchShowDetails(1)).rejects.toMatchObject({ status: null })
  })

  it('passes a timeout signal to every request', async () => {
    const { client, fetch } = setup(jsonResponse([]))

    await client.fetchIndexPage(0)

    expect(fetch.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal)
  })
})
