import type { Episode, ShowDetails, ShowSummary } from '../../shared/types.ts'
import { toEpisode, toShowDetails, toShowSummary } from './mappers.ts'

// The only upstream host this server ever talks to. Callers pass numeric ids, never URLs.
const BASE_URL = 'https://api.tvmaze.com'

export class TvMazeError extends Error {
  readonly status: number | null

  constructor(message: string, status: number | null = null) {
    super(message)
    this.name = 'TvMazeError'
    this.status = status
  }
}

export interface TvMazeClient {
  /** One page of the show index, or null once past the last page. */
  fetchIndexPage(page: number): Promise<ShowSummary[] | null>
  fetchShowDetails(id: number): Promise<ShowDetails | null>
  fetchSeasonEpisodes(seasonId: number): Promise<Episode[] | null>
}

export interface TvMazeClientOptions {
  fetch?: typeof globalThis.fetch
  sleep?: (ms: number) => Promise<void>
  timeoutMs?: number
  /** How often a rate-limited (429) request is retried before giving up. */
  maxRetries?: number
  retryDelayMs?: number
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export function createTvMazeClient(options: TvMazeClientOptions = {}): TvMazeClient {
  const {
    fetch = globalThis.fetch,
    sleep: pause = sleep,
    timeoutMs = 10_000,
    maxRetries = 3,
    retryDelayMs = 2_000,
  } = options

  async function send(path: string): Promise<Response> {
    try {
      return await fetch(`${BASE_URL}${path}`, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch {
      throw new TvMazeError('TVMaze could not be reached')
    }
  }

  /** Sends the request again, after a growing pause, for as long as TVMaze says we are going too fast. */
  async function sendPatiently(path: string): Promise<Response> {
    for (let attempt = 0; ; attempt++) {
      const response = await send(path)
      if (response.status !== 429 || attempt >= maxRetries) return response
      await pause(retryDelayMs * (attempt + 1))
    }
  }

  async function readBody(response: Response): Promise<unknown> {
    try {
      return await response.json()
    } catch {
      throw new TvMazeError('TVMaze sent an unreadable response', response.status)
    }
  }

  /** Resolves to the parsed body, or null for a 404. */
  async function request(path: string): Promise<unknown> {
    const response = await sendPatiently(path)
    if (response.status === 404) return null
    if (!response.ok) throw new TvMazeError(`TVMaze responded with ${response.status}`, response.status)
    return readBody(response)
  }

  function mapList<T>(body: unknown, map: (raw: unknown) => T | null): T[] {
    return Array.isArray(body) ? body.map(map).filter((item) => item !== null) : []
  }

  return {
    async fetchIndexPage(page) {
      const body = await request(`/shows?page=${page}`)
      return body === null ? null : mapList(body, toShowSummary)
    },

    async fetchShowDetails(id) {
      const body = await request(`/shows/${id}?embed[]=cast&embed[]=seasons&embed[]=images`)
      return body === null ? null : toShowDetails(body)
    },

    async fetchSeasonEpisodes(seasonId) {
      const body = await request(`/seasons/${seasonId}/episodes`)
      return body === null ? null : mapList(body, toEpisode)
    },
  }
}
