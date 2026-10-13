import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Episode, ShowDetails } from '../shared/types.ts'
import { type AppOptions, createApp } from './app.ts'
import { createCatalogue } from './catalogue/catalogue.ts'
import { makeShow } from './testing/fixtures.ts'
import { TvMazeError } from './tvmaze/client.ts'

const catalogue = createCatalogue([
  makeShow({ id: 1, name: 'Lost', genres: ['Drama'], rating: 8.1 }),
  makeShow({ id: 2, name: 'Lost Girl', genres: ['Drama', 'Fantasy'], rating: 7.6 }),
  makeShow({ id: 3, name: 'Fargo', genres: ['Crime'], rating: 8.7 }),
])

const details: ShowDetails = {
  ...makeShow({ id: 1, name: 'Lost' }),
  summary: ['Plane crash.'],
  status: 'Ended',
  language: 'English',
  runtime: 60,
  premiered: '2004-09-22',
  ended: '2010-05-23',
  network: 'ABC',
  schedule: null,
  officialSite: null,
  poster: null,
  backdrop: null,
  cast: [],
  seasons: [],
}

const episode: Episode = {
  id: 100,
  season: 1,
  number: 1,
  name: 'Pilot',
  airdate: '2004-09-22',
  runtime: 60,
  rating: 8.5,
  image: null,
  summary: '',
}

let server: Server | undefined

beforeEach(() => {
  // The error handler logs what it hides from clients; keep test output quiet.
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  server?.close()
  server = undefined
})

/** Starts the app on a free port and returns a fetch bound to it. */
async function start(overrides: Partial<AppOptions> = {}) {
  const tvmaze = {
    fetchShowDetails: vi.fn(async (id: number) => (id === 1 ? details : null)),
    fetchSeasonEpisodes: vi.fn(async (id: number) => (id === 10 ? [episode] : null)),
  }
  const app = createApp({ catalogue, tvmaze, production: true, ...overrides })
  server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server!.once('listening', resolve))
  const { port } = server.address() as AddressInfo
  const request = (path: string, init?: RequestInit) => fetch(`http://127.0.0.1:${port}${path}`, init)
  return { request, tvmaze }
}

describe('catalogue routes', () => {
  it('lists genre rows, largest first', async () => {
    const { request } = await start()

    const response = await request('/api/genres?limit=1')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject([
      { genre: 'Drama', total: 2, shows: [{ name: 'Lost' }] },
      { genre: 'Crime', total: 1 },
      { genre: 'Fantasy', total: 1 },
    ])
  })

  it('pages a genre and answers 404 for an unknown one', async () => {
    const { request } = await start()

    const page = await (await request('/api/genres/drama/shows?page=2&pageSize=1')).json()
    expect(page).toMatchObject({ total: 2, page: 2, pageCount: 2, items: [{ name: 'Lost Girl' }] })

    const missing = await request('/api/genres/__proto__/shows')
    expect(missing.status).toBe(404)
    expect(await missing.json()).toEqual({ message: 'Not found' })
  })

  it('searches by name with an optional genre', async () => {
    const { request } = await start()

    const all = await (await request('/api/shows/search?q=lost')).json()
    expect(all.items.map((show: { name: string }) => show.name)).toEqual(['Lost', 'Lost Girl'])

    const fantasy = await (await request('/api/shows/search?q=lost&genre=Fantasy')).json()
    expect(fantasy.items).toMatchObject([{ name: 'Lost Girl' }])
  })

  it('caps an oversized page size', async () => {
    const { request } = await start()

    const page = await (await request('/api/shows/search?q=lost&pageSize=100000')).json()

    expect(page.pageSize).toBe(60)
  })
})

describe('proxied routes', () => {
  it('returns show details and caches them', async () => {
    const { request, tvmaze } = await start()

    expect(await (await request('/api/shows/1')).json()).toMatchObject({ name: 'Lost', summary: ['Plane crash.'] })
    await request('/api/shows/1')

    expect(tvmaze.fetchShowDetails).toHaveBeenCalledTimes(1)
  })

  it('shares one TVMaze call between requests that arrive together', async () => {
    const fetchShowDetails = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
      return details
    })
    const { request } = await start({ tvmaze: { fetchShowDetails, fetchSeasonEpisodes: async () => null } })

    const responses = await Promise.all([request('/api/shows/1'), request('/api/shows/1'), request('/api/shows/1')])

    expect(responses.map((response) => response.status)).toEqual([200, 200, 200])
    expect(fetchShowDetails).toHaveBeenCalledTimes(1)
  })

  it('remembers that a show does not exist', async () => {
    const { request, tvmaze } = await start()

    await request('/api/shows/999')
    await request('/api/shows/999')

    expect(tvmaze.fetchShowDetails).toHaveBeenCalledTimes(1)
  })

  it('asks TVMaze again once a cached answer has expired', async () => {
    const { request, tvmaze } = await start({ cache: { ttlMs: 0, maxEntries: 10 } })

    await request('/api/shows/1')
    await request('/api/shows/1')

    expect(tvmaze.fetchShowDetails).toHaveBeenCalledTimes(2)
  })

  it('forgets the oldest answer when the cache is full', async () => {
    const { request, tvmaze } = await start({ cache: { ttlMs: 60_000, maxEntries: 1 } })

    await request('/api/shows/1')
    await request('/api/shows/2')
    await request('/api/shows/1')

    expect(tvmaze.fetchShowDetails.mock.calls.map(([id]) => id)).toEqual([1, 2, 1])
  })

  it('does not cache a failure', async () => {
    const fetchShowDetails = vi.fn(async () => details).mockRejectedValueOnce(new TvMazeError('down', 503))
    const { request } = await start({ tvmaze: { fetchShowDetails, fetchSeasonEpisodes: async () => null } })

    expect((await request('/api/shows/1')).status).toBe(502)
    expect((await request('/api/shows/1')).status).toBe(200)
  })

  it('returns season episodes', async () => {
    const { request } = await start()

    expect(await (await request('/api/seasons/10/episodes')).json()).toMatchObject([{ name: 'Pilot' }])
  })

  it('answers 404 when TVMaze does not know the id', async () => {
    const { request } = await start()

    expect((await request('/api/shows/999')).status).toBe(404)
    expect((await request('/api/seasons/999/episodes')).status).toBe(404)
  })

  it.each(['/api/shows/abc', '/api/shows/1.5', '/api/shows/-1', '/api/shows/1%2F..%2F2', '/api/seasons/0/episodes'])(
    'rejects %s without calling TVMaze',
    async (path) => {
      const { request, tvmaze } = await start()

      const response = await request(path)

      expect(response.status).toBe(400)
      expect(tvmaze.fetchShowDetails).not.toHaveBeenCalled()
      expect(tvmaze.fetchSeasonEpisodes).not.toHaveBeenCalled()
    },
  )

  it('answers 502 with a generic message when TVMaze fails', async () => {
    const { request } = await start({
      tvmaze: {
        fetchShowDetails: async () => Promise.reject(new TvMazeError('TVMaze responded with 500 at secret-host', 500)),
        fetchSeasonEpisodes: async () => null,
      },
    })

    const response = await request('/api/shows/1')

    expect(response.status).toBe(502)
    expect(JSON.stringify(await response.json())).not.toContain('secret-host')
  })

  it('rate limits proxied routes but not catalogue routes', async () => {
    const { request } = await start({ rateLimit: { windowMs: 60_000, limit: 2 } })

    const statuses = []
    for (let attempt = 0; attempt < 3; attempt++) statuses.push((await request('/api/shows/1')).status)

    expect(statuses).toEqual([200, 200, 429])
    expect((await request('/api/genres')).status).toBe(200)
  })
})

describe('hardening', () => {
  it.each([
    '/api/shows/search?q=a&page=0',
    '/api/shows/search?q=a&page=-2',
    '/api/shows/search?q=a&page=two',
    '/api/shows/search?q=a&page=1&page=2',
    '/api/shows/search?q=a&page=10001',
    '/api/shows/search?q=a&pageSize=0',
    '/api/shows/search?q=a&q=b',
    `/api/shows/search?q=${'x'.repeat(101)}`,
    '/api/genres/drama/shows?page=1.5',
    '/api/genres?limit=0',
  ])('rejects %s with a 400 and a message', async (path) => {
    const { request } = await start()

    const response = await request(path)

    expect(response.status).toBe(400)
    expect((await response.json()).message).toEqual(expect.any(String))
  })

  it('uses sensible defaults and trims the search text', async () => {
    const { request } = await start()

    const page = await (await request('/api/shows/search?q=%20lost%20')).json()

    expect(page).toMatchObject({ page: 1, pageSize: 24, total: 2 })
  })

  it('caps how many shows a genre row can hold', async () => {
    const drama = Array.from({ length: 45 }, () => makeShow({ genres: ['Drama'] }))
    const { request } = await start({ catalogue: createCatalogue(drama) })

    const [row] = await (await request('/api/genres?limit=999')).json()
    const [defaultRow] = await (await request('/api/genres')).json()

    expect(row.shows).toHaveLength(40)
    expect(defaultRow.shows).toHaveLength(20)
  })

  it('only allows read requests', async () => {
    const { request } = await start()

    const response = await request('/api/genres', { method: 'POST' })

    expect(response.status).toBe(405)
    expect(response.headers.get('allow')).toBe('GET, HEAD')
  })

  it('answers unknown API paths with JSON, not HTML', async () => {
    const { request } = await start()

    const response = await request('/api/nope')

    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('hides internal errors', async () => {
    const { request } = await start({
      tvmaze: {
        fetchShowDetails: async () => Promise.reject(new Error('database password is hunter2')),
        fetchSeasonEpisodes: async () => null,
      },
    })

    const response = await request('/api/shows/1')

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ message: 'Something went wrong' })
  })

  it('sends security headers and does not advertise Express', async () => {
    const { request } = await start()

    const { headers } = await request('/api/genres')
    const csp = headers.get('content-security-policy') ?? ''

    expect(headers.get('x-powered-by')).toBeNull()
    expect(headers.get('x-content-type-options')).toBe('nosniff')
    expect(headers.get('referrer-policy')).toBe('no-referrer')
    expect(headers.get('access-control-allow-origin')).toBeNull()
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("script-src 'self'")
    expect(csp).toContain("style-src 'self'")
    expect(csp).not.toContain('unsafe-inline')
    expect(csp).toContain("img-src 'self' data: https://static.tvmaze.com")
    expect(csp).toContain("frame-ancestors 'none'")
  })

  it('relaxes the policy for the dev server only', async () => {
    const { request } = await start({ production: false })

    const csp = (await request('/api/genres')).headers.get('content-security-policy') ?? ''

    expect(csp).toContain("style-src 'self' 'unsafe-inline'")
    expect(csp).toContain("script-src 'self'")
  })
})

describe('serving the client', () => {
  const shell = '<!doctype html><title>Showtime</title>'
  const page = { headers: { accept: 'text/html,application/xhtml+xml,*/*;q=0.8' } }
  let clientDir: string

  beforeEach(async () => {
    clientDir = await mkdtemp(join(tmpdir(), 'client-'))
    await mkdir(join(clientDir, 'assets'))
    await writeFile(join(clientDir, 'index.html'), shell)
    await writeFile(join(clientDir, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>')
    await writeFile(join(clientDir, 'assets', 'index-abc123.js'), 'console.log("app")')
  })

  afterEach(async () => {
    await rm(clientDir, { recursive: true, force: true })
  })

  it.each(['/', '/genres/Drama', '/search?q=lost', '/shows/169', '/shows/1.5', '/genres/Sci.Fi', '/nowhere'])(
    'answers a page request for %s with the app shell, so the client can route it',
    async (path) => {
      const { request } = await start({ clientDir })

      const response = await request(path, page)

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/html')
      expect(await response.text()).toBe(shell)
    },
  )

  it('serves built assets as cacheable forever, and the shell as always revalidated', async () => {
    const { request } = await start({ clientDir })

    const asset = await request('/assets/index-abc123.js')
    expect(await asset.text()).toBe('console.log("app")')
    expect(asset.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')

    expect((await request('/', page)).headers.get('cache-control')).toBe('public, max-age=0')
    expect((await request('/shows/169', page)).headers.get('cache-control')).toBe('public, max-age=0')
  })

  it('serves other files from the client folder', async () => {
    const { request } = await start({ clientDir })

    const response = await request('/favicon.svg')

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('image/svg+xml')
  })

  it('answers 404, not the shell, for a missing asset or a request that is not for a page', async () => {
    const { request } = await start({ clientDir })

    expect((await request('/assets/index-old999.js', page)).status).toBe(404)
    expect((await request('/missing.png', { headers: { accept: 'image/avif,image/webp,*/*' } })).status).toBe(404)
    expect((await request('/shows/169', { method: 'POST', ...page })).status).toBe(404)
  })

  it('keeps answering unknown API paths with JSON, never the shell', async () => {
    const { request } = await start({ clientDir })

    const response = await request('/api/nowhere', page)

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ message: 'Not found' })
  })

  it('sends the security headers with pages too', async () => {
    const { request } = await start({ clientDir })

    const { headers } = await request('/shows/169', page)

    expect(headers.get('content-security-policy')).toContain("frame-ancestors 'none'")
    expect(headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('serves no pages when it is given no client folder', async () => {
    const { request } = await start()

    expect((await request('/', page)).status).toBe(404)
  })
})
