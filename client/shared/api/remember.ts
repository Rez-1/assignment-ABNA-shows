/**
 * Wraps a fetcher so that each key is asked for once. Callers that arrive while
 * the request is on its way share it, and from then on the answer is returned
 * at once, without a promise. A failure is not kept, so asking again tries again.
 * Answers are kept in `known`, which the caller may supply to hold them itself.
 */
export function remember<Key, Data>(
  fetcher: (key: Key) => Promise<Data>,
  known = new Map<Key, Data>(),
): (key: Key) => Data | Promise<Data> {
  const pending = new Map<Key, Promise<Data>>()

  return (key) => {
    if (known.has(key)) return known.get(key)!

    let request = pending.get(key)
    if (!request) {
      request = fetcher(key)
        .then((data) => {
          known.set(key, data)
          return data
        })
        .finally(() => pending.delete(key))
      pending.set(key, request)
    }
    return request
  }
}
