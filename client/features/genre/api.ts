import type { Page, ShowSummary } from '../../../shared/types.ts'
import { getJson } from '@/shared/api/http'

export function fetchGenreShows(genre: string, page: number, signal?: AbortSignal): Promise<Page<ShowSummary>> {
  return getJson(`/genres/${encodeURIComponent(genre)}/shows`, { params: { page }, signal })
}
