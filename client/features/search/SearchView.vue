<script setup lang="ts">
import ShowGrid from '@/shared/components/ShowGrid.vue'
import { useAsyncResource } from '@/shared/composables/useAsyncResource'
import { searchShows } from './api'

const props = defineProps<{ query: string; genre?: string; page: number }>()

const { data: result } = useAsyncResource(
  () => ({ query: props.query, genre: props.genre, page: props.page }),
  searchShows,
)
</script>

<template>
  <div class="page search-page">
    <h1 class="page-title">Search</h1>
    <ShowGrid v-if="result" :shows="result.items" />
  </div>
</template>

<style scoped>
.search-page {
  display: grid;
  gap: var(--space-6);
}
</style>
