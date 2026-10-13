import type { GenreRow } from '../../../shared/types.ts'
import { getJson } from '@/shared/api/http'

/** Every genre with its `rowSize` best-rated shows. */
export function fetchGenreRows(rowSize: number): Promise<GenreRow[]> {
  return getJson('/genres', { params: { limit: rowSize } })
}
