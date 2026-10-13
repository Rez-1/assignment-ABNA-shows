<script setup lang="ts">
import { useRoute, type RouteLocationRaw } from 'vue-router'
import AppIcon from './AppIcon.vue'

/**
 * Previous/next links for a paged list. The page number lives in the URL
 * (`?page=`), so pages can be bookmarked and the back button works.
 */
defineProps<{ page: number; pageCount: number }>()

const route = useRoute()

function linkTo(page: number): RouteLocationRaw {
  // Page 1 is the default, so it is left out of the URL.
  return { query: { ...route.query, page: page > 1 ? page : undefined } }
}
</script>

<template>
  <nav v-if="pageCount > 1" class="pages" aria-label="Pages">
    <RouterLink v-if="page > 1" :to="linkTo(page - 1)" rel="prev" class="pages__link">
      <AppIcon name="chevron-left" /> Previous
    </RouterLink>
    <span class="pages__status muted">Page {{ page }} of {{ pageCount }}</span>
    <RouterLink v-if="page < pageCount" :to="linkTo(page + 1)" rel="next" class="pages__link pages__link--next">
      Next <AppIcon name="chevron-right" />
    </RouterLink>
  </nav>
</template>

<style scoped>
.pages {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--space-4);
  padding-top: var(--space-6);
}

.pages__status {
  grid-column: 2;
  font-size: var(--text-sm);
}

.pages__link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  justify-self: start;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--text-sm);
}

.pages__link--next {
  grid-column: 3;
  justify-self: end;
}

.pages__link:hover {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--color-on-accent);
}
</style>
