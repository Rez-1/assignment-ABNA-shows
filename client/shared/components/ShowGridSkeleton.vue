<script setup lang="ts">
import SkeletonCard from './SkeletonCard.vue'

/**
 * Stand-in for a ShowGrid while its shows load. `label` is announced to screen
 * readers; leave it out when the page announces loading itself.
 */
withDefaults(defineProps<{ label?: string; count?: number }>(), { label: undefined, count: 12 })
</script>

<template>
  <div>
    <p v-if="label" role="status" class="visually-hidden">{{ label }}</p>
    <div class="grid-skeleton">
      <SkeletonCard v-for="card in count" :key="card" />
    </div>
  </div>
</template>

<style scoped>
.grid-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(9rem, 42vw), 1fr));
  gap: var(--space-6) var(--space-4);
}
</style>
