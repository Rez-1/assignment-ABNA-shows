<script setup lang="ts">
import type { ShowSummary } from '../../../shared/types.ts'
import ArtworkImage from './ArtworkImage.vue'
import RatingBadge from './RatingBadge.vue'

defineProps<{ show: ShowSummary }>()
</script>

<template>
  <RouterLink :to="{ name: 'show', params: { id: show.id } }" class="card" data-test="show-card">
    <ArtworkImage :src="show.image" class="card__poster" />
    <p class="card__title" data-test="show-name">{{ show.name }}</p>
    <p class="card__meta">
      <RatingBadge :rating="show.rating" />
      <span v-if="show.year">{{ show.year }}</span>
    </p>
  </RouterLink>
</template>

<style scoped>
.card {
  display: grid;
  gap: var(--space-1);
  color: var(--color-text);
}

.card__poster {
  margin-bottom: var(--space-1);
  transition: transform var(--duration-fast) var(--ease-out);
}

.card:hover .card__poster {
  transform: translateY(-4px);
}

.card:focus-visible {
  outline: none;
}

.card:focus-visible .card__poster {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.card__title {
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  line-height: var(--leading-tight);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

.card:hover .card__title,
.card:focus-visible .card__title {
  color: var(--color-accent);
}

.card__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--text-xs);
}
</style>
