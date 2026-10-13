<script setup lang="ts">
import { useAsyncResource } from '@/shared/composables/useAsyncResource'
import { fetchShow } from './api'
import ShowHero from './ShowHero.vue'

const props = defineProps<{ id: number }>()

const { data: show } = useAsyncResource(() => props.id, fetchShow)
</script>

<template>
  <div class="page show">
    <ShowHero v-if="show" :show="show" />
  </div>
</template>

<style scoped>
.show {
  display: grid;
  gap: var(--space-12);
}
</style>
