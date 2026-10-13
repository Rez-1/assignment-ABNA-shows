<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Page, ShowSummary } from '../../../shared/types.ts'
import ShowGrid from '@/shared/components/ShowGrid.vue'
import { formatCount } from '@/shared/utils/format'
import { fetchGenreShows } from './api'

const props = defineProps<{ genre: string }>()

const page = ref<Page<ShowSummary> | null>(null)

onMounted(async () => {
  page.value = await fetchGenreShows(props.genre, 1)
})
</script>

<template>
  <div class="page genre">
    <header class="genre__header">
      <h1 class="page-title">{{ genre }}</h1>
      <p v-if="page" class="muted">{{ formatCount(page.total, 'show') }}, best rated first</p>
    </header>
    <ShowGrid v-if="page" :shows="page.items" />
  </div>
</template>

<style scoped>
.genre {
  display: grid;
  gap: var(--space-6);
}

.genre__header {
  display: grid;
  gap: var(--space-1);
}
</style>
