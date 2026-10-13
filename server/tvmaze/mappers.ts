import type { CastMember, Episode, Season, ShowDetails, ShowSummary } from '../../shared/types.ts'

/**
 * Everything TVMaze sends is treated as untrusted input. These mappers are the
 * only place raw payloads are read; the rest of the app sees our own models.
 */

type Raw = Record<string, unknown>

const IMAGE_HOST = 'static.tvmaze.com'

const isRecord = (value: unknown): value is Raw => typeof value === 'object' && value !== null && !Array.isArray(value)
const asRecord = (value: unknown): Raw => (isRecord(value) ? value : {})
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
const asString = (value: unknown): string | null => (typeof value === 'string' && value.trim() !== '' ? value : null)
const asNumber = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null)

function parseUrl(value: unknown): URL | null {
  const text = asString(value)
  if (!text) return null
  try {
    return new URL(text)
  } catch {
    return null
  }
}

/** Keeps an image URL only when it is https on TVMaze's image host. */
export function toImageUrl(value: unknown): string | null {
  const url = parseUrl(value)
  return url && url.protocol === 'https:' && url.hostname === IMAGE_HOST ? url.href : null
}

/** Keeps a link only when it is plain http(s), so `javascript:` and friends never reach an href. */
export function toExternalUrl(value: unknown): string | null {
  const url = parseUrl(value)
  return url && (url.protocol === 'http:' || url.protocol === 'https:') ? url.href : null
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith('#')) {
      const code = entity[1]?.toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10)
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ''
    }
    return ENTITIES[entity.toLowerCase()] ?? match
  })
}

/**
 * Turns TVMaze's HTML summaries into plain-text paragraphs. The client renders
 * them as text, so nothing here needs to be a perfect sanitiser: it only has to
 * produce readable prose.
 */
export function htmlToParagraphs(html: unknown): string[] {
  const text = asString(html)
  if (!text) return []
  return text
    .split(/<\/p>|<br\s*\/?>/i)
    .map((part) => decodeEntities(part.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim())
    .filter((part) => part !== '')
}

function toYear(date: unknown): number | null {
  const year = Number(asString(date)?.slice(0, 4))
  return Number.isInteger(year) && year > 1800 ? year : null
}

function toGenres(value: unknown): string[] {
  return asArray(value).filter((genre): genre is string => typeof genre === 'string' && genre.trim() !== '')
}

/** Returns null for payloads without a usable id and name, so one bad record cannot break a page. */
export function toShowSummary(raw: unknown): ShowSummary | null {
  const show = asRecord(raw)
  const id = asNumber(show.id)
  const name = asString(show.name)
  if (id === null || !Number.isInteger(id) || id <= 0 || name === null) return null

  return {
    id,
    name,
    genres: toGenres(show.genres),
    rating: asNumber(asRecord(show.rating).average),
    weight: asNumber(show.weight) ?? 0,
    image: toImageUrl(asRecord(show.image).medium),
    year: toYear(show.premiered),
  }
}

function toSchedule(raw: unknown): string | null {
  const schedule = asRecord(raw)
  const days = asArray(schedule.days).filter((day): day is string => typeof day === 'string')
  if (days.length === 0) return null
  const time = asString(schedule.time)
  const when = days.map((day) => `${day}s`).join(', ')
  return time ? `${when} at ${time}` : when
}

function toCastMember(raw: unknown): CastMember | null {
  const entry = asRecord(raw)
  const person = asRecord(entry.person)
  const character = asRecord(entry.character)
  const name = asString(person.name)
  if (name === null) return null

  return {
    id: `${asNumber(person.id) ?? name}-${asNumber(character.id) ?? 0}`,
    name,
    character: asString(character.name) ?? '',
    image: toImageUrl(asRecord(person.image).medium) ?? toImageUrl(asRecord(character.image).medium),
  }
}

function toSeason(raw: unknown): Season | null {
  const season = asRecord(raw)
  const id = asNumber(season.id)
  const number = asNumber(season.number)
  if (id === null || number === null) return null

  return {
    id,
    number,
    episodeCount: asNumber(season.episodeOrder),
    premiereDate: asString(season.premiereDate),
    image: toImageUrl(asRecord(season.image).medium),
  }
}

function toBackdrop(images: unknown): string | null {
  for (const raw of asArray(images)) {
    const image = asRecord(raw)
    if (image.type !== 'background') continue
    const url = toImageUrl(asRecord(asRecord(image.resolutions).original).url)
    if (url) return url
  }
  return null
}

export function toShowDetails(raw: unknown): ShowDetails | null {
  const summary = toShowSummary(raw)
  if (!summary) return null
  const show = asRecord(raw)
  const embedded = asRecord(show._embedded)
  const channel = asRecord(show.network ?? show.webChannel)

  return {
    ...summary,
    summary: htmlToParagraphs(show.summary),
    status: asString(show.status),
    language: asString(show.language),
    runtime: asNumber(show.runtime) ?? asNumber(show.averageRuntime),
    premiered: asString(show.premiered),
    ended: asString(show.ended),
    network: asString(channel.name),
    schedule: toSchedule(show.schedule),
    officialSite: toExternalUrl(show.officialSite),
    poster: toImageUrl(asRecord(show.image).original),
    backdrop: toBackdrop(embedded.images),
    cast: asArray(embedded.cast).map(toCastMember).filter((member) => member !== null),
    seasons: asArray(embedded.seasons).map(toSeason).filter((season) => season !== null),
  }
}

export function toEpisode(raw: unknown): Episode | null {
  const episode = asRecord(raw)
  const id = asNumber(episode.id)
  const season = asNumber(episode.season)
  if (id === null || season === null) return null

  return {
    id,
    season,
    number: asNumber(episode.number),
    name: asString(episode.name) ?? 'Untitled episode',
    airdate: asString(episode.airdate),
    runtime: asNumber(episode.runtime),
    rating: asNumber(asRecord(episode.rating).average),
    image: toImageUrl(asRecord(episode.image).medium),
    summary: htmlToParagraphs(episode.summary).join(' '),
  }
}
