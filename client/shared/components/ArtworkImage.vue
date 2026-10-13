<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from './AppIcon.vue'

/**
 * An image in a box of fixed proportions, so the layout never jumps while it
 * loads. Falls back to a placeholder when there is no image or it fails.
 */
withDefaults(
  defineProps<{
    src: string | null
    /** Empty by default: artwork usually sits next to a visible title. */
    alt?: string
    shape?: 'poster' | 'still' | 'portrait'
  }>(),
  { alt: '', shape: 'poster' },
)

const failed = ref(false)
</script>

<template>
  <div class="artwork" :class="`artwork--${shape}`">
    <img
      v-if="src && !failed"
      :src="src"
      :alt="alt"
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
      @error="failed = true"
    />
    <span v-else class="artwork__placeholder" data-test="artwork-placeholder"><AppIcon name="image" /></span>
  </div>
</template>

<style scoped>
.artwork {
  position: relative;
  overflow: hidden;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-card);
  background: var(--color-surface-raised);
}

.artwork--still {
  aspect-ratio: 16 / 9;
}

.artwork--portrait {
  aspect-ratio: 1;
  border-radius: 50%;
}

.artwork img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artwork__placeholder {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: inherit;
  color: var(--color-text-muted);
  font-size: 1.75rem;
}
</style>
