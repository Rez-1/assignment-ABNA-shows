<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SearchBox from '@/features/search/SearchBox.vue'
import { readSearch, searchLocation } from '@/shared/utils/locations'

const route = useRoute()
const router = useRouter()

const onSearchPage = computed(() => route.name === 'search')
const term = computed(() => (onSearchPage.value ? readSearch(route).query : ''))

/** The URL is the single source of truth for a search; this only updates it. */
function goToSearch(text: string) {
  if (onSearchPage.value) {
    // Refining a search replaces the history entry, so Back leaves the search page in one step.
    router.replace(searchLocation({ query: text, genre: readSearch(route).genre }))
  } else if (text) {
    router.push(searchLocation({ query: text }))
  }
}
</script>

<template>
  <header class="header">
    <div class="header__inner">
      <RouterLink :to="{ name: 'dashboard' }" class="header__logo" aria-label="Showtime home">
        Show<span class="header__logo-accent">time</span>
      </RouterLink>
      <SearchBox :term="term" class="header__search" @search="goToSearch" />
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
