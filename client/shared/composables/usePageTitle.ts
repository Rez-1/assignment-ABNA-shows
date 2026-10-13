import { watchEffect } from 'vue'

const APP_NAME = 'Showtime'

/** Keeps the browser tab title in step with the page: "Drama · Showtime", or just "Showtime". */
export function usePageTitle(title: () => string | null | undefined): void {
  watchEffect(() => {
    const page = title()
    document.title = page ? `${page} · ${APP_NAME}` : APP_NAME
  })
}
