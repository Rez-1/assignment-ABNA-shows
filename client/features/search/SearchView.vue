<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGenreRows } from '@/features/dashboard/genresStore'
import GenreSelect from '@/shared/components/GenreSelect.vue'
import PageLinks from '@/shared/components/PageLinks.vue'
import ResourceState from '@/shared/components/ResourceState.vue'
import ShowGrid from '@/shared/components/ShowGrid.vue'
import ShowGridSkeleton from '@/shared/components/ShowGridSkeleton.vue'
import StatusMessage from '@/shared/components/StatusMessage.vue'
import { useAsyncResource } from '@/shared/composables/useAsyncResource'
import { usePageTitle } from '@/shared/composables/usePageTitle'
import { formatCount } from '@/shared/utils/format'
import { searchShows } from './api'

const props = defineProps<{ query: string; genre?: string; page: number }>()

const router = useRouter()
const { genreNames } = useGenreRows()

const resource = useAsyncResource(
  // Nothing to look for yet: a null source skips the request rather than ask the server for an empty search.
  () => (props.query ? { query: props.query, genre: props.genre, page: props.page } : null),
  searchShows,
)
const result = resource.data

// The URL holds the search; picking a genre rewrites it and starts again from page one.
const selectedGenre = computed({
  get: () => props.genre ?? '',
  set: (genre) => router.push({ name: 'search', query: { q: props.query, genre: genre || undefined } }),
})

usePageTitle(() => (props.query ? `“${props.query}”` : 'Search'))

const scope = computed(() => `“${props.query}”${props.genre ? ` in ${props.genre}` : ''}`)

const heading = computed(() => {
  if (!props.query) return 'Search shows'
  return result.value ? `${formatCount(result.value.total, 'result')} for ${scope.value}` : `Searching for ${scope.value}`
})
</script>

<template>
  <div class="page search-page">
    <header class="search-page__header">
      <h1 class="page-title search-page__title">{{ heading }}</h1>
      <GenreSelect v-if="query" v-model="selectedGenre" :genres="genreNames" />
    </header>

    <!-- Always present, so screen readers announce each change as results come in while typing. -->
    <p v-if="query" role="status" class="visually-hidden" data-test="search-status">
      {{ resource.status.value === 'loading' ? 'Searching' : heading }}
    </p>

    <ResourceState :resource="resource" error-title="The search could not be completed">
      <template #idle>
        <StatusMessage title="What are you looking for?" message="Type a show’s name in the search box above." />
      </template>

      <template #loading>
        <ShowGridSkeleton />
      </template>

      <template #default="{ data: found }">
        <StatusMessage
          v-if="found.total === 0"
          :title="`No shows match ${scope}`"
          message="Check the spelling or try a shorter part of the name."
        >
          <RouterLink v-if="genre" :to="{ name: 'search', query: { q: query } }" class="text-link" data-test="all-genres">
            Search all genres
          </RouterLink>
        </StatusMessage>
        <ShowGrid v-else :shows="found.items" />
        <PageLinks :page="found.page" :page-count="found.pageCount" />
      </template>
    </ResourceState>
  </div>
</template>

<style scoped>
.search-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-6);
}

.search-page__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.search-page__title {
  font-size: var(--text-lg);
}
</style>
