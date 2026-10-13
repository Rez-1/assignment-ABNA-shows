<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { GenreRow as GenreRowData } from '../../../shared/types.ts'
import { fetchGenreRows } from './api'
import GenreRow from './GenreRow.vue'

const rows = ref<GenreRowData[]>([])

onMounted(async () => {
  rows.value = await fetchGenreRows()
})
</script>

<template>
  <div class="page dashboard">
    <h1 class="visually-hidden">TV shows by genre</h1>
    <GenreRow v-for="row in rows" :key="row.genre" :row="row" />
  </div>
</template>

<style scoped>
.dashboard {
  display: grid;
  gap: var(--space-8);
}
</style>
