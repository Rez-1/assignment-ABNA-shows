<script setup lang="ts">
import PageLinks from '@/shared/components/PageLinks.vue'
import ResourceState from '@/shared/components/ResourceState.vue'
import ShowGrid from '@/shared/components/ShowGrid.vue'
import ShowGridSkeleton from '@/shared/components/ShowGridSkeleton.vue'
import StatusMessage from '@/shared/components/StatusMessage.vue'
import { useAsyncResource } from '@/shared/composables/useAsyncResource'
import { usePageTitle } from '@/shared/composables/usePageTitle'
import { formatCount } from '@/shared/utils/format'
import { fetchGenreShows } from './api'

const props = defineProps<{ genre: string; page: number }>()

const resource = useAsyncResource(
  () => ({ genre: props.genre, page: props.page }),
  ({ genre, page }, signal) => fetchGenreShows(genre, page, signal),
)

usePageTitle(() => props.genre)
</script>

<template>
  <div class="page genre">
    <header class="genre__header">
      <h1 class="page-title">{{ genre }}</h1>
      <p v-if="resource.data.value" class="muted">{{ formatCount(resource.data.value.total, 'show') }}, best rated first</p>
    </header>

    <ResourceState :resource="resource" error-title="Shows could not be loaded" :loading-label="`Loading ${genre} shows`">
      <template #loading>
        <ShowGridSkeleton />
      </template>

      <template #missing>
        <StatusMessage :title="`There is no genre called “${genre}”`">
          <RouterLink :to="{ name: 'dashboard' }" class="text-link" data-test="back-to-genres">Browse all genres</RouterLink>
        </StatusMessage>
      </template>

      <template #default="{ data: result }">
        <StatusMessage v-if="result.items.length === 0" title="There are no shows on this page">
          <RouterLink :to="{ query: {} }" class="text-link" data-test="first-page">Go to the first page</RouterLink>
        </StatusMessage>
        <ShowGrid v-else :shows="result.items" />
        <PageLinks :page="result.page" :page-count="result.pageCount" />
      </template>
    </ResourceState>
  </div>
</template>

<style scoped>
.genre {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-6);
}

.genre__header {
  display: grid;
  gap: var(--space-1);
}
</style>
