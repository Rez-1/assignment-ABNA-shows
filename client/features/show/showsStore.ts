import { defineStore } from 'pinia'
import type { ShowDetails } from '../../../shared/types.ts'
import { remember } from '@/shared/api/remember'
import { fetchShow } from './api'

/**
 * Details of the shows visited in this session, so going back to one (for
 * example with the browser's Back button) shows it at once.
 */
export const useShowsStore = defineStore('shows', () => {
  const visited = new Map<number, ShowDetails>()
  // The request is not tied to the screen that asked: if the user leaves early, the answer is still kept.
  const load = remember((id: number) => fetchShow(id), visited)

  return { load }
})
