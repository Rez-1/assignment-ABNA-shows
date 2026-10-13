import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { GenreRow } from '../../../shared/types.ts'
import { fetchGenreRows } from './api'

/**
 * The dashboard's genre rows. They live in a store because they outlive the
 * screen: coming back to the dashboard shows them instantly, and other screens
 * use the genre names (for example to filter search results).
 */
export const useGenresStore = defineStore('genres', () => {
  const rows = ref<GenreRow[]>([])
  const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
  const errorMessage = ref('')

  const genreNames = computed(() => rows.value.map((row) => row.genre))

  async function load() {
    status.value = 'loading'
    try {
      rows.value = await fetchGenreRows()
      status.value = 'success'
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Something went wrong'
      status.value = 'error'
    }
  }

  /** Loads the rows unless they are already here or on their way. */
  async function ensureLoaded() {
    if (status.value === 'idle' || status.value === 'error') await load()
  }

  return { rows, status, errorMessage, genreNames, load, ensureLoaded }
})
