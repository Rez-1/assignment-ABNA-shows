import { createRouter, type RouterHistory } from 'vue-router'
import { ID_PATTERN } from '../shared/limits.ts'
import DashboardView from '@/features/dashboard/DashboardView.vue'
import { readPage, readSearch } from '@/shared/utils/locations'

/** A show id from the URL, or null when it is not a positive whole number. */
function toShowId(value: string | string[] | undefined): number | null {
  return typeof value === 'string' && ID_PATTERN.test(value) ? Number(value) : null
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
        props: (route) => ({ genre: String(route.params.genre), page: readPage(route) }),
      },
      {
        path: '/search',
        name: 'search',
        component: () => import('@/features/search/SearchView.vue'),
        props: readSearch,
      },
      {
        path: '/shows/:id',
        name: 'show',
        component: () => import('@/features/show/ShowDetailView.vue'),
        props: (route) => ({ id: toShowId(route.params.id) }),
      },
      { path: '/:path(.*)*', name: 'not-found', component: () => import('@/app/NotFoundView.vue') },
    ],
  })
}
