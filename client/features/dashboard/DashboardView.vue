<script setup lang="ts">
import { onMounted } from 'vue'
import SkeletonCard from '@/shared/components/SkeletonCard.vue'
import StatusMessage from '@/shared/components/StatusMessage.vue'
import { usePageTitle } from '@/shared/composables/usePageTitle'
import GenreQuickLinks from './GenreQuickLinks.vue'
import GenreRow from './GenreRow.vue'
import { useGenresStore } from './genresStore'

const genres = useGenresStore()

usePageTitle(() => null)
onMounted(genres.ensureLoaded)
</script>

<template>
  <div class="page dashboard">
    <h1 class="visually-hidden">TV shows by genre</h1>

    <StatusMessage
      v-if="genres.status === 'error'"
      variant="error"
      title="Shows could not be loaded"
      :message="genres.errorMessage"
      retryable
      @retry="genres.load"
    />

    <template v-else-if="genres.status === 'success'">
      <GenreQuickLinks :genres="genres.genreNames" />
      <GenreRow v-for="row in genres.rows" :key="row.genre" :row="row" />
    </template>

    <template v-else>
      <p role="status" class="visually-hidden">Loading shows</p>
      <div v-for="row in 3" :key="row" class="dashboard__skeleton-row">
        <SkeletonCard v-for="card in 8" :key="card" class="dashboard__skeleton-card" />
      </div>
    </template>
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
