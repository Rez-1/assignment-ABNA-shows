import { join } from 'node:path'
import express, { type Router } from 'express'

/**
 * Serves the built client from `clientDir`: its files, and the app shell for
 * every page address, because pages are routed in the browser.
 */
export function servePages(clientDir: string): Router {
  const pages = express.Router()

  // Built assets have content hashes in their names, so they can be cached forever.
  pages.use('/assets', express.static(join(clientDir, 'assets'), { immutable: true, maxAge: '1y' }))
  // A missing one is a 404 rather than the shell: an old page must not get HTML for a script.
  pages.use('/assets', (_req, res) => void res.sendStatus(404))
  pages.use(express.static(clientDir))

  // Whether a request is for a page is decided by what it asks for, not by how its
  // path looks: "/shows/1.5" is a page address, and the client shows its own "not found".
  pages.use((req, res, next) => {
    const wantsPage = (req.method === 'GET' || req.method === 'HEAD') && req.headers.accept?.includes('text/html')
    if (!wantsPage) return next()
    res.sendFile('index.html', { root: clientDir })
  })

  return pages
}
