<script setup lang="ts">
import { genreAnchor } from '@/shared/utils/format'

defineProps<{ genres: string[] }>()
</script>

<template>
  <nav class="quick-links" aria-label="Jump to a genre">
    <ul class="quick-links__list" role="list">
      <li v-for="genre in genres" :key="genre">
        <RouterLink :to="{ hash: `#${genreAnchor(genre)}` }" class="quick-links__link">{{ genre }}</RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.quick-links__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.quick-links__link {
  display: block;
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--text-sm);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.quick-links__link:hover {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--color-on-accent);
}

@media (max-width: 40rem) {
  /* On phones the links become one swipeable line instead of several wrapped ones. */
  .quick-links__list {
    flex-wrap: nowrap;
    margin-inline: calc(var(--page-gutter) * -1);
    padding-inline: var(--page-gutter);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .quick-links__link {
    white-space: nowrap;
  }
}
</style>
