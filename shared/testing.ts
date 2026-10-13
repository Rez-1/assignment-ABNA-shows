import type { ShowSummary } from './types.ts'

let nextId = 1

/** Builds a show for tests; only the fields a test cares about need to be given. */
export function makeShow(overrides: Partial<ShowSummary> = {}): ShowSummary {
  const id = overrides.id ?? nextId++
  return { id, name: `Show ${id}`, genres: ['Drama'], rating: 7, weight: 50, image: null, year: 2020, ...overrides }
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}
