import { inject, type InjectionKey, type Plugin } from 'vue'

type Loader<Key, Data> = (key: Key) => Data | Promise<Data>

/**
 * Wraps a fetcher so that each key is asked for once. Callers that arrive while
 * the request is on its way share it, and from then on the answer is returned
 * at once, without a promise. A failure is not kept, so asking again tries again.
 */
export function remember<Key, Data>(fetcher: (key: Key) => Promise<Data>): Loader<Key, Data> {
  const known = new Map<Key, Data>()
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

/** The remembered loaders of one running app, by the fetcher each one wraps. */
type Memory = Map<unknown, unknown>

const memoryKey: InjectionKey<Memory> = Symbol('memory')

/**
 * Gives the app a memory of its own for `useRemembered`. It lasts as long as
 * the app does, so answers outlive the screens that asked for them, and two
 * apps (such as two tests) never see each other's answers.
 */
export function createMemory(): Plugin {
  return { install: (app) => void app.provide(memoryKey, new Map()) }
}

/**
 * The app's remembered version of `fetcher`: every screen that asks for it
 * gets the same one, so what one screen loaded is there for the next.
 */
export function useRemembered<Key, Data>(fetcher: (key: Key) => Promise<Data>): Loader<Key, Data> {
  const memory = inject(memoryKey)
  if (!memory) throw new Error('useRemembered needs createMemory() to be installed on the app')

  if (!memory.has(fetcher)) memory.set(fetcher, remember(fetcher))
  return memory.get(fetcher) as Loader<Key, Data>
}
