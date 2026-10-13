import { computed, type ComputedRef } from 'vue'
import { GENRE_ROW_SIZE } from '../../../shared/limits.ts'
import type { GenreRow } from '../../../shared/types.ts'
import { useRemembered } from '@/shared/api/remember'
import { type AsyncResource, useAsyncResource } from '@/shared/composables/useAsyncResource'
import { fetchGenreRows } from './api'

/**
 * The dashboard's genre rows. They are remembered because they outlive the
 * screen: coming back to the dashboard shows them instantly, and other screens
 * use the genre names (for example to filter search results).
 */
export function useGenreRows(): AsyncResource<GenreRow[]> & { genreNames: ComputedRef<string[]> } {
  const resource = useAsyncResource(() => GENRE_ROW_SIZE, useRemembered(fetchGenreRows))
  const genreNames = computed(() => (resource.data.value ?? []).map((row) => row.genre))

  return { ...resource, genreNames }
}
