<script setup lang="ts">
/** A drop-down to pick one genre, or all of them (the empty value). */
defineProps<{ genres: readonly string[] }>()

const selected = defineModel<string>({ default: '' })
</script>

<template>
  <select v-model="selected" class="genre-select" aria-label="Genre">
    <option value="">All genres</option>
    <option v-for="genre in genres" :key="genre" :value="genre">{{ genre }}</option>
  </select>
</template>

<style scoped>
.genre-select {
  padding: var(--space-2) var(--space-8) var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-surface-raised);
  font-size: var(--text-sm);
}

.genre-select:hover {
  border-color: var(--color-accent);
}
</style>
