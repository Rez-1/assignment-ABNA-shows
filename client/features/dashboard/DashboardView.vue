<script setup lang="ts">
import ResourceState from '@/shared/components/ResourceState.vue'
import SkeletonCard from '@/shared/components/SkeletonCard.vue'
import { usePageTitle } from '@/shared/composables/usePageTitle'
import GenreQuickLinks from './GenreQuickLinks.vue'
import GenreRow from './GenreRow.vue'
import { useGenreRows } from './genresStore'

const genres = useGenreRows()

usePageTitle(() => null)
</script>

<template>
  <div class="page dashboard">
    <h1 class="visually-hidden">TV shows by genre</h1>

    <ResourceState :resource="genres" error-title="Shows could not be loaded" loading-label="Loading shows">
      <template #loading>
        <div v-for="row in 3" :key="row" class="dashboard__skeleton-row">
          <SkeletonCard v-for="card in 8" :key="card" class="dashboard__skeleton-card" />
        </div>
      </template>

      <template #default="{ data: rows }">
        <GenreQuickLinks :genres="genres.genreNames.value" />
        <GenreRow v-for="row in rows" :key="row.genre" :row="row" />
      </template>
    </ResourceState>
  </div>
</template>

<style scoped>
.dashboard {
  display: grid;
  /* minmax(0, …) stops the scrolling rows from stretching the page sideways. */
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-8);
}

.dashboard__skeleton-row {
  display: flex;
  gap: var(--space-4);
  overflow: hidden;
  padding-top: var(--space-8);
}

.dashboard__skeleton-card {
  flex: 0 0 var(--card-width);
}
</style>
