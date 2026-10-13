import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { createApp } from './app.ts'
import { createCatalogue } from './catalogue/catalogue.ts'
import { readSnapshot } from './catalogue/snapshot.ts'
import { errorHandler } from './http/security.ts'
import { createTvMazeClient } from './tvmaze/client.ts'

const production = process.argv.includes('--production')
const root = fileURLToPath(new URL('..', import.meta.url))
// Loopback by default: the server is only reachable from this machine unless HOST says otherwise.
const host = process.env.HOST ?? '127.0.0.1'
const port = Number(process.env.PORT ?? 3000)

const snapshot = await readSnapshot(new URL('./data/seed.json.gz', import.meta.url))
const catalogue = createCatalogue(snapshot.shows)

const app = createApp({
  catalogue,
  // A visitor is waiting on these calls, so retry a rate-limited request once and quickly.
  tvmaze: createTvMazeClient({ maxRetries: 1, retryDelayMs: 500 }),
  production,
})
const server = createServer(app)

if (production) {
  const dist = join(root, 'dist')
  // Built assets have content hashes in their names, so they can be cached forever.
  app.use('/assets', express.static(join(dist, 'assets'), { immutable: true, maxAge: '1y' }))
  app.use(express.static(dist))
  // Client-side routes: any other page request gets the app shell.
  app.use((req, res, next) => {
    if (req.method !== 'GET' || extname(req.path) !== '') return next()
    res.sendFile(join(dist, 'index.html'))
  })
} else {
  const { createServer: createViteServer } = await import('vite')
  const vite = await createViteServer({
    root,
    appType: 'spa',
    server: { middlewareMode: true, hmr: { server } },
  })
  app.use(vite.middlewares)
}
app.use(errorHandler)

server.listen(port, host, () => {
  const mode = production ? 'production' : 'development'
  console.log(`Showtime (${mode}) on http://${host === '127.0.0.1' ? 'localhost' : host}:${port}`)
  console.log(`Catalogue: ${catalogue.size} shows, snapshot from ${snapshot.createdAt.slice(0, 10)}`)
})
