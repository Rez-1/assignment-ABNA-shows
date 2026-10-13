<script setup lang="ts">
import ResourceState from '@/shared/components/ResourceState.vue'
import StatusMessage from '@/shared/components/StatusMessage.vue'
import { useAsyncResource } from '@/shared/composables/useAsyncResource'
import { usePageTitle } from '@/shared/composables/usePageTitle'
import CastRow from './CastRow.vue'
import RelatedShows from './RelatedShows.vue'
import ShowHero from './ShowHero.vue'
import ShowSeasons from './ShowSeasons.vue'
import { useShowsStore } from './showsStore'

/** `id` is null when the URL does not hold a valid show id. */
const props = defineProps<{ id: number | null }>()

const shows = useShowsStore()

const resource = useAsyncResource(() => props.id, shows.load, { nullSource: 'missing' })

usePageTitle(() => resource.data.value?.name ?? (resource.status.value === 'missing' ? 'Show not found' : null))
</script>

<template>
  <!-- The show itself runs edge to edge; every other state sits in the page column. -->
  <div :class="{ page: resource.status.value !== 'success' }">
    <ResourceState :resource="resource" error-title="This show could not be loaded" loading-label="Loading show" :heading-level="1">
      <template #loading>
        <div class="show__skeleton" aria-hidden="true">
          <div class="show__skeleton-line show__skeleton-line--title" />
          <div class="show__skeleton-line" />
          <div class="show__skeleton-line" />
          <div class="show__skeleton-line show__skeleton-line--short" />
        </div>
      </template>

      <template #missing>
        <StatusMessage
          title="We could not find that show"
          message="It may have been removed, or the link is incorrect."
          :heading-level="1"
        >
          <RouterLink :to="{ name: 'dashboard' }" class="text-link" data-test="back-to-genres">Browse all genres</RouterLink>
        </StatusMessage>
      </template>

      <template #default="{ data: show }">
        <article class="show">
          <ShowHero :show="show" />
          <div class="page show__sections">
            <!-- Keyed by show, so moving to another show starts again at its first season. -->
            <ShowSeasons v-if="show.seasons.length" :key="show.id" :seasons="show.seasons" />
            <CastRow v-if="show.cast.length" :cast="show.cast" />
            <RelatedShows v-if="show.genres[0]" :show-id="show.id" :genre="show.genres[0]" />
          </div>
        </article>
      </template>
    </ResourceState>
  </div>
</template>

<style scoped>
.show__sections {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-12);
}

.show__skeleton {
  display: grid;
  gap: var(--space-4);
  max-width: var(--prose-width);
  padding-top: var(--space-16);
}

.show__skeleton-line {
  height: 1rem;
  border-radius: var(--radius-badge);
  background: var(--color-surface-raised);
  animation: pulse 1.4s ease-in-out infinite;
}

.show__skeleton-line--title {
  width: 60%;
  height: 2.5rem;
}

.show__skeleton-line--short {
  width: 40%;
}

@keyframes pulse {
  50% {
    opacity: 0.5;
  }
}
</style>
