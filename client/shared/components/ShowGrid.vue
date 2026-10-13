<script setup lang="ts">
import type { ShowSummary } from '../../../shared/types.ts'
import ShowCard from './ShowCard.vue'

/** A grid of show cards that fits as many columns as the width allows. */
defineProps<{ shows: readonly ShowSummary[] }>()
</script>

<template>
  <ul class="grid">
    <li v-for="show in shows" :key="show.id">
      <ShowCard :show="show" />
    </li>
  </ul>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(9rem, 42vw), 1fr));
  gap: var(--space-6) var(--space-4);
}
</style>
