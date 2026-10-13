<script setup lang="ts">
import { useAsyncResource } from '@/shared/composables/useAsyncResource'
import { fetchShow } from './api'
import CastRow from './CastRow.vue'
import RelatedShows from './RelatedShows.vue'
import ShowHero from './ShowHero.vue'
import ShowSeasons from './ShowSeasons.vue'

const props = defineProps<{ id: number }>()

const { data: show } = useAsyncResource(() => props.id, fetchShow)
</script>

<template>
  <article v-if="show" class="show">
    <ShowHero :show="show" />
    <div class="page show__sections">
      <!-- Keyed by show, so moving to another show starts again at its first season. -->
      <ShowSeasons v-if="show.seasons.length" :key="show.id" :seasons="show.seasons" />
      <CastRow v-if="show.cast.length" :cast="show.cast" />
      <RelatedShows v-if="show.genres[0]" :show-id="show.id" :genre="show.genres[0]" />
    </div>
  </article>
</template>

<style scoped>
.show__sections {
  display: grid;
  gap: var(--space-12);
}
</style>
