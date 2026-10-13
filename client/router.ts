import { createRouter, type RouterHistory } from 'vue-router'
import DashboardView from '@/features/dashboard/DashboardView.vue'

/** The history is passed in so tests can run the real router in memory. */
export function createAppRouter(history: RouterHistory) {
  return createRouter({
    history,
    routes: [
      { path: '/', name: 'dashboard', component: DashboardView },
      { path: '/shows/:id', name: 'show', component: () => import('@/features/show/ShowDetailView.vue') },
    ],
  })
}
