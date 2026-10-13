<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { GenreRow as GenreRowData } from '../../../shared/types.ts'
import SkeletonCard from '@/shared/components/SkeletonCard.vue'
import StatusMessage from '@/shared/components/StatusMessage.vue'
import { fetchGenreRows } from './api'
import GenreQuickLinks from './GenreQuickLinks.vue'
import GenreRow from './GenreRow.vue'

const rows = ref<GenreRowData[]>([])
const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMessage = ref('')

async function load() {
  status.value = 'loading'
  try {
    rows.value = await fetchGenreRows()
    status.value = 'success'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Something went wrong'
    status.value = 'error'
  }
}

onMounted(load)
</script>

<template>
  <div class="page dashboard">
    <h1 class="visually-hidden">TV shows by genre</h1>

    <template v-if="status === 'loading'">
      <p role="status" class="visually-hidden">Loading shows</p>
      <div v-for="row in 3" :key="row" class="dashboard__skeleton-row">
        <SkeletonCard v-for="card in 8" :key="card" class="dashboard__skeleton-card" />
      </div>
    </template>

    <StatusMessage
      v-else-if="status === 'error'"
      variant="error"
      title="Shows could not be loaded"
      :message="errorMessage"
      retryable
      @retry="load"
    />

    <template v-else>
      <GenreQuickLinks :genres="rows.map((row) => row.genre)" />
      <GenreRow v-for="row in rows" :key="row.genre" :row="row" />
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  display: grid;
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
