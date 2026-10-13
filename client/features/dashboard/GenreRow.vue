<script setup lang="ts">
import type { GenreRow } from '../../../shared/types.ts'
import ShowRow from '@/shared/components/ShowRow.vue'
import { formatCount } from '@/shared/utils/format'
import { genreAnchor } from '@/shared/utils/locations'

defineProps<{ row: GenreRow }>()
</script>

<template>
  <ShowRow
    :id="genreAnchor(row.genre)"
    :title="row.genre"
    :note="formatCount(row.total, 'show')"
    :genre="row.genre"
    :shows="row.shows"
    data-test="genre-row"
  />
</template>
