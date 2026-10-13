# Showtime

A TV show dashboard on top of the [TVMaze API](https://www.tvmaze.com/api): browse shows by genre in horizontal rows sorted by rating, search by name, and open a show for its details, cast, seasons and episodes.

Built with **Vue 3, TypeScript and Vite**, backed by a small **Node/Express** server.

## Running it

| Requirement | Version |
| --- | --- |
| Node.js | **24.14.0** used (see `.nvmrc`); 22.18 or newer works |
| pnpm | **12.11.2**, pinned in `package.json` |

pnpm is used instead of npm. You do not need to install it: Corepack ships with Node and fetches the pinned version.

```bash
corepack enable          # once; makes the `pnpm` command available
pnpm install
pnpm dev                 # http://localhost:3000
```

If you would rather not enable Corepack, prefix the commands instead: `corepack pnpm install`, `corepack pnpm dev`.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Starts the server with the Vue app and hot reload on port 3000 |
| `pnpm build` | Type-checks and builds the client into `dist/` |
| `pnpm start` | Serves the built app and the API (run `pnpm build` first) |
| `pnpm test` | Runs all unit and component tests |
| `pnpm test:coverage` | The same, with a coverage report |
| `pnpm lint` / `pnpm type-check` | ESLint / `vue-tsc` |
| `pnpm seed` | Re-crawls TVMaze and rewrites the bundled catalogue (takes about 3 minutes) |

`PORT` and `HOST` change where the server listens. It binds to `127.0.0.1` by default.

## The problem that shaped the design

The brief asks for shows grouped by genre and sorted by rating, and notes that TVMaze has no endpoint for that. The show index (`/shows?page=N`) is the only source, and it:

- ignores any filter or sort parameter and returns shows in id order;
- holds about 90,000 shows over 380 pages (roughly 40 MB gzipped in total);
- is rate limited to 20 calls per 10 seconds.

"Top rated drama" is therefore only correct for whoever holds the whole index. A browser should not download 40 MB to draw a dashboard, and ranking only the first few pages would be quietly wrong. So the catalogue lives on a server, and the Vue app talks only to that server.

## Architecture

```
shared/types.ts     The contract between server and client
server/             Express API (TypeScript, run directly by Node)
  catalogue/        In-memory index: ranking, genre rows, search, snapshot file, crawler
  tvmaze/           The only code that talks to TVMaze and reads its payloads
  http/             Request validation, caching, security headers, error handling
  data/seed.json.gz The bundled catalogue
client/             Vue app
  app/              Header, not-found page
  features/         dashboard · genre · search · show (view, components, store, API, tests)
  shared/           Reusable components, composables, API wrapper, formatters
  styles/           Design tokens and base styles
```

### Server

- **A slim copy of the index, in memory.** Each show is reduced to what lists need (id, name, genres, rating, popularity, poster, year). All sorting happens once at start-up; every request afterwards is a lookup and a slice. Loading and indexing 90,480 shows takes about 0.3 s, a search about 6 ms.
- **A committed snapshot instead of a start-up crawl.** Crawling the index politely takes about three minutes, which is a poor first impression for someone running the project. The snapshot (2.4 MB gzipped) is committed, so the app starts instantly with complete data. The trade-off is staleness: ratings are as of the last `pnpm seed` (13 October 2026). I chose a manual refresh over a background sync to keep the server small; a scheduled job running the same crawler would be the next step in production.
- **Ranking.** Highest average rating first; ties are broken by TVMaze's popularity `weight`, because the API exposes no vote count and a tie between a well-known and an obscure show should favour the well-known one; unrated shows come last.
- **Search runs on the same catalogue**, so it can be combined with a genre filter and ranked consistently: exact title, then titles starting with the query, then words starting with it, then any match, each group by rating. It ignores case and accents. It is not typo-tolerant.
- **Details are proxied live.** Show details, cast, seasons and episodes come from TVMaze on demand (one call per show), cached for an hour.
- **One process.** In development Express mounts Vite as middleware; after a build it serves `dist/`. One command, one port, no proxy configuration. Node runs the TypeScript directly, so the server has no build step.

API: `GET /api/genres`, `/api/genres/:genre/shows`, `/api/shows/search`, `/api/shows/:id`, `/api/seasons/:id/episodes`.

### Client

- **Vue 3 with `<script setup>` and TypeScript**, as the brief prefers Vue. The project is set up by hand (no `create-vue` template) and uses no UI or utility library: the runtime dependencies are `vue`, `vue-router` and `pinia`.
- **Organised by feature.** Everything a screen needs sits together, and `shared/` holds what more than one feature uses. Features may depend on `shared/`, not the other way round (the header, which hosts the search box, lives in `app/`).
- **The URL is the state for search and paging.** Query, genre filter and page number live in the address, so results can be shared and the back button behaves.
- **Pinia only where state outlives a screen:** the dashboard's genre rows (also the source of the genre filter) and shows already visited, so going back is instant. Everything else is fetched per screen with one composable, `useAsyncResource`, which handles loading and error state and aborts requests that have been superseded, so a slow early response can never overwrite a later one.
- **Reusable pieces:** `HorizontalScroller` (genre rows, seasons, episodes, cast), `ShowRow`, `ShowCard`, `ShowGrid`, `ArtworkImage`, `PageLinks`, `StatusMessage` and the skeleton placeholders.

### Design

- Neutral dark greys with a single yellow accent used for links, focus, active controls and ratings. The detail page layout (backdrop header, rows of seasons, episodes and cast) takes its cues from Plex's web interface.
- **Design tokens in two layers** (`client/styles/tokens.css`): raw values, and semantic tokens such as `--color-surface` or `--radius-card`. Components only use the semantic layer. A test checks the text and background pairs against WCAG AA contrast.
- Responsive without fixed breakpoints where possible: fluid type, card widths and gutters. Rows scroll by swipe, trackpad or keyboard, with paging buttons for mouse users.
- Many shows have no backdrop artwork. The header then uses the poster, blurred, with the sharp poster beside the title.

## Accessibility

The target is WCAG 2.2 AA.

- **Structure:** landmarks, exactly one main heading on every screen (including error and not-found states), labelled sections and lists, and explicit list roles so Safari keeps list semantics on unstyled lists.
- **Keyboard:** a skip link, visible focus on every control, and every scrolling row reachable by keyboard: rows of links through their links, rows of plain content (cast, episodes) through a tab stop of their own.
- **Navigation without page loads:** after moving to another page, focus moves into the new content and a live region announces the page's name. Typing a search or paging leaves focus where it is.
- **Announcements:** loading and error states are announced, and the search page announces the number of results as you type.
- **Text alternatives:** ratings are read as "Rated 9.2 out of 10", episode badges as "Episode 1", decorative artwork is hidden from screen readers, and links that open a new tab say so.
- **Colour:** text and background pairs meet AA contrast, including text over artwork, which sits on a scrim that is tested against pure white images. Links in running text are underlined, so they do not rely on colour.
- **Layout and motion:** no horizontal scrolling down to 320px wide, zoom is not blocked, and animation is switched off for people who prefer reduced motion.

How it was checked: the [axe](https://github.com/dequelabs/axe-core) checker runs against every screen in the test suite, and was also run in a real browser (where it can judge layout and colour) with no violations on any screen. It has not been tested with a screen reader by hand, which automated checks do not replace.

## Security

There are no accounts, cookies or stored user data, so the risks are untrusted TVMaze content, input to the API, and the server's role as a proxy.

- **Untrusted content is never rendered as HTML.** TVMaze summaries are HTML; the server converts them to plain text and the client only interpolates text. ESLint fails the build on `v-html`.
- **Untrusted URLs are filtered on the server:** images must be `https` on TVMaze's image host, and a show's official site must be `http(s)`, so a `javascript:` link can never reach an `href`. External links open with `rel="noopener noreferrer"`.
- **Strict input validation.** Ids must be plain positive integers before they are placed in an upstream URL (the upstream host is a constant), paging is bounded, search text is length-limited and matched as plain text, and genres are looked up in a `Map`.
- **The proxy cannot be used to hammer TVMaze:** responses are cached in a size-capped cache, concurrent requests for the same show share one upstream call, upstream calls time out, and the proxied routes are rate limited per client.
- **Response headers via Helmet,** with a content security policy that allows only our own scripts and styles and images from TVMaze, and forbids framing. Development additionally allows what Vite's hot reload needs.
- The API is read-only, errors are short JSON messages without internals, and the server listens on loopback unless told otherwise.
- **Supply chain:** a committed lockfile, CI installs with `--frozen-lockfile` and runs `pnpm audit`, pnpm does not run dependencies' install scripts, and Dependabot proposes updates.

Posters are loaded directly from TVMaze's image host, so a visitor's IP address reaches TVMaze; no referrer is sent.

## Testing

Tests sit at a small number of agreed boundaries and describe behaviour rather than implementation:

| Boundary | How it is tested |
| --- | --- |
| HTTP API | Real HTTP requests against the Express app, with a fake TVMaze client |
| Catalogue | Ranking, genre rows, paging and search through its public interface |
| TVMaze client | Only `fetch` is faked; mapping and URL/HTML safety are tested through it |
| Snapshot file | Written and read back from a temporary directory |
| Screens | The whole Vue app is mounted with the real router and stores; only `fetch` is faked |
| Interactive components | `HorizontalScroller`, and search and paging through the screens |
| `useAsyncResource` | Loading, errors, reload and "the newest request wins" |
| Design tokens | WCAG AA contrast of the colour pairs, including text over artwork |
| Accessibility | axe on every screen, plus focus, announcements and text alternatives |

The client was written test-first, one behaviour at a time. The server's tests were written after its code; to make up for that, each behaviour on both sides was then broken deliberately once to confirm that a test fails (115 breakages, all caught after closing four gaps this found). Line coverage is 99%.

CI (`.github/workflows/ci.yml`) audits dependencies, lints, type-checks, tests and builds.

## Trade-offs and what I would do next

- **A backend for a frontend assignment** is more than the brief strictly asks for. It is the only way I found to make "sorted by rating" correct for every genre while keeping the browser light, and it keeps the Vue code free of data plumbing.
- **Catalogue freshness** depends on re-running `pnpm seed`; a scheduled refresh is the obvious addition.
- **Ratings without vote counts** mean a little-known show with a few high votes can top a genre. A minimum-popularity threshold would give more recognisable rows, at the cost of a rule the brief did not ask for.
- **Search** could be made typo-tolerant.
- **End-to-end tests** in a real browser would complement the component tests, which cannot check layout.
- Further out: a light theme, a watchlist, and server-side rendering for faster first paint.

## Credits

Show data and images are provided by [TVMaze](https://www.tvmaze.com) under CC BY-SA.
