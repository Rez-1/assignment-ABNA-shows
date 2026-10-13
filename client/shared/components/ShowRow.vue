<script setup lang="ts">
import type { ShowSummary } from '../../../shared/types.ts'
import AppIcon from './AppIcon.vue'
import HorizontalScroller from './HorizontalScroller.vue'
import ShowCard from './ShowCard.vue'

/**
 * A titled, horizontally scrolling row of shows with a link to the full genre.
 * Used for the dashboard's genre rows and for "More in this genre".
 */
defineProps<{
  /** Element id of the section, also used to label it. */
  id: string
  title: string
  /** Shown next to the title, for example "26,512 shows". */
  note?: string
  /** The genre that "View all" opens. */
  genre: string
  shows: readonly ShowSummary[]
}>()
</script>

<template>
  <section :id="id" class="show-row" :aria-labelledby="`${id}-heading`">
    <header class="show-row__header">
      <h2 :id="`${id}-heading`" class="section-title">{{ title }}</h2>
      <span v-if="note" class="show-row__note muted">{{ note }}</span>
      <RouterLink
        :to="{ name: 'genre', params: { genre } }"
        class="show-row__all"
        :aria-label="`View all ${genre} shows`"
        data-test="view-all"
      >
        View all <AppIcon name="chevron-right" />
      </RouterLink>
    </header>
    <HorizontalScroller :label="`${genre} shows`">
      <li v-for="show in shows" :key="show.id">
        <ShowCard :show="show" />
      </li>
    </HorizontalScroller>
  </section>
</template>

<style scoped>
.show-row {
  display: grid;
  gap: var(--space-3);
  min-width: 0;
}

.show-row__header {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.show-row__note {
  font-size: var(--text-sm);
}

.show-row__all {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin-left: auto;
  font-size: var(--text-sm);
  white-space: nowrap;
}
</style>
