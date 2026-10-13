import { readonly, ref, watchEffect } from 'vue'

const APP_NAME = 'Showtime'

const current = ref('')

/** The name of the page being shown, for announcing navigation to screen readers. */
export const currentPageName = readonly(current)

/** Keeps the browser tab title in step with the page: "Drama · Showtime", or just "Showtime". */
export function usePageTitle(title: () => string | null | undefined): void {
  watchEffect(() => {
    const page = title()
    document.title = page ? `${page} · ${APP_NAME}` : APP_NAME
    current.value = page || 'Home'
  })
}
