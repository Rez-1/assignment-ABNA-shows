<script setup lang="ts">
import { useAsyncResource } from '@/shared/composables/useAsyncResource'
import { fetchShow } from './api'
import CastRow from './CastRow.vue'
import ShowHero from './ShowHero.vue'

const props = defineProps<{ id: number }>()

const { data: show } = useAsyncResource(() => props.id, fetchShow)
</script>

<template>
  <article v-if="show" class="show">
    <ShowHero :show="show" />
    <div class="page show__sections">
      <CastRow v-if="show.cast.length" :cast="show.cast" />
    </div>
  </article>
</template>

<style scoped>
.show__sections {
  display: grid;
  gap: var(--space-12);
}
</style>
