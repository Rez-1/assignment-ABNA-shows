import { describe, expect, it } from 'vitest'
import { htmlToParagraphs, toEpisode, toExternalUrl, toImageUrl, toShowDetails, toShowSummary } from './mappers.ts'

const rawShow = {
  id: 169,
  name: 'Breaking Bad',
  genres: ['Drama', 'Crime', 'Thriller'],
  status: 'Ended',
  language: 'English',
  runtime: 60,
  premiered: '2008-01-20',
  ended: '2013-09-29',
  officialSite: 'http://www.amc.com/shows/breaking-bad',
  schedule: { time: '22:00', days: ['Sunday'] },
  rating: { average: 9.2 },
  weight: 99,
  network: { name: 'AMC' },
  image: {
    medium: 'https://static.tvmaze.com/uploads/images/medium_portrait/501/1253519.jpg',
    original: 'https://static.tvmaze.com/uploads/images/original_untouched/501/1253519.jpg',
  },
  summary: '<p><b>Breaking Bad</b> follows Walter White.</p><p>He teaches chemistry &amp; cooks.</p>',
}

describe('toImageUrl', () => {
  it('keeps https images on the TVMaze image host', () => {
    expect(toImageUrl('https://static.tvmaze.com/a.jpg')).toBe('https://static.tvmaze.com/a.jpg')
  })

  it.each(['http://static.tvmaze.com/a.jpg', 'https://evil.example/a.jpg', 'javascript:alert(1)', 'nonsense', null, 42])(
    'drops %s',
    (value) => {
      expect(toImageUrl(value)).toBeNull()
    },
  )
})

describe('toExternalUrl', () => {
  it('keeps http and https links', () => {
    expect(toExternalUrl('https://example.com/show')).toBe('https://example.com/show')
    expect(toExternalUrl('http://example.com/')).toBe('http://example.com/')
  })

  it.each(['javascript:alert(1)', 'data:text/html,<script>1</script>', 'ftp://example.com', '/relative', ''])(
    'drops %s',
    (value) => {
      expect(toExternalUrl(value)).toBeNull()
    },
  )
})

describe('htmlToParagraphs', () => {
  it('splits paragraphs, strips tags and decodes entities', () => {
    expect(htmlToParagraphs('<p>One <b>bold</b> &amp; &#39;quoted&#39;</p><p>Two<br>Three</p>')).toEqual([
      "One bold & 'quoted'",
      'Two',
      'Three',
    ])
  })

  it('leaves no markup behind for script payloads', () => {
    const [text] = htmlToParagraphs('<p>Hi<script>alert(1)</script><img src=x onerror=alert(1)></p>')
    expect(text).toBe('Hialert(1)')
  })

  it('returns nothing for missing summaries', () => {
    expect(htmlToParagraphs(null)).toEqual([])
    expect(htmlToParagraphs('   ')).toEqual([])
  })
})

describe('toShowSummary', () => {
  it('maps a TVMaze show to the slim model', () => {
    expect(toShowSummary(rawShow)).toEqual({
      id: 169,
      name: 'Breaking Bad',
      genres: ['Drama', 'Crime', 'Thriller'],
      rating: 9.2,
      weight: 99,
      image: 'https://static.tvmaze.com/uploads/images/medium_portrait/501/1253519.jpg',
      year: 2008,
    })
  })

  it('tolerates missing optional data', () => {
    expect(toShowSummary({ id: 5, name: 'Bare' })).toEqual({
      id: 5,
      name: 'Bare',
      genres: [],
      rating: null,
      weight: 0,
      image: null,
      year: null,
    })
  })

  it.each([null, 'text', {}, { id: 1 }, { name: 'No id' }, { id: -1, name: 'Negative' }])('rejects %j', (raw) => {
    expect(toShowSummary(raw)).toBeNull()
  })
})

describe('toShowDetails', () => {
  it('maps facts, cast, seasons and backdrop', () => {
    const details = toShowDetails({
      ...rawShow,
      _embedded: {
        cast: [
          {
            person: { id: 1, name: 'Bryan Cranston', image: { medium: 'https://static.tvmaze.com/p.jpg' } },
            character: { id: 2, name: 'Walter White' },
          },
          { person: {}, character: { name: 'Nobody' } },
        ],
        seasons: [{ id: 753, number: 1, episodeOrder: 7, premiereDate: '2008-01-20', image: null }],
        images: [
          { type: 'poster', resolutions: { original: { url: 'https://static.tvmaze.com/poster.jpg' } } },
          { type: 'background', resolutions: { original: { url: 'https://static.tvmaze.com/bg.jpg' } } },
        ],
      },
    })

    expect(details).toMatchObject({
      id: 169,
      summary: ['Breaking Bad follows Walter White.', 'He teaches chemistry & cooks.'],
      status: 'Ended',
      network: 'AMC',
      schedule: 'Sundays at 22:00',
      officialSite: 'http://www.amc.com/shows/breaking-bad',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/501/1253519.jpg',
      backdrop: 'https://static.tvmaze.com/bg.jpg',
      cast: [{ id: '1-2', name: 'Bryan Cranston', character: 'Walter White', image: 'https://static.tvmaze.com/p.jpg' }],
      seasons: [{ id: 753, number: 1, episodeCount: 7, premiereDate: '2008-01-20', image: null }],
    })
  })

  it('drops an unsafe official site and copes without embedded data', () => {
    const details = toShowDetails({ ...rawShow, officialSite: 'javascript:alert(1)', network: null, webChannel: { name: 'Netflix' } })

    expect(details).toMatchObject({ officialSite: null, network: 'Netflix', backdrop: null, cast: [], seasons: [] })
  })
})

describe('toEpisode', () => {
  it('maps an episode with a plain-text summary', () => {
    expect(
      toEpisode({
        id: 1,
        season: 1,
        number: 1,
        name: 'Pilot',
        airdate: '2013-06-24',
        runtime: 60,
        rating: { average: 7 },
        image: { medium: 'https://static.tvmaze.com/e.jpg' },
        summary: '<p>It <i>begins</i>.</p>',
      }),
    ).toEqual({
      id: 1,
      season: 1,
      number: 1,
      name: 'Pilot',
      airdate: '2013-06-24',
      runtime: 60,
      rating: 7,
      image: 'https://static.tvmaze.com/e.jpg',
      summary: 'It begins.',
    })
  })

  it('rejects payloads without an id', () => {
    expect(toEpisode({ name: 'Lost' })).toBeNull()
  })
})
