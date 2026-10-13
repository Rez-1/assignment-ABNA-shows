<script setup lang="ts">
import type { CastMember } from '../../../shared/types.ts'
import ArtworkImage from '@/shared/components/ArtworkImage.vue'
import HorizontalScroller from '@/shared/components/HorizontalScroller.vue'

defineProps<{ cast: readonly CastMember[] }>()
</script>

<template>
  <section class="cast" aria-labelledby="cast-heading">
    <h2 id="cast-heading" class="section-title">Cast</h2>
    <HorizontalScroller label="Cast" class="cast__scroller">
      <li v-for="member in cast" :key="member.id" class="cast__member">
        <ArtworkImage :src="member.image" shape="portrait" />
        <p class="cast__name" data-test="cast-name">{{ member.name }}</p>
        <p v-if="member.character" class="cast__character muted">{{ member.character }}</p>
      </li>
    </HorizontalScroller>
  </section>
</template>

<style scoped>
.cast {
  display: grid;
  gap: var(--space-3);
  min-width: 0;
}

.cast__scroller {
  --scroller-item-width: clamp(5.5rem, 24vw, 7.5rem);
}

.cast__member {
  display: grid;
  align-content: start;
  gap: var(--space-1);
  text-align: center;
}

.cast__name {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  line-height: var(--leading-tight);
}

.cast__character {
  font-size: var(--text-xs);
  line-height: var(--leading-tight);
}
</style>
