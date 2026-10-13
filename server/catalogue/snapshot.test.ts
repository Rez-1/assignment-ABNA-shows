import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { makeShow } from '../testing/fixtures.ts'
import { parseSnapshot, readSnapshot, writeSnapshot } from './snapshot.ts'

const createdAt = '2026-10-13T10:00:00.000Z'

describe('snapshot files', () => {
  let directory: string

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'snapshot-'))
  })

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true })
  })

  it('round-trips a snapshot through a gzipped file and leaves no temporary file', async () => {
    const path = join(directory, 'seed.json.gz')
    const snapshot = { createdAt, shows: [makeShow({ image: 'https://static.tvmaze.com/a.jpg' }), makeShow({ rating: null })] }

    await writeSnapshot(path, snapshot)

    expect(await readSnapshot(path)).toEqual(snapshot)
    expect(await readdir(directory)).toEqual(['seed.json.gz'])
  })

  it('fails clearly when the file is missing', async () => {
    await expect(readSnapshot(join(directory, 'missing.json.gz'))).rejects.toThrow()
  })
})

describe('parseSnapshot', () => {
  const withShow = (show: unknown) => JSON.stringify({ createdAt, shows: [show] })

  it('accepts well-formed data', () => {
    expect(parseSnapshot(withShow(makeShow())).shows).toHaveLength(1)
  })

  it.each([
    ['a non-object', '[]'],
    ['a missing date', JSON.stringify({ shows: [] })],
    ['an invalid date', JSON.stringify({ createdAt: 'yesterday', shows: [] })],
    ['shows that are not a list', JSON.stringify({ createdAt, shows: {} })],
    ['a show without a name', withShow({ ...makeShow(), name: undefined })],
    ['a show with a non-numeric rating', withShow({ ...makeShow(), rating: '9' })],
    ['a show with an image on another host', withShow({ ...makeShow(), image: 'https://evil.example/a.jpg' })],
    ['a show with non-string genres', withShow({ ...makeShow(), genres: [1] })],
  ])('rejects %s', (_label, json) => {
    expect(() => parseSnapshot(json)).toThrow()
  })
})
