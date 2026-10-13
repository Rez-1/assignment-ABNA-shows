<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SearchBox from '@/features/search/SearchBox.vue'

const route = useRoute()
const router = useRouter()

const onSearchPage = computed(() => route.name === 'search')
const term = computed(() => (onSearchPage.value && typeof route.query.q === 'string' ? route.query.q : ''))

/** The URL is the single source of truth for a search; this only updates it. */
function search(text: string) {
  if (onSearchPage.value) {
    // Refining a search replaces the history entry, so Back leaves the search page in one step.
    router.replace({ name: 'search', query: { q: text || undefined, genre: route.query.genre } })
  } else if (text) {
    router.push({ name: 'search', query: { q: text } })
  }
}
</script>

<template>
  <header class="header">
    <div class="header__inner">
      <RouterLink :to="{ name: 'dashboard' }" class="header__logo" aria-label="Showtime home">
        Show<span class="header__logo-accent">time</span>
      </RouterLink>
      <SearchBox :term="term" class="header__search" @search="search" />
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-scrim);
  backdrop-filter: blur(12px);
}

.header__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3) var(--space-6);
  max-width: var(--page-max-width);
  margin-inline: auto;
  padding: var(--space-3) var(--page-gutter);
}

.header__logo {
  color: var(--color-text);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  letter-spacing: -0.01em;
}

.header__logo-accent {
  color: var(--color-accent);
}

@media (max-width: 40rem) {
  /* Two rows on phones: the logo, then a full-width search field. */
  .header__search {
    flex-basis: 100%;
    max-width: none;
  }
}
</style>
