export interface CachedLoaderOptions<T> {
  load: (key: number) => Promise<T>
  ttlMs: number
  maxEntries: number
  now?: () => number
}

/**
 * Wraps an upstream lookup so that we call TVMaze as little as possible:
 * results are kept for a while, the cache never grows beyond `maxEntries`, and
 * concurrent requests for the same key share a single upstream call.
 * Failures are not cached, so a later request can succeed.
 */
export function createCachedLoader<T>({ load, ttlMs, maxEntries, now = Date.now }: CachedLoaderOptions<T>) {
  const entries = new Map<number, { value: T; expires: number }>()
  const pending = new Map<number, Promise<T>>()

  return async function get(key: number): Promise<T> {
    const cached = entries.get(key)
    if (cached && cached.expires > now()) return cached.value

    const inFlight = pending.get(key)
    if (inFlight) return inFlight

    const request = load(key)
      .then((value) => {
        entries.delete(key)
        entries.set(key, { value, expires: now() + ttlMs })
        // Maps iterate in insertion order, so the first key is the oldest entry.
        if (entries.size > maxEntries) entries.delete(entries.keys().next().value!)
        return value
      })
      .finally(() => pending.delete(key))
    pending.set(key, request)
    return request
  }
}
