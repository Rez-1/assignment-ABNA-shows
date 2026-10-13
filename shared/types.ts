/**
 * The contract between the Express API and the Vue client.
 * These are our own models, deliberately smaller than the TVMaze payloads.
 */

export interface ShowSummary {
  id: number
  name: string
  genres: string[]
  /** Average rating from 0 to 10, or null when TVMaze has none. */
  rating: number | null
  /** TVMaze popularity score from 0 to 100; used to break rating ties. */
  weight: number
  /** Portrait poster URL, or null. */
  image: string | null
  /** Year the show premiered, or null when unknown. */
  year: number | null
}

export interface CastMember {
  id: string
  name: string
  character: string
  image: string | null
}

export interface Season {
  id: number
  number: number
  episodeCount: number | null
  premiereDate: string | null
  image: string | null
}

export interface Episode {
  id: number
  season: number
  number: number | null
  name: string
  airdate: string | null
  runtime: number | null
  rating: number | null
  image: string | null
  summary: string
}

export interface ShowDetails extends ShowSummary {
  /** Plain-text paragraphs; never HTML. */
  summary: string[]
  status: string | null
  language: string | null
  runtime: number | null
  premiered: string | null
  ended: string | null
  network: string | null
  /** For example "Sundays at 22:00". */
  schedule: string | null
  /** Only ever an http(s) URL. */
  officialSite: string | null
  /** Large poster. */
  poster: string | null
  /** Wide background artwork; many shows have none. */
  backdrop: string | null
  cast: CastMember[]
  seasons: Season[]
}

export interface GenreRow {
  genre: string
  total: number
  shows: ShowSummary[]
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

export interface ApiErrorBody {
  message: string
}
