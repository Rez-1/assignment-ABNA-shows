<script setup lang="ts" generic="Data">
import type { AsyncResource } from '@/shared/composables/useAsyncResource'
import StatusMessage from './StatusMessage.vue'

/**
 * Renders whichever state a resource is in, so a screen only supplies its
 * wording and what to show once the data is here. Failures get a message with
 * "Try again". Without a `missing` slot, a 404 is shown as a failure too.
 */
defineProps<{
  resource: AsyncResource<Data>
  /** Heading of the failure message. */
  errorTitle: string
  /** Announced to screen readers while loading; leave it out when the screen announces loading itself. */
  loadingLabel?: string
  /** For a resource that is one section of a page rather than the whole page. */
  compact?: boolean
  /** Use 1 when the failure message is all the page shows, so the page still has a main heading. */
  headingLevel?: 1 | 2
}>()

defineSlots<{
  default(props: { data: Data }): unknown
  /** The placeholder shown while loading. */
  loading?(): unknown
  idle?(): unknown
  missing?(): unknown
}>()
</script>

<template>
  <slot v-if="resource.status.value === 'idle'" name="idle" />

  <template v-else-if="resource.status.value === 'loading'">
    <p v-if="loadingLabel" role="status" class="visually-hidden">{{ loadingLabel }}</p>
    <slot name="loading" />
  </template>

  <slot v-else-if="resource.status.value === 'missing' && $slots.missing" name="missing" />

  <slot v-else-if="resource.status.value === 'success'" :data="resource.data.value as Data" />

  <StatusMessage
    v-else
    variant="error"
    :title="errorTitle"
    :message="resource.error.value?.message"
    :heading-level="headingLevel"
    :compact="compact"
    retryable
    @retry="resource.reload"
  />
</template>
