import { onScopeDispose, ref, shallowRef, watch, type WatchSource } from 'vue'

export type AsyncStatus = 'loading' | 'success' | 'error'

/**
 * Loads data whenever `source` changes and exposes it with loading and error
 * state. A newer request always wins: the previous one is aborted and its
 * outcome ignored, so a slow early response can never overwrite a later one.
 */
export function useAsyncResource<Source, Data>(
  source: WatchSource<Source>,
  fetcher: (value: Source, signal: AbortSignal) => Promise<Data>,
) {
  const data = shallowRef<Data | null>(null)
  const error = shallowRef<Error | null>(null)
  const status = ref<AsyncStatus>('loading')

  let controller: AbortController | undefined
  let latest: Source

  async function run(value: Source) {
    controller?.abort()
    const current = (controller = new AbortController())
    latest = value
    status.value = 'loading'
    error.value = null

    try {
      const result = await fetcher(value, current.signal)
      if (current.signal.aborted) return
      data.value = result
      status.value = 'success'
    } catch (cause) {
      if (current.signal.aborted) return
      data.value = null
      error.value = cause instanceof Error ? cause : new Error(String(cause))
      status.value = 'error'
    }
  }

  watch(source, run, { immediate: true })
  onScopeDispose(() => controller?.abort())

  return {
    data,
    error,
    status,
    /** Runs the latest request again, for "Try again" buttons. */
    reload: () => run(latest),
  }
}
