<script setup lang="ts">
import PageLinks from '@/shared/components/PageLinks.vue'
import ShowGrid from '@/shared/components/ShowGrid.vue'
import ShowGridSkeleton from '@/shared/components/ShowGridSkeleton.vue'
import { useAsyncResource } from '@/shared/composables/useAsyncResource'
import { formatCount } from '@/shared/utils/format'
import { fetchGenreShows } from './api'

const props = defineProps<{ genre: string; page: number }>()

const { data: result, status } = useAsyncResource(
  () => ({ genre: props.genre, page: props.page }),
  ({ genre, page }, signal) => fetchGenreShows(genre, page, signal),
)
</script>

<template>
  <div class="page genre">
    <header class="genre__header">
      <h1 class="page-title">{{ genre }}</h1>
      <p v-if="result" class="muted">{{ formatCount(result.total, 'show') }}, best rated first</p>
    </header>

    <ShowGridSkeleton v-if="status === 'loading'" :label="`Loading ${genre} shows`" />

    <template v-else-if="result">
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
