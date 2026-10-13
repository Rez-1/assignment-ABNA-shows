/**
 * Rebuilds server/data/seed.json.gz from the live TVMaze show index.
 * Takes a few minutes: roughly 380 requests at a polite 2 per second.
 *
 *   pnpm seed
 */
import { fileURLToPath } from 'node:url'
import { crawlShowIndex } from '../catalogue/crawl.ts'
import { writeSnapshot } from '../catalogue/snapshot.ts'
import { createTvMazeClient } from '../tvmaze/client.ts'

const target = fileURLToPath(new URL('../data/seed.json.gz', import.meta.url))

const shows = await crawlShowIndex({
  client: createTvMazeClient(),
  onPage: (page, total) => {
    if (page % 20 === 0) console.log(`page ${page}: ${total} shows so far`)
  },
})

await writeSnapshot(target, { createdAt: new Date().toISOString(), shows })
console.log(`Wrote ${shows.length} shows to ${target}`)
