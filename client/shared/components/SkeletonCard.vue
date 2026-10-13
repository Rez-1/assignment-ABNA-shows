<script setup lang="ts">
/** A grey stand-in with the same proportions as a real card, so nothing jumps when content arrives. */
withDefaults(defineProps<{ shape?: 'poster' | 'still' | 'portrait' }>(), { shape: 'poster' })
</script>

<template>
  <div class="skeleton" aria-hidden="true" data-test="skeleton-card">
    <div class="skeleton__art" :class="`skeleton__art--${shape}`" />
    <div class="skeleton__line" />
    <div class="skeleton__line skeleton__line--short" />
  </div>
</template>

<style scoped>
.skeleton {
  display: grid;
  gap: var(--space-2);
}

.skeleton__art,
.skeleton__line {
  border-radius: var(--radius-card);
  background: var(--color-surface-raised);
  animation: pulse 1.4s ease-in-out infinite;
}

.skeleton__art {
  aspect-ratio: 2 / 3;
}

.skeleton__art--still {
  aspect-ratio: 16 / 9;
}

.skeleton__art--portrait {
  aspect-ratio: 1;
  border-radius: 50%;
}

.skeleton__line {
  height: 0.75rem;
  border-radius: var(--radius-badge);
}

.skeleton__line--short {
  width: 50%;
}

@keyframes pulse {
  50% {
    opacity: 0.5;
  }
}
</style>
