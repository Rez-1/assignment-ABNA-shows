import { createRouter, type RouterHistory } from 'vue-router'
import DashboardView from '@/features/dashboard/DashboardView.vue'

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
      { path: '/genres/:genre', name: 'genre', component: () => import('@/features/genre/GenreView.vue'), props: true },
      { path: '/shows/:id', name: 'show', component: () => import('@/features/show/ShowDetailView.vue') },
    ],
  })
}
