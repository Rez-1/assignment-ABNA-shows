<script setup lang="ts">
import { useAsyncResource } from '@/shared/composables/useAsyncResource'
import { fetchShow } from './api'
import ShowHero from './ShowHero.vue'

const props = defineProps<{ id: number }>()

const { data: show } = useAsyncResource(() => props.id, fetchShow)
</script>

<template>
  <article v-if="show" class="show">
    <ShowHero :show="show" />
  </article>
</template>
