import { readFile, rename, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { gunzip, gzip } from 'node:zlib'
import type { ShowSummary } from '../../shared/types.ts'
import { toImageUrl } from '../tvmaze/mappers.ts'

const gzipAsync = promisify(gzip)
const gunzipAsync = promisify(gunzip)

/** The slim copy of the TVMaze show index that the server starts from. */
export interface Snapshot {
  createdAt: string
  shows: ShowSummary[]
}

const isNullOr = (value: unknown, type: 'number' | 'string') => value === null || typeof value === type

function isShowSummary(value: unknown): value is ShowSummary {
  if (typeof value !== 'object' || value === null) return false
  const show = value as Record<string, unknown>
  return (
    // The same two rules the TVMaze mapper applies: a positive whole id and a name that is not blank.
    Number.isInteger(show.id) &&
    (show.id as number) > 0 &&
    typeof show.name === 'string' &&
    show.name.trim() !== '' &&
    Array.isArray(show.genres) &&
    show.genres.every((genre) => typeof genre === 'string') &&
    isNullOr(show.rating, 'number') &&
    typeof show.weight === 'number' &&
    (show.image === null || toImageUrl(show.image) !== null) &&
    isNullOr(show.year, 'number')
  )
}

/** Parses snapshot JSON, rejecting anything that is not exactly the shape we wrote. */
export function parseSnapshot(json: string): Snapshot {
  const data: unknown = JSON.parse(json)
  if (typeof data !== 'object' || data === null) throw new Error('Snapshot is not an object')
  const { createdAt, shows } = data as Record<string, unknown>
  if (typeof createdAt !== 'string' || Number.isNaN(Date.parse(createdAt))) {
    throw new Error('Snapshot has no valid createdAt')
  }
  if (!Array.isArray(shows) || !shows.every(isShowSummary)) throw new Error('Snapshot contains malformed shows')
  return { createdAt, shows }
}

export async function readSnapshot(path: string | URL): Promise<Snapshot> {
  const buffer = await gunzipAsync(await readFile(path))
  return parseSnapshot(buffer.toString('utf8'))
}

export async function writeSnapshot(path: string, snapshot: Snapshot): Promise<void> {
  // Write beside the target and rename, so an interrupted run never leaves half a file.
  const temporary = `${path}.tmp`
  await writeFile(temporary, await gzipAsync(JSON.stringify(snapshot), { level: 9 }))
  await rename(temporary, path)
}
