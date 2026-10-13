<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { GenreRow } from '../../../shared/types.ts'
import ShowCard from '@/shared/components/ShowCard.vue'
import { fetchGenreRows } from './api'

const rows = ref<GenreRow[]>([])

onMounted(async () => {
  rows.value = await fetchGenreRows()
})
</script>

<template>
  <div class="page dashboard">
    <h1 class="visually-hidden">TV shows by genre</h1>
    <section v-for="row in rows" :key="row.genre" class="dashboard__row" data-test="genre-row">
      <h2 class="section-title">{{ row.genre }}</h2>
      <ul class="dashboard__shows">
        <li v-for="show in row.shows" :key="show.id">
          <ShowCard :show="show" />
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  display: grid;
  gap: var(--space-8);
}

.dashboard__row {
  display: grid;
  gap: var(--space-3);
  min-width: 0;
}

.dashboard__shows {
  display: flex;
  gap: var(--space-4);
}
</style>
