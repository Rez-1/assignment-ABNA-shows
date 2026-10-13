import { readonly, ref, watchEffect } from 'vue'

const APP_NAME = 'Showtime'

const current = ref('')

/** The name of the page being shown, for announcing navigation to screen readers. */
export const currentPageName = readonly(current)

/**
 * Names the page being shown, wherever that name appears: the browser tab
 * ("Drama · Showtime", or just "Showtime" for the home page) and the
 * announcement screen readers hear after navigating.
 */
export function usePageName(name: () => string | null | undefined): void {
  watchEffect(() => {
    const page = name()
    document.title = page ? `${page} · ${APP_NAME}` : APP_NAME
    current.value = page || 'Home'
  })
}
