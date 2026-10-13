<script setup lang="ts">
import SkeletonCard from './SkeletonCard.vue'

/** Stand-in for a ShowGrid while its shows load. */
withDefaults(defineProps<{ count?: number }>(), { count: 12 })
</script>

<template>
  <div class="grid-skeleton">
    <SkeletonCard v-for="card in count" :key="card" />
  </div>
</template>

<style scoped>
.grid-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(9rem, 42vw), 1fr));
  gap: var(--space-6) var(--space-4);
}
</style>
