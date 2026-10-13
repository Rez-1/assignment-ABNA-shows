<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Page, ShowSummary } from '../../../shared/types.ts'
import PageLinks from '@/shared/components/PageLinks.vue'
import ShowGrid from '@/shared/components/ShowGrid.vue'
import { formatCount } from '@/shared/utils/format'
import { fetchGenreShows } from './api'

const props = defineProps<{ genre: string; page: number }>()

const result = ref<Page<ShowSummary> | null>(null)

watch(
  () => [props.genre, props.page] as const,
  async ([genre, page]) => {
    result.value = await fetchGenreShows(genre, page)
  },
  { immediate: true },
)
</script>

<template>
  <div class="page genre">
    <header class="genre__header">
      <h1 class="page-title">{{ genre }}</h1>
      <p v-if="result" class="muted">{{ formatCount(result.total, 'show') }}, best rated first</p>
    </header>
    <template v-if="result">
      <ShowGrid :shows="result.items" />
      <PageLinks :page="result.page" :page-count="result.pageCount" />
    </template>
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
