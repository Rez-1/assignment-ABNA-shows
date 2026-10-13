import type { Page, ShowSummary } from '../../../shared/types.ts'
import { getJson } from '@/shared/api/http'

export interface SearchRequest {
  query: string
  genre?: string
  page: number
}

export function searchShows({ query, genre, page }: SearchRequest, signal?: AbortSignal): Promise<Page<ShowSummary>> {
  return getJson('/shows/search', { params: { q: query, genre, page }, signal })
}
