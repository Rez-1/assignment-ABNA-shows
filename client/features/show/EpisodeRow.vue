<script setup lang="ts">
import type { Season } from '../../../shared/types.ts'
import ArtworkImage from '@/shared/components/ArtworkImage.vue'
import HorizontalScroller from '@/shared/components/HorizontalScroller.vue'
import SkeletonCard from '@/shared/components/SkeletonCard.vue'
import StatusMessage from '@/shared/components/StatusMessage.vue'
import { useAsyncResource } from '@/shared/composables/useAsyncResource'
import { formatDate } from '@/shared/utils/format'
import { fetchSeasonEpisodes } from './api'

/** The episodes of one season, loaded when that season is shown. */
const props = defineProps<{ season: Season }>()

const { data: episodes, error, status, reload } = useAsyncResource(() => props.season.id, fetchSeasonEpisodes)
</script>

<template>
  <section class="episodes" aria-labelledby="episodes-heading">
    <h2 id="episodes-heading" class="section-title">Season {{ season.number }} episodes</h2>

    <template v-if="status === 'loading'">
      <p role="status" class="visually-hidden">Loading episodes</p>
      <div class="episodes__skeleton">
        <SkeletonCard v-for="card in 4" :key="card" shape="still" class="episodes__skeleton-card" />
      </div>
    </template>

    <StatusMessage
      v-else-if="error"
      variant="error"
      title="Episodes could not be loaded"
      :message="error.message"
      retryable
      compact
      @retry="reload"
    />

    <StatusMessage v-else-if="episodes?.length === 0" title="No episodes are listed for this season" compact />

    <HorizontalScroller v-else-if="episodes" :label="`Season ${season.number} episodes`" class="episodes__scroller">
      <li v-for="episode in episodes" :key="episode.id" class="episode" data-test="episode">
        <div class="episode__still">
          <ArtworkImage :src="episode.image" shape="still" />
          <span v-if="episode.number !== null" class="episode__number">E{{ episode.number }}</span>
        </div>
        <p class="episode__name" data-test="episode-name">{{ episode.name }}</p>
        <p v-if="formatDate(episode.airdate)" class="episode__date muted">{{ formatDate(episode.airdate) }}</p>
      </li>
    </HorizontalScroller>
  </section>
</template>

<style scoped>
.episodes {
  display: grid;
  gap: var(--space-3);
  min-width: 0;
}

.episodes__scroller {
  --scroller-item-width: clamp(12rem, 60vw, 16rem);
}

.episodes__skeleton {
  display: flex;
  gap: var(--space-4);
  overflow: hidden;
  padding-block: var(--space-2);
}

.episodes__skeleton-card {
  flex: 0 0 clamp(12rem, 60vw, 16rem);
}

.episode {
  display: grid;
  align-content: start;
  gap: var(--space-1);
}

.episode__still {
  position: relative;
  margin-bottom: var(--space-1);
}

.episode__number {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  padding: 0 var(--space-2);
  border-radius: var(--radius-badge);
  background: var(--color-scrim);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
}

.episode__name {
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  line-height: var(--leading-tight);
}

.episode__date {
  font-size: var(--text-xs);
}
</style>
