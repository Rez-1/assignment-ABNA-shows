<script setup lang="ts">
import type { ShowSummary } from '../../../shared/types.ts'

defineProps<{ show: ShowSummary }>()
</script>

<template>
  <article class="card">
    <p class="card__title" data-test="show-name">{{ show.name }}</p>
  </article>
</template>

<style scoped>
.card__title {
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  line-height: var(--leading-tight);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}
</style>
