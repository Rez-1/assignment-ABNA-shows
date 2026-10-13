import type { ErrorRequestHandler, Request, RequestHandler } from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import type { ApiErrorBody } from '../../shared/types.ts'
import { TvMazeError } from '../tvmaze/client.ts'
import { BadRequestError } from './validation.ts'

const IMAGE_SOURCES = ["'self'", 'data:', 'https://static.tvmaze.com']

/**
 * Security response headers. The content security policy only allows our own
 * scripts and styles plus images from TVMaze, and forbids framing. In
 * development Vite injects styles and talks over a websocket for hot reload, so
 * those two things are additionally allowed there.
 */
export function securityHeaders({ production }: { production: boolean }): RequestHandler {
  return helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: production ? ["'self'"] : ["'self'", "'unsafe-inline'"],
        imgSrc: IMAGE_SOURCES,
        connectSrc: production ? ["'self'"] : ["'self'", 'ws:'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
  })
}

export interface RateLimitOptions {
  windowMs: number
  limit: number
}

/** Caps how often one client can hit the routes that make us call TVMaze. */
export function proxyRateLimit({ windowMs, limit }: RateLimitOptions): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many requests. Try again in a moment.' } satisfies ApiErrorBody,
  })
}

/** Whether a request only reads: GET, or HEAD (a GET without the body). */
export const isRead = (req: Request): boolean => req.method === 'GET' || req.method === 'HEAD'

export const readOnly: RequestHandler = (req, res, next) => {
  if (isRead(req)) return next()
  res.set('Allow', 'GET, HEAD').status(405).json({ message: 'Method not allowed' } satisfies ApiErrorBody)
}

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: 'Not found' } satisfies ApiErrorBody)
}

/**
 * Maps errors to short JSON messages. Details stay in the server log: clients
 * never see stack traces or upstream error text.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) return next(error)

  if (error instanceof BadRequestError) {
    res.status(400).json({ message: error.message } satisfies ApiErrorBody)
  } else if (error instanceof TvMazeError) {
    console.error(`[tvmaze] ${error.message}`)
    res.status(502).json({ message: 'The show database is not responding. Try again shortly.' } satisfies ApiErrorBody)
  } else {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong' } satisfies ApiErrorBody)
  }
}
