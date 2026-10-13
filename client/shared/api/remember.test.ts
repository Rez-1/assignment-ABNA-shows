import { describe, expect, it, vi } from 'vitest'
import { remember } from './remember'

describe('remember', () => {
  it('asks once per key and answers at once, without a promise, from then on', async () => {
    const fetcher = vi.fn(async (id: number) => `show ${id}`)
    const load = remember(fetcher)

    expect(await load(1)).toBe('show 1')
    expect(load(1)).toBe('show 1')
    expect(await load(2)).toBe('show 2')

    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('shares one request between callers that ask while it is still on its way', async () => {
    let answer!: (value: string) => void
    const fetcher = vi.fn(() => new Promise<string>((resolve) => (answer = resolve)))
    const load = remember(fetcher)

    const first = load('genres')
    const second = load('genres')
    answer('rows')

    expect(await first).toBe('rows')
    expect(await second).toBe('rows')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('does not keep a failure, so asking again tries again', async () => {
    const fetcher = vi
      .fn<(id: number) => Promise<string>>()
      .mockRejectedValueOnce(new Error('The show database is not responding.'))
      .mockResolvedValueOnce('show 7')
    const load = remember(fetcher)

    await expect(load(7)).rejects.toThrow('The show database is not responding.')
    expect(await load(7)).toBe('show 7')
  })
})
