<script setup lang="ts">
import { computed } from 'vue'
import { ApiError } from '@/shared/api/http'
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

const {
  data: show,
  error,
  status,
  reload,
} = useAsyncResource(
  () => props.id,
  (id, signal) => (id === null ? Promise.reject(new ApiError('Not found', 404)) : shows.load(id, signal)),
)

const isMissing = computed(() => error.value instanceof ApiError && error.value.status === 404)

usePageTitle(() => show.value?.name ?? (isMissing.value ? 'Show not found' : null))
</script>

<template>
  <div v-if="status === 'loading'" class="page">
    <p role="status" class="visually-hidden">Loading show</p>
    <div class="show__skeleton" aria-hidden="true">
      <div class="show__skeleton-line show__skeleton-line--title" />
      <div class="show__skeleton-line" />
      <div class="show__skeleton-line" />
      <div class="show__skeleton-line show__skeleton-line--short" />
    </div>
  </div>

  <div v-else-if="isMissing" class="page">
    <StatusMessage
      title="We could not find that show"
      message="It may have been removed, or the link is incorrect."
      :heading-level="1"
    >
      <RouterLink :to="{ name: 'dashboard' }" class="text-link" data-test="back-to-genres">Browse all genres</RouterLink>
    </StatusMessage>
  </div>

  <div v-else-if="error" class="page">
    <StatusMessage
      variant="error"
      title="This show could not be loaded"
      :heading-level="1"
      :message="error.message"
      retryable
      @retry="reload"
    />
  </div>

  <article v-else-if="show" class="show">
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
