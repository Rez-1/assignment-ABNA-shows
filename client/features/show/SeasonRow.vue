<script setup lang="ts">
import type { Season } from '../../../shared/types.ts'
import ArtworkImage from '@/shared/components/ArtworkImage.vue'
import HorizontalScroller from '@/shared/components/HorizontalScroller.vue'
import { formatCount } from '@/shared/utils/format'

/** A row of season cards; exactly one is selected. */
defineProps<{ seasons: readonly Season[] }>()

const selectedId = defineModel<number>({ required: true })

function describe(season: Season): string {
  const year = season.premiereDate?.slice(0, 4)
  const episodes = season.episodeCount === null ? null : formatCount(season.episodeCount, 'episode')
  return [year, episodes].filter(Boolean).join(' · ')
}
</script>

<template>
  <section class="seasons" aria-labelledby="seasons-heading">
    <h2 id="seasons-heading" class="section-title">{{ formatCount(seasons.length, 'season') }}</h2>
    <HorizontalScroller label="Seasons">
      <li v-for="season in seasons" :key="season.id">
        <button
          type="button"
          class="season"
          :aria-pressed="season.id === selectedId"
          data-test="season"
          @click="selectedId = season.id"
        >
          <ArtworkImage :src="season.image" class="season__poster" />
          <span class="season__name">Season {{ season.number }}</span>
          <span class="season__meta muted">{{ describe(season) }}</span>
        </button>
      </li>
    </HorizontalScroller>
  </section>
</template>

<style scoped>
.seasons {
  display: grid;
  gap: var(--space-3);
  min-width: 0;
}

.season {
  display: grid;
  gap: var(--space-1);
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  text-align: left;
}

.season__poster {
  margin-bottom: var(--space-1);
  outline: 2px solid transparent;
  outline-offset: 2px;
  transition: outline-color var(--duration-fast) var(--ease-out);
}

.season[aria-pressed='true'] .season__poster,
.season:focus-visible .season__poster {
  outline-color: var(--color-accent);
}

.season:focus-visible {
  outline: none;
}

.season__name {
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  line-height: var(--leading-tight);
}

.season[aria-pressed='true'] .season__name,
.season:hover .season__name {
  color: var(--color-accent);
}

.season__meta {
  font-size: var(--text-xs);
}
</style>
