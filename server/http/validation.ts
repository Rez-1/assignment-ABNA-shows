import { GENRE_ROW_SIZE, ID_PATTERN, MAX_TEXT_LENGTH } from '../../shared/limits.ts'
import type { Paging } from '../catalogue/catalogue.ts'

/** Thrown for request input we refuse; the error handler turns it into a 400. */
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BadRequestError'
  }
}

export const LIMITS = {
  defaultPageSize: 24,
  maxPageSize: 60,
  maxPage: 10_000,
  defaultRowLimit: GENRE_ROW_SIZE,
  maxRowLimit: 40,
  maxTextLength: MAX_TEXT_LENGTH,
} as const

/**
 * Ids are the only request input that ends up in an upstream URL, so they must
 * be plain positive integers: no signs, decimals, exponents or stray characters.
 */
export function parseId(value: unknown): number {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    throw new BadRequestError('Id must be a positive whole number')
  }
  return Number(value)
}

function parsePositiveInteger(value: unknown, name: string, fallback: number): number {
  if (value === undefined) return fallback
  if (typeof value !== 'string' || !/^\d{1,6}$/.test(value) || Number(value) < 1) {
    throw new BadRequestError(`${name} must be a positive whole number`)
  }
  return Number(value)
}

export function parsePaging(query: Record<string, unknown>): Paging {
  const page = parsePositiveInteger(query.page, 'page', 1)
  if (page > LIMITS.maxPage) throw new BadRequestError(`page must not exceed ${LIMITS.maxPage}`)
  // Oversized page sizes are capped rather than rejected: the caller still gets a useful answer.
  const pageSize = Math.min(parsePositiveInteger(query.pageSize, 'pageSize', LIMITS.defaultPageSize), LIMITS.maxPageSize)
  return { page, pageSize }
}

export function parseRowLimit(value: unknown): number {
  return Math.min(parsePositiveInteger(value, 'limit', LIMITS.defaultRowLimit), LIMITS.maxRowLimit)
}

/** Accepts a single, reasonably short string; repeated or nested query parameters are refused. */
export function parseText(value: unknown, name: string): string {
  if (value === undefined) return ''
  if (typeof value !== 'string') throw new BadRequestError(`${name} must be a single value`)
  const text = value.trim()
  if (text.length > LIMITS.maxTextLength) {
    throw new BadRequestError(`${name} must be at most ${LIMITS.maxTextLength} characters`)
  }
  return text
}
