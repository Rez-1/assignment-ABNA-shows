<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Season } from '../../../shared/types.ts'
import EpisodeRow from './EpisodeRow.vue'
import SeasonRow from './SeasonRow.vue'

/** Season picker with the selected season's episodes beneath it. It opens on the first season. */
const props = defineProps<{ seasons: readonly Season[] }>()

const selectedId = ref(props.seasons[0]?.id ?? null)
const selected = computed(() => props.seasons.find((season) => season.id === selectedId.value))
</script>

<template>
  <SeasonRow v-model="selectedId" :seasons="seasons" />
  <EpisodeRow v-if="selected" :season="selected" />
</template>
