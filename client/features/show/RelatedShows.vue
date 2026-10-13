<script setup lang="ts">
import { computed } from 'vue'
import { GENRE_ROW_SIZE } from '../../../shared/limits.ts'
import { fetchGenreShows } from '@/features/genre/api'
import ShowRow from '@/shared/components/ShowRow.vue'
import { useAsyncResource } from '@/shared/composables/useAsyncResource'

/**
 * "More in <genre>": the best-rated shows of one genre, minus the show being
 * viewed. It is a suggestion, not core content, so while loading or on failure
 * it simply does not appear.
 */
const props = defineProps<{ showId: number; genre: string }>()

const { data: page } = useAsyncResource(
  () => props.genre,
  (genre, signal) => fetchGenreShows(genre, 1, signal),
)

const shows = computed(() => (page.value?.items ?? []).filter((show) => show.id !== props.showId).slice(0, GENRE_ROW_SIZE))
</script>

<template>
  <ShowRow v-if="shows.length" id="related" :title="`More in ${genre}`" :genre="genre" :shows="shows" />
</template>
