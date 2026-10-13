import { flushPromises } from '@vue/test-utils'
import { effectScope, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/api/http'
import { type AsyncResourceOptions, useAsyncResource } from './useAsyncResource'

/** Runs the composable in its own scope, as a component would. */
function setup<Source, Data>(
  source: () => Source,
  fetcher: (value: NonNullable<Source>, signal: AbortSignal) => Promise<Data>,
  options?: AsyncResourceOptions,
) {
  const scope = effectScope()
  const resource = scope.run(() => useAsyncResource(source, fetcher, options))!
  return { ...resource, stop: () => scope.stop() }
}

describe('useAsyncResource', () => {
  it('loads data for its source and again whenever the source changes', async () => {
    const id = ref(1)
    const { data, status } = setup(
      () => id.value,
      async (value) => `show ${value}`,
    )

    expect(status.value).toBe('loading')
    expect(data.value).toBeNull()

    await flushPromises()
    expect(status.value).toBe('success')
    expect(data.value).toBe('show 1')

    id.value = 2
    await flushPromises()
    expect(data.value).toBe('show 2')
  })

  it('lets the newest request win when an older one answers late, and aborts the older one', async () => {
    const query = ref('lo')
    const answers = new Map<string, (value: string) => void>()
    const signals = new Map<string, AbortSignal>()
    const { data, status } = setup(
      () => query.value,
      (value, signal) => {
        signals.set(value, signal)
        return new Promise<string>((resolve) => answers.set(value, resolve))
      },
    )

    query.value = 'lost'
    await flushPromises()
    expect(signals.get('lo')!.aborted).toBe(true)
    expect(signals.get('lost')!.aborted).toBe(false)

    answers.get('lost')!('results for lost')
    await flushPromises()
    answers.get('lo')!('results for lo')
    await flushPromises()

    expect(data.value).toBe('results for lost')
    expect(status.value).toBe('success')
  })

  it('aborts the request in flight when its owner goes away', async () => {
    let signal!: AbortSignal
    const { stop } = setup(
      () => 1,
      (_value, requestSignal) => {
        signal = requestSignal
        return new Promise<string>(() => {})
      },
    )

    stop()

    expect(signal.aborted).toBe(true)
  })

  it('exposes a failure and recovers when reloaded', async () => {
    const fetcher = vi
      .fn<(id: number) => Promise<string>>()
      .mockRejectedValueOnce(new Error('The show database is not responding.'))
      .mockResolvedValueOnce('show 7')
    const { data, error, status, reload } = setup(() => 7, fetcher)

    await flushPromises()
    expect(status.value).toBe('error')
    expect(error.value?.message).toBe('The show database is not responding.')
    expect(data.value).toBeNull()

    reload()
    expect(status.value).toBe('loading')
    await flushPromises()

    expect(status.value).toBe('success')
    expect(error.value).toBeNull()
    expect(data.value).toBe('show 7')
    expect(fetcher).toHaveBeenLastCalledWith(7, expect.any(AbortSignal))
  })

  it('does not report the failure of a request that was superseded', async () => {
    const query = ref('a')
    let failFirst!: (reason: Error) => void
    const { error, status } = setup(
      () => query.value,
      (value) => (value === 'a' ? new Promise<string>((_resolve, reject) => (failFirst = reject)) : Promise.resolve('b')),
    )

    query.value = 'b'
    await flushPromises()
    failFirst(new DOMException('Aborted', 'AbortError'))
    await flushPromises()

    expect(status.value).toBe('success')
    expect(error.value).toBeNull()
  })

  it('drops the previous data as soon as the source changes, so it is never shown beside the new source', async () => {
    const query = ref('lost')
    let answer!: (value: string) => void
    const { data, status } = setup(
      () => query.value,
      (value) => (value === 'lost' ? Promise.resolve('results for lost') : new Promise<string>((resolve) => (answer = resolve))),
    )
    await flushPromises()
    expect(data.value).toBe('results for lost')

    query.value = 'fargo'
    await flushPromises()
    expect(status.value).toBe('loading')
    expect(data.value).toBeNull()

    answer('results for fargo')
    await flushPromises()
    expect(data.value).toBe('results for fargo')
  })

  it('stays idle without asking while the source is null, and loads once there is something to ask for', async () => {
    const query = ref<string | null>(null)
    const fetcher = vi.fn(async (value: string) => `results for ${value}`)
    const { data, status } = setup(() => query.value, fetcher)

    await flushPromises()
    expect(status.value).toBe('idle')
    expect(fetcher).not.toHaveBeenCalled()

    query.value = 'lost'
    await flushPromises()
    expect(status.value).toBe('success')
    expect(data.value).toBe('results for lost')

    query.value = null
    await flushPromises()
    expect(status.value).toBe('idle')
    expect(data.value).toBeNull()
  })

  it('reports a 404 from the server as missing, apart from other failures', async () => {
    const { error, status } = setup(
      () => 7,
      () => Promise.reject(new ApiError('Not found', 404)),
    )

    await flushPromises()

    expect(status.value).toBe('missing')
    expect(error.value?.message).toBe('Not found')
  })

  it('can treat a null source as missing, for an address that cannot name anything', async () => {
    const fetcher = vi.fn(async (id: number) => `show ${id}`)
    const { status } = setup(() => null as number | null, fetcher, { nullSource: 'missing' })

    await flushPromises()

    expect(status.value).toBe('missing')
    expect(fetcher).not.toHaveBeenCalled()
  })
})
