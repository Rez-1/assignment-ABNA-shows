<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGenresStore } from '@/features/dashboard/genresStore'
import GenreSelect from '@/shared/components/GenreSelect.vue'
import ShowGrid from '@/shared/components/ShowGrid.vue'
import { useAsyncResource } from '@/shared/composables/useAsyncResource'
import { formatCount } from '@/shared/utils/format'
import { searchShows } from './api'

const props = defineProps<{ query: string; genre?: string; page: number }>()

const router = useRouter()
const genres = useGenresStore()
onMounted(genres.ensureLoaded)

const { data: result } = useAsyncResource(
  () => ({ query: props.query, genre: props.genre, page: props.page }),
  searchShows,
)

// The URL holds the search; picking a genre rewrites it and starts again from page one.
const selectedGenre = computed({
  get: () => props.genre ?? '',
  set: (genre) => router.push({ name: 'search', query: { q: props.query, genre: genre || undefined } }),
})

const heading = computed(() => {
  const scope = `for “${props.query}”${props.genre ? ` in ${props.genre}` : ''}`
  return result.value ? `${formatCount(result.value.total, 'result')} ${scope}` : `Searching ${scope}`
})
</script>

<template>
  <div class="page search-page">
    <header class="search-page__header">
      <h1 class="page-title search-page__title">{{ heading }}</h1>
      <GenreSelect v-model="selectedGenre" :genres="genres.genreNames" />
    </header>
    <ShowGrid v-if="result" :shows="result.items" />
  </div>
</template>

<style scoped>
.search-page {
  display: grid;
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
