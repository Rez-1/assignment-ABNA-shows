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

/** GETs JSON from our own API. */
export async function getJson<T>(path: string, { params }: RequestOptions = {}): Promise<T> {
  const response = await fetch(buildUrl(path, params), { headers: { accept: 'application/json' } })
  return (await response.json()) as T
}
