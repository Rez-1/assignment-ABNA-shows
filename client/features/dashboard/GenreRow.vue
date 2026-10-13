<script setup lang="ts">
import type { GenreRow } from '../../../shared/types.ts'
import AppIcon from '@/shared/components/AppIcon.vue'
import ShowCard from '@/shared/components/ShowCard.vue'
import { formatCount } from '@/shared/utils/format'

defineProps<{ row: GenreRow }>()
</script>

<template>
  <section class="genre-row" data-test="genre-row">
    <header class="genre-row__header">
      <h2 class="section-title">{{ row.genre }}</h2>
      <span class="genre-row__count muted">{{ formatCount(row.total, 'show') }}</span>
      <RouterLink
        :to="{ name: 'genre', params: { genre: row.genre } }"
        class="genre-row__all"
        :aria-label="`View all ${row.genre} shows`"
        data-test="view-all"
      >
        View all <AppIcon name="chevron-right" />
      </RouterLink>
    </header>
    <ul class="genre-row__shows">
      <li v-for="show in row.shows" :key="show.id">
        <ShowCard :show="show" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.genre-row {
  display: grid;
  gap: var(--space-3);
  min-width: 0;
}

.genre-row__header {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.genre-row__count {
  font-size: var(--text-sm);
}

.genre-row__all {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin-left: auto;
  font-size: var(--text-sm);
  white-space: nowrap;
}

.genre-row__shows {
  display: flex;
  gap: var(--space-4);
}
</style>
