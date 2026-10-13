import { describe, expect, it, vi } from 'vitest'
import { makeShow } from '../testing/fixtures.ts'
import { crawlShowIndex } from './crawl.ts'

function pagedClient(pages: ReturnType<typeof makeShow>[][]) {
  return { fetchIndexPage: vi.fn(async (page: number) => pages[page] ?? null) }
}

describe('crawlShowIndex', () => {
  it('collects every page until the index ends', async () => {
    const pages = [[makeShow(), makeShow()], [], [makeShow()]]
    const client = pagedClient(pages)

    const shows = await crawlShowIndex({ client, sleep: async () => {} })

    expect(shows).toEqual(pages.flat())
    expect(client.fetchIndexPage.mock.calls).toEqual([[0], [1], [2], [3]])
  })

  it('pauses between pages and reports progress', async () => {
    const sleep = vi.fn(async () => {})
    const onPage = vi.fn()

    await crawlShowIndex({ client: pagedClient([[makeShow()], [makeShow()]]), sleep, delayMs: 250, onPage })

    expect(sleep.mock.calls).toEqual([[250], [250]])
    expect(onPage.mock.calls).toEqual([
      [0, 1],
      [1, 2],
    ])
  })

  it('stops with an error rather than looping forever', async () => {
    const endless = { fetchIndexPage: async () => [makeShow()] }

    await expect(crawlShowIndex({ client: endless, sleep: async () => {}, maxPages: 3 })).rejects.toThrow(/3 pages/)
  })

  it('propagates upstream failures', async () => {
    const failing = { fetchIndexPage: async () => Promise.reject(new Error('boom')) }

    await expect(crawlShowIndex({ client: failing, sleep: async () => {} })).rejects.toThrow('boom')
  })
})
