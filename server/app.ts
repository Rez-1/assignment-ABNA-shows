import express, { type Express, type NextFunction, type Response, type Router } from 'express'
import type { Catalogue } from './catalogue/catalogue.ts'
import { createCachedLoader } from './http/cache.ts'
import { servePages } from './http/pages.ts'
import { errorHandler, notFound, proxyRateLimit, type RateLimitOptions, readOnly, securityHeaders } from './http/security.ts'
import { parseId, parsePaging, parseRowLimit, parseText } from './http/validation.ts'
import type { TvMazeClient } from './tvmaze/client.ts'

export interface AppOptions {
  catalogue: Catalogue
  tvmaze: Pick<TvMazeClient, 'fetchShowDetails' | 'fetchSeasonEpisodes'>
  production?: boolean
  /** Folder holding the built client. When given, the app serves its pages as well as the API. */
  clientDir?: string
  /** Limit for the routes that call TVMaze, per client. */
  rateLimit?: RateLimitOptions
  /** How long, and how many, TVMaze answers are kept. */
  cache?: { ttlMs: number; maxEntries: number }
}

const HOUR = 60 * 60 * 1000

/** Answers with `body` as JSON, or passes on to the 404 handler when there is nothing to send. */
function sendIfFound(body: unknown, res: Response, next: NextFunction): void {
  if (body) res.json(body)
  else next()
}

type ApiOptions = Required<Pick<AppOptions, 'catalogue' | 'tvmaze' | 'rateLimit' | 'cache'>>

/** The JSON API: catalogue routes answered from memory, and detail routes that ask TVMaze. */
function createApi({ catalogue, tvmaze, rateLimit, cache }: ApiOptions): Router {
  const loadShow = createCachedLoader({ load: tvmaze.fetchShowDetails, ...cache })
  const loadEpisodes = createCachedLoader({ load: tvmaze.fetchSeasonEpisodes, ...cache })
  const limitProxied = proxyRateLimit(rateLimit)

  const api = express.Router()
  api.use(readOnly)

  api.get('/genres', (req, res) => {
    res.json(catalogue.genreRows(parseRowLimit(req.query.limit)))
  })

  api.get('/genres/:genre/shows', (req, res, next) => {
    sendIfFound(catalogue.showsByGenre(parseText(req.params.genre, 'genre'), parsePaging(req.query)), res, next)
  })

  // Registered before /shows/:id so "search" is never read as an id.
  api.get('/shows/search', (req, res) => {
    res.json(
      catalogue.search({
        query: parseText(req.query.q, 'q'),
        genre: parseText(req.query.genre, 'genre') || undefined,
        ...parsePaging(req.query),
      }),
    )
  })

  api.get('/shows/:id', limitProxied, async (req, res, next) => {
    sendIfFound(await loadShow(parseId(req.params.id)), res, next)
  })

  api.get('/seasons/:id/episodes', limitProxied, async (req, res, next) => {
    sendIfFound(await loadEpisodes(parseId(req.params.id)), res, next)
  })

  api.use(notFound)
  api.use(errorHandler)
  return api
}

/**
 * Builds the Express app with the JSON API mounted under /api and, when
 * `clientDir` is given, the built client's pages. It does not listen, and the
 * only files it reads are in that folder, which keeps it easy to test. In
 * development the entry point adds the Vite dev server instead.
 */
export function createApp(options: AppOptions): Express {
  const {
    catalogue,
    tvmaze,
    production = false,
    clientDir,
    rateLimit = { windowMs: 60_000, limit: 60 },
    cache = { ttlMs: HOUR, maxEntries: 500 },
  } = options

  const app = express()
  app.use(securityHeaders({ production }))
  app.use('/api', createApi({ catalogue, tvmaze, rateLimit, cache }))

  if (clientDir) {
    app.use(servePages(clientDir))
    app.use(errorHandler)
  }
  return app
}
