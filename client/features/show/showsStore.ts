import { defineStore } from 'pinia'
import type { ShowDetails } from '../../../shared/types.ts'
import { fetchShow } from './api'

/**
 * Details of the shows visited in this session, so going back to one (for
 * example with the browser's Back button) shows it at once.
 */
export const useShowsStore = defineStore('shows', () => {
  const visited = new Map<number, ShowDetails>()

  async function load(id: number, signal?: AbortSignal): Promise<ShowDetails> {
    const known = visited.get(id)
    if (known) return known

    const show = await fetchShow(id, signal)
    visited.set(id, show)
    return show
  }

  return { load }
})
