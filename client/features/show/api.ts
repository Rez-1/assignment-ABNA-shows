import type { Episode, ShowDetails } from '../../../shared/types.ts'
import { getJson } from '@/shared/api/http'

export function fetchShow(id: number, signal?: AbortSignal): Promise<ShowDetails> {
  return getJson(`/shows/${id}`, { signal })
}

export function fetchSeasonEpisodes(seasonId: number, signal?: AbortSignal): Promise<Episode[]> {
  return getJson(`/seasons/${seasonId}/episodes`, { signal })
}
