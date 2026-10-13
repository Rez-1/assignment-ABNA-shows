import express, { type Express } from 'express'
import type { Catalogue } from './catalogue/catalogue.ts'
import { createCachedLoader } from './http/cache.ts'
import { errorHandler, notFound, proxyRateLimit, type RateLimitOptions, readOnly, securityHeaders } from './http/security.ts'
import { parseId, parsePaging, parseRowLimit, parseText } from './http/validation.ts'
import type { TvMazeClient } from './tvmaze/client.ts'

export interface AppOptions {
  catalogue: Catalogue
  tvmaze: Pick<TvMazeClient, 'fetchShowDetails' | 'fetchSeasonEpisodes'>
  production?: boolean
  /** Limit for the routes that call TVMaze, per client. */
  rateLimit?: RateLimitOptions
  /** How long, and how many, TVMaze answers are kept. */
  cache?: { ttlMs: number; maxEntries: number }
}

const HOUR = 60 * 60 * 1000

/**
 * Builds the Express app with the JSON API mounted under /api. It has no side
 * effects (no listening, no file access), which keeps it easy to test; serving
 * the client is added by the entry point.
 */
export function createApp(options: AppOptions): Express {
  const {
    catalogue,
    tvmaze,
    production = false,
    rateLimit = { windowMs: 60_000, limit: 60 },
    cache = { ttlMs: HOUR, maxEntries: 500 },
  } = options

  const loadShow = createCachedLoader({ load: tvmaze.fetchShowDetails, ...cache })
  const loadEpisodes = createCachedLoader({ load: tvmaze.fetchSeasonEpisodes, ...cache })
  const limitProxied = proxyRateLimit(rateLimit)

  const app = express()
  app.use(securityHeaders({ production }))

  const api = express.Router()
  api.use(readOnly)

  api.get('/genres', (req, res) => {
    res.json(catalogue.genreRows(parseRowLimit(req.query.limit)))
  })

  api.get('/genres/:genre/shows', (req, res, next) => {
    const page = catalogue.showsByGenre(parseText(req.params.genre, 'genre'), parsePaging(req.query))
    if (page) res.json(page)
    else next()
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
    const show = await loadShow(parseId(req.params.id))
    if (show) res.json(show)
    else next()
  })

  api.get('/seasons/:id/episodes', limitProxied, async (req, res, next) => {
    const episodes = await loadEpisodes(parseId(req.params.id))
    if (episodes) res.json(episodes)
    else next()
  })

  api.use(notFound)
  api.use(errorHandler)

  app.use('/api', api)
  return app
}
