import { onScopeDispose, ref, type Ref, type ShallowRef, shallowRef, watch, type WatchSource } from 'vue'
import { ApiError } from '@/shared/api/http'

/**
 * - `idle`: the source is null, so there is nothing to ask for
 * - `missing`: the server does not know what was asked for (a 404)
 * - `error`: any other failure; `reload` tries again
 */
export type AsyncStatus = 'idle' | 'loading' | 'missing' | 'error' | 'success'

export interface AsyncResourceOptions {
  /** What a null source means. Defaults to `idle`; use `missing` when null stands for an address that names nothing. */
  nullSource?: 'idle' | 'missing'
}

export interface AsyncResource<Data> {
  /** Set only while `status` is `success`: it never holds the answer to an earlier source. */
  data: ShallowRef<Data | null>
  error: ShallowRef<Error | null>
  status: Ref<AsyncStatus>
  /** Runs the latest request again, for "Try again" buttons. */
  reload: () => void
}

/**
 * Loads data whenever `source` changes and exposes it with loading and error
 * state. A newer request always wins: the previous one is aborted and its
 * outcome ignored, so a slow early response can never overwrite a later one.
 * While `source` is null nothing is requested.
 */
export function useAsyncResource<Source, Data>(
  source: WatchSource<Source>,
  fetcher: (value: NonNullable<Source>, signal: AbortSignal) => Promise<Data>,
  { nullSource = 'idle' }: AsyncResourceOptions = {},
): AsyncResource<Data> {
  const data = shallowRef<Data | null>(null)
  const error = shallowRef<Error | null>(null)
  const status = ref<AsyncStatus>('loading')

  let controller: AbortController | undefined
  let latest: Source

  async function run(value: Source) {
    controller?.abort()
    const current = (controller = new AbortController())
    latest = value
    data.value = null
    error.value = null

    if (value === null || value === undefined) {
      status.value = nullSource
      return
    }
    status.value = 'loading'

    try {
      const result = await fetcher(value, current.signal)
      if (current.signal.aborted) return
      data.value = result
      status.value = 'success'
    } catch (cause) {
      if (current.signal.aborted) return
      error.value = cause instanceof Error ? cause : new Error(String(cause))
      status.value = cause instanceof ApiError && cause.status === 404 ? 'missing' : 'error'
    }
  }

  watch(source, run, { immediate: true })
  onScopeDispose(() => controller?.abort())

  return { data, error, status, reload: () => void run(latest) }
}
