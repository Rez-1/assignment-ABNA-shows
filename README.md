# Showtime

A TV show dashboard on top of the [TVMaze API](https://www.tvmaze.com/api): browse shows by genre in horizontal rows sorted by rating, search by name, and open a show for its details, cast, seasons and episodes.

Built with **Vue 3, TypeScript and Vite**, backed by a small **Node/Express** server.

## Running it

| Requirement | Version |
| --- | --- |
| Node.js | **24** (see `.nvmrc`; developed on 24.14.0); 22.18 or newer works |
| npm | **11.9.0** (comes with Node 24) |
| pnpm | **12.11.2**, pinned in `package.json`; optional, see below |

The project is developed with pnpm, whose lockfile is committed, so `pnpm install` gives you exactly the tested dependency versions:

```bash
npm install --global pnpm@12   # once, if you do not have pnpm
pnpm install
pnpm dev                       # http://localhost:3000
```

Plain npm works too. It resolves the dependencies afresh within the ranges in `package.json` rather than from the lockfile; I checked that a clean copy installs, passes the tests, builds and runs this way:

```bash
npm install
npm run dev                    # http://localhost:3000
```

The commands below are written for pnpm; with npm, use `npm run <name>` (and `npm test`).

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

## Why these choices

- **Vue 3.** The brief says ABN AMRO uses Vue, and Vue 3's Composition API with `<script setup>` suits this app: each screen's data loading lives in one composable (`useAsyncResource`) shared by every screen, rather than repeated in lifecycle hooks. Single-file components keep each component's template, logic and scoped styles together.
- **TypeScript throughout.** The server and the client share one set of types (`shared/types.ts`), so a change to the API's shape is a compile error on both sides rather than a bug at runtime.
- **Vite.** Fast development with hot reload and an optimised production build, with almost no configuration (`vite.config.ts` also configures the tests). Vitest uses the same configuration, so tests compile code exactly as the app does.
- **vue-router, and nothing else at runtime.** The URL holds the state worth sharing (search, genre filter, page), so the router does most of the state management. A store library such as Pinia was in an earlier version and taken out: only two things outlive a screen, and a small helper handles both (see Client below). No UI or CSS library either: the brief asks to see my own work, and the components and design tokens are small enough to own.
- **Node and Express on the server.** TVMaze cannot sort or filter by genre, so something has to hold the whole catalogue (next section). Express is the most familiar choice for a reviewer and needs only a few routes; Node 24 runs the server's TypeScript directly, so there is no build step on that side.
- **Vitest and Vue Test Utils** for tests, because they share Vite's configuration and run the real components in a simulated browser.

## The problem that shaped the design

The brief asks for shows grouped by genre and sorted by rating, and notes that TVMaze has no endpoint for that. The show index (`/shows?page=N`) is the only source, and it:

- ignores any filter or sort parameter and returns shows in id order;
- holds about 90,000 shows over 380 pages (roughly 40 MB gzipped in total);
- is rate limited to 20 calls per 10 seconds.

"Top rated drama" is therefore only correct for whoever holds the whole index. A browser should not download 40 MB to draw a dashboard, and ranking only the first few pages would be quietly wrong. So the catalogue lives on a server, and the Vue app talks only to that server.

## Architecture

```
shared/types.ts     The contract between server and client
shared/limits.ts    Limits both sides agree on: id format, row size, longest text
shared/testing.ts   Test fixtures used by both sides
server/             Express API (TypeScript, run directly by Node)
  catalogue/        In-memory index: ranking, genre rows, search, snapshot file, crawler
  tvmaze/           The only code that talks to TVMaze and reads its payloads
  http/             Request validation, caching, security headers, error handling, serving the built client
  data/seed.json.gz The bundled catalogue
client/             Vue app
  app/              Header, not-found page
  features/         dashboard · genre · search · show (view, components, API, tests)
  shared/           Reusable components, composables, API wrapper and app memory, URL and display helpers
  styles/           Design tokens and base styles
```

### Server

- **A slim copy of the index, in memory.** Each show is reduced to what lists need (id, name, genres, rating, popularity, poster, year). All sorting happens once at start-up; every request afterwards is a lookup and a slice. Loading and indexing 90,480 shows takes about a quarter of a second, a search 4 to 6 ms.
- **A committed snapshot instead of a start-up crawl.** Crawling the index politely takes about three minutes, which is a poor first impression for someone running the project. The snapshot (2.4 MB gzipped) is committed, so the app starts instantly with complete data. The trade-off is staleness: ratings are as of the last `pnpm seed` (13 October 2026). I chose a manual refresh over a background sync to keep the server small; a scheduled job running the same crawler would be the next step in production.
- **Ranking.** Highest average rating first; ties are broken by TVMaze's popularity `weight`, because the API exposes no vote count and a tie between a well-known and an obscure show should favour the well-known one; unrated shows come last.
- **One genre is kept off the dashboard.** TVMaze lists an "Adult" genre (262 shows). It is left out of the dashboard's rows, quick links and the search filter, because of what its posters show. Its shows can still be found by name, and its genre page still works for anyone who asks for it.
- **Search runs on the same catalogue**, so it can be combined with a genre filter and ranked consistently: exact title, then titles starting with the query, then words starting with it, then any match, each group by rating. It ignores case and accents. It is not typo-tolerant.
- **Details are proxied live.** Show details, cast, seasons and episodes come from TVMaze on demand (one call per show), cached for an hour.
- **One process.** In development Express mounts Vite as middleware; after a build it serves `dist/`. One command, one port, no proxy configuration. Node runs the TypeScript directly, so the server has no build step.

API: `GET /api/genres`, `/api/genres/:genre/shows`, `/api/shows/search`, `/api/shows/:id`, `/api/seasons/:id/episodes`.

### Client

- **Vue 3 with `<script setup>` and TypeScript**, as the brief prefers Vue. The project is set up by hand (no `create-vue` template) and uses no UI or utility library: the runtime dependencies are `vue` and `vue-router`.
- **Organised by feature.** Everything a screen needs sits together, and `shared/` holds what more than one feature uses. Features may depend on `shared/`, not the other way round (the header, which hosts the search box, lives in `app/`). Two features borrow from another: search uses the dashboard's genre rows for its genre filter, and the show page uses the genre API for "More in this genre".
- **The URL is the state for search and paging.** Query, genre filter and page number live in the address, so results can be shared and the back button behaves. One module, `shared/utils/locations`, reads and writes those parameters; a search address takes no page number, so changing the text or the genre always starts again from the first page.
- **One way to load data.** Every screen fetches what it needs with one composable, `useAsyncResource`, which tells apart nothing to ask for, loading, missing (a 404), failed and ready, drops the previous answer as soon as the question changes, and aborts requests that have been superseded, so a slow early response can never overwrite a later one. `ResourceState` renders those states, so a screen only supplies its wording and its content.
- **No state library.** Only two things outlive a screen: the dashboard's genre rows (also the source of the genre filter) and shows already visited, so going back is instant. A small helper, `remember`, keeps them (ask once, share a request that is on its way, forget failures) in a memory the app provides to its components, and screens read them through `useAsyncResource` like anything else. That is all the shared state there is, so a store library would add a dependency without adding anything the app uses.
- **Reusable pieces:** `HorizontalScroller` (genre rows, seasons, episodes, cast), `ShowRow`, `ShowCard`, `ShowGrid`, `ArtworkImage`, `PageLinks`, `ResourceState`, `StatusMessage`, `BrowseGenresLink` and the skeleton placeholders.

### Design

- Neutral dark greys with a single yellow accent used for links, focus, active controls and ratings. The detail page layout (backdrop header, rows of seasons, episodes and cast) takes its cues from Plex's web interface.
- **Design tokens in two layers** (`client/styles/tokens.css`): raw values, and semantic tokens such as `--color-surface` or `--radius-card`. Components only use the semantic layer. A test checks the text and background pairs against WCAG AA contrast.
- Responsive without fixed breakpoints where possible: fluid type, card widths and gutters. Rows scroll by swipe, trackpad or keyboard, with paging buttons for mouse users.
- Many shows have no backdrop artwork. The header then uses the poster, blurred, with the sharp poster beside the title.

## Accessibility

The target is WCAG 2.2 AA.

- **Structure:** landmarks, exactly one main heading on every screen once it has loaded (including error and not-found states; the show page has none while the show is still loading, because its name is not known yet), labelled sections and lists, and explicit list roles so Safari keeps list semantics on unstyled lists.
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
| HTTP API | Real HTTP requests against the Express app, with a fake TVMaze client and, for page serving, a temporary client folder |
| Catalogue | Ranking, genre rows, paging and search through its public interface |
| TVMaze client | Only `fetch` is faked; mapping and URL/HTML safety are tested through it |
| Snapshot file | Written and read back from a temporary directory |
| Screens | The whole Vue app is mounted with the real router; only `fetch` is faked |
| Interactive components | `HorizontalScroller`, and search and paging through the screens |
| `useAsyncResource` | Idle, loading, missing, errors, reload, no stale data and "the newest request wins" |
| `remember` | Asking once per key, sharing a request on its way, forgetting failures |
| URL locations | Reading and writing the search and paging parameters, including malformed values |
| Design tokens | WCAG AA contrast of the colour pairs, including text over artwork |
| Accessibility | axe on every screen, plus focus, announcements and text alternatives |

The client was written test-first, one behaviour at a time. The server's tests were written after its code; to make up for that, each behaviour on both sides was then broken deliberately once to confirm that a test fails. That check found four gaps, which now have tests. After later refactoring it was run again against the current code: 116 deliberate breakages, all caught. Line coverage is 99%.

CI (`.github/workflows/ci.yml`) audits dependencies, lints, type-checks, tests and builds.

## Messages you may see in the browser console

Using the app normally leaves the console empty. Two kinds of message can appear, both logged by the browser itself for an HTTP response, not by the app:

- **`Failed to load resource: … 404 (Not Found)`** when you open the address of a show that does not exist (for example `/shows/999999999`) or of a genre that does not exist. The API answers 404 because the show is genuinely not there; the app handles that answer and shows a "could not find" page. Every link inside the app points at a show that exists, so you only get here by typing or pasting such an address. I kept the 404 rather than answering 200 with an empty body, because that would hide a missing resource behind a success code.
- **`429 (Too Many Requests)`** if one visitor opens show pages or seasons more than 60 times a minute. That limit protects TVMaze from being flooded through this server; the page then shows an error with a "Try again" button.

## Trade-offs and what I would do next

- **A backend for a frontend assignment** is more than the brief strictly asks for. It is the only way I found to make "sorted by rating" correct for every genre while keeping the browser light, and it keeps the Vue code free of data plumbing.
- **Catalogue freshness** depends on re-running `pnpm seed`; a scheduled refresh is the obvious addition.
- **Ratings without vote counts** mean a little-known show with a few high votes can top a genre. A minimum-popularity threshold would give more recognisable rows, at the cost of a rule the brief did not ask for.
- **Search** could be made typo-tolerant.
- **End-to-end tests** in a real browser would complement the component tests, which cannot check layout.
- Further out: a light theme, a watchlist, and server-side rendering for faster first paint.

## Credits

Show data and images are provided by [TVMaze](https://www.tvmaze.com) under CC BY-SA.
