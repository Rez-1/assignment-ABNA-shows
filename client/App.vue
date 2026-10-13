<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/app/AppHeader.vue'
import { currentPageName } from '@/shared/composables/usePageTitle'

const main = useTemplateRef('main')

// A full page load moves focus and announces the page; a client-side navigation
// does neither. So when the page changes, move focus into the new content (the
// live region below announces its name). Changes within a page, such as typing
// a search or paging, leave focus where the user put it.
useRouter().afterEach((to, from) => {
  const isFirstLoad = from.matched.length === 0
  if (!isFirstLoad && to.path !== from.path) main.value?.focus({ preventScroll: true })
})
</script>

<template>
  <a href="#main" class="skip-link">Skip to content</a>
  <AppHeader />
  <p class="visually-hidden" aria-live="polite" aria-atomic="true" data-test="route-announcer">{{ currentPageName }}</p>
  <main id="main" ref="main" tabindex="-1">
    <RouterView />
  </main>
  <footer class="footer">
    <!-- TVMaze licenses its data under CC BY-SA, which asks for this credit. -->
    Show data provided by
    <!-- Kept on one line: line breaks inside the link would add stray spaces to its text. -->
    <a href="https://www.tvmaze.com" class="text-link" target="_blank" rel="noopener noreferrer">TVMaze <span class="visually-hidden">(opens in a new tab)</span></a>
  </footer>
</template>

<style scoped>
.skip-link {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  z-index: 20;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-weight: var(--weight-bold);
  transform: translateY(-200%);
}

.skip-link:focus {
  transform: none;
}

main {
  /* Keeps the footer at the bottom on short pages. */
  min-height: calc(100vh - var(--header-height) - 4rem);
}

/* Focus lands here after navigation; it is not a control, so it needs no ring. */
main:focus {
  outline: none;
}

.footer {
  padding: var(--space-6) var(--page-gutter);
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  text-align: center;
}
</style>
