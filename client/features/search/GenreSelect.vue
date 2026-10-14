<script setup lang="ts">
import { computed } from 'vue'

/** A drop-down to pick one genre, or all of them (the empty value). */
const props = defineProps<{ genres: readonly string[] }>()

const selected = defineModel<string>({ default: '' })

// The chosen genre is always on offer, so it stays selected before the list arrives or if it never does.
const options = computed(() =>
  selected.value && !props.genres.includes(selected.value) ? [selected.value, ...props.genres] : props.genres,
)
</script>

<template>
  <select v-model="selected" class="genre-select" aria-label="Genre">
    <option value="">All genres</option>
    <option v-for="genre in options" :key="genre" :value="genre">{{ genre }}</option>
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
