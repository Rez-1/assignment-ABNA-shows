<script setup lang="ts">
/**
 * A centred message for when there is nothing to list: an error (announced to
 * screen readers, with an optional retry) or an empty state.
 */
withDefaults(
  defineProps<{
    title: string
    message?: string
    variant?: 'error' | 'empty'
    retryable?: boolean
    /** Less padding, for use inside a section rather than as a whole page. */
    compact?: boolean
  }>(),
  { message: undefined, variant: 'empty', retryable: false, compact: false },
)

defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="status" :class="{ 'status--compact': compact }" :role="variant === 'error' ? 'alert' : undefined">
    <h2 class="section-title">{{ title }}</h2>
    <p v-if="message" class="muted">{{ message }}</p>
    <button v-if="retryable" type="button" class="status__retry" @click="$emit('retry')">Try again</button>
    <slot />
  </div>
</template>

<style scoped>
.status {
  display: grid;
  justify-items: center;
  gap: var(--space-3);
  padding: var(--space-16) var(--space-4);
  text-align: center;
}

.status--compact {
  padding-block: var(--space-8);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
}

.status__retry {
  padding: var(--space-2) var(--space-6);
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-weight: var(--weight-bold);
  transition: background-color var(--duration-fast) var(--ease-out);
}

.status__retry:hover {
  background: var(--color-accent-hover);
}
</style>
