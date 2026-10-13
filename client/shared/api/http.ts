import type { ApiErrorBody } from '../../../shared/types.ts'

export class ApiError extends Error {
  /** HTTP status, or 0 when the server could not be reached at all. */
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export interface RequestOptions {
  params?: Record<string, string | number | undefined>
}

function buildUrl(path: string, params: RequestOptions['params'] = {}): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value))
  }
  const suffix = query.toString()
  return `/api${path}${suffix ? `?${suffix}` : ''}`
}

/** The server explains its errors as `{ message }`; fall back to a generic line if it did not. */
async function readMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>
    if (typeof body.message === 'string') return body.message
  } catch {
    // Not JSON: use the generic message below.
  }
  return 'Something went wrong'
}

/** GETs JSON from our own API. A failed request throws an ApiError whose message is fit to show. */
export async function getJson<T>(path: string, { params }: RequestOptions = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(buildUrl(path, params), { headers: { accept: 'application/json' } })
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0)
  }
  if (!response.ok) throw new ApiError(await readMessage(response), response.status)
  return (await response.json()) as T
}
