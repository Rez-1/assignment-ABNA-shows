<script setup lang="ts">
import { computed } from 'vue'
import ShowGrid from '@/shared/components/ShowGrid.vue'
import { useAsyncResource } from '@/shared/composables/useAsyncResource'
import { formatCount } from '@/shared/utils/format'
import { searchShows } from './api'

const props = defineProps<{ query: string; genre?: string; page: number }>()

const { data: result } = useAsyncResource(
  () => ({ query: props.query, genre: props.genre, page: props.page }),
  searchShows,
)

const heading = computed(() =>
  result.value ? `${formatCount(result.value.total, 'result')} for “${props.query}”` : `Searching for “${props.query}”`,
)
</script>

<template>
  <div class="page search-page">
    <h1 class="page-title search-page__title">{{ heading }}</h1>
    <ShowGrid v-if="result" :shows="result.items" />
  </div>
</template>

<style scoped>
.search-page {
  display: grid;
  gap: var(--space-6);
}

.search-page__title {
  font-size: var(--text-lg);
}
</style>
