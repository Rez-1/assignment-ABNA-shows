import { defineStore } from 'pinia'
import { computed, type ComputedRef } from 'vue'
import { GENRE_ROW_SIZE } from '../../../shared/limits.ts'
import type { GenreRow } from '../../../shared/types.ts'
import { remember } from '@/shared/api/remember'
import { type AsyncResource, useAsyncResource } from '@/shared/composables/useAsyncResource'
import { fetchGenreRows } from './api'

/**
 * The dashboard's genre rows. They live in a store because they outlive the
 * screen: coming back to the dashboard shows them instantly, and other screens
 * use the genre names (for example to filter search results).
 */
export const useGenresStore = defineStore('genres', () => {
  // One key: there is a single set of rows.
  const rowsBySize = new Map<number, GenreRow[]>()
  const load = remember(fetchGenreRows, rowsBySize)

  return { load }
})

/** The genre rows for a screen: asked for once, then shared by every screen that uses them. */
export function useGenreRows(): AsyncResource<GenreRow[]> & { genreNames: ComputedRef<string[]> } {
  const { load } = useGenresStore()
  const resource = useAsyncResource(() => GENRE_ROW_SIZE, load)
  const genreNames = computed(() => (resource.data.value ?? []).map((row) => row.genre))

  return { ...resource, genreNames }
}
