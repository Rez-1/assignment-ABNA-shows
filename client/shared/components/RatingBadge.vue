<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps<{ rating: number | null }>()

const value = computed(() => props.rating?.toFixed(1) ?? null)
</script>

<template>
  <span
    class="rating"
    :class="{ 'rating--none': value === null }"
    :role="value === null ? undefined : 'img'"
    :aria-label="value === null ? undefined : `Rated ${value} out of 10`"
    data-test="rating"
  >
    <template v-if="value !== null"><AppIcon name="star" />{{ value }}</template>
    <template v-else>Not rated</template>
  </span>
</template>

<style scoped>
.rating {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-accent);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  line-height: 1;
}

.rating--none {
  color: var(--color-text-muted);
  font-weight: var(--weight-regular);
}
</style>
