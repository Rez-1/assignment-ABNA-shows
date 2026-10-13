import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import App from '@/App.vue'
import { createAppRouter } from '@/router'

/** What the fake server answers per URL: a JSON body, or a function producing one (or a Response). */
export type FakeRoutes = Record<string, unknown | (() => unknown)>

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

/**
 * Replaces `fetch` with a fake of our own API. This is the only thing screen
 * tests fake: router, stores and components are all real. Unknown URLs answer
 * 404, like the real server.
 */
export function fakeApi(routes: FakeRoutes) {
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    init?.signal?.throwIfAborted()
    const url = String(input)
    if (!(url in routes)) return jsonResponse({ message: 'Not found' }, 404)
    const route = routes[url]
    const body = typeof route === 'function' ? await (route as () => unknown)() : route
    return body instanceof Response ? body : jsonResponse(body)
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

/** Waits for navigation (including lazily loaded screens) and pending requests to finish. */
export async function settle() {
  await flushPromises()
  await vi.dynamicImportSettled()
  await flushPromises()
}

/** Mounts the whole application at `path` and waits for it to settle. */
export async function renderApp(path = '/') {
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  await router.isReady()

  const wrapper = mount(App, { global: { plugins: [createPinia(), router] }, attachTo: document.body })
  await settle()
  return { wrapper, router }
}
