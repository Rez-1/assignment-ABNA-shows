import type { GenreRow } from '../../../shared/types.ts'
import { getJson } from '@/shared/api/http'

/** How many shows each genre row on the dashboard holds. */
export const ROW_SIZE = 20

export function fetchGenreRows(): Promise<GenreRow[]> {
  return getJson('/genres', { params: { limit: ROW_SIZE } })
}
