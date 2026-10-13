import { createRouter, type LocationQueryValue, type RouterHistory } from 'vue-router'
import DashboardView from '@/features/dashboard/DashboardView.vue'

type QueryValue = LocationQueryValue | LocationQueryValue[] | undefined

/** Reads `?page=` from the URL; anything that is not a positive whole number means page 1. */
function toPageNumber(value: QueryValue): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function toText(value: QueryValue): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** The history is passed in so tests can run the real router in memory. */
export function createAppRouter(history: RouterHistory) {
  return createRouter({
    history,
    scrollBehavior(to, _from, savedPosition) {
      // Back and forward restore where you were; quick links scroll to their genre row.
      if (savedPosition) return savedPosition
      if (to.hash) return { el: to.hash, behavior: 'smooth' }
      return { top: 0 }
    },
    routes: [
      { path: '/', name: 'dashboard', component: DashboardView },
      {
        path: '/genres/:genre',
        name: 'genre',
        component: () => import('@/features/genre/GenreView.vue'),
        props: (route) => ({ genre: String(route.params.genre), page: toPageNumber(route.query.page) }),
      },
      {
        path: '/search',
        name: 'search',
        component: () => import('@/features/search/SearchView.vue'),
        props: (route) => ({
          query: toText(route.query.q),
          genre: toText(route.query.genre) || undefined,
          page: toPageNumber(route.query.page),
        }),
      },
      { path: '/shows/:id', name: 'show', component: () => import('@/features/show/ShowDetailView.vue') },
    ],
  })
}
