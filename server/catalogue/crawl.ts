import type { ShowSummary } from '../../shared/types.ts'
import { sleep, type TvMazeClient } from '../tvmaze/client.ts'

export interface CrawlOptions {
  client: Pick<TvMazeClient, 'fetchIndexPage'>
  /** Pause between pages; 500 ms keeps us at 2 requests/s, inside TVMaze's 20 per 10 s. */
  delayMs?: number
  sleep?: (ms: number) => Promise<void>
  onPage?: (page: number, total: number) => void
  /** Safety net against an endless loop if the index ever stops answering 404. */
  maxPages?: number
}

/**
 * Walks the TVMaze show index from page 0 until it runs out (signalled by a
 * 404, which the client turns into null) and returns every show found.
 */
export async function crawlShowIndex(options: CrawlOptions): Promise<ShowSummary[]> {
  const {
    client,
    delayMs = 500,
    sleep: pause = sleep,
    onPage,
    maxPages = 5_000,
  } = options
  const shows: ShowSummary[] = []

  for (let page = 0; page < maxPages; page++) {
    const batch = await client.fetchIndexPage(page)
    if (batch === null) return shows
    shows.push(...batch)
    onPage?.(page, shows.length)
    await pause(delayMs)
  }
  throw new Error(`Show index did not end within ${maxPages} pages`)
}
