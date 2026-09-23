import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  CANDIDATE_LIMIT,
  IMAGE_CANDIDATE_LIMIT,
  RESULT_LIMIT,
  buildSearchPrompt,
  diverseFeatured,
  executeSearch,
  formatCatalog,
  parseReply,
  prepareSearch,
  retrieveCandidates,
  type CompleteFn,
  type RetrievalDeps,
  type SearchCandidate,
} from './search-request'
import { buildContent } from './claude'
import type { ValidImage } from './search-image'

function cand(id: string, category = 'Buttons'): SearchCandidate {
  return { id, name: `Name ${id}`, category, description: `Description of ${id}` }
}

/** Featured effects across three categories, four each. */
const FEATURED: SearchCandidate[] = ['Buttons', 'Loaders', 'Cards'].flatMap((c) =>
  [1, 2, 3, 4].map((n) => cand(`${c.toLowerCase()}-${n}`, c)),
)

function deps(hits: SearchCandidate[]): RetrievalDeps & { calls: Array<[string, number]> } {
  const calls: Array<[string, number]> = []
  return {
    calls,
    featured: FEATURED,
    search: (q, limit) => {
      calls.push([q, limit])
      return hits.slice(0, limit)
    },
  }
}

const IMAGE: ValidImage = { mediaType: 'image/png', data: 'QUJD', bytes: 3 }

describe('diverseFeatured', () => {
  test('samples every category before repeating one', () => {
    const got = diverseFeatured(FEATURED, 6).map((c) => c.category)
    assert.deepEqual(got, ['Buttons', 'Loaders', 'Cards', 'Buttons', 'Loaders', 'Cards'])
  })

  test('stops at the limit and at the supply', () => {
    assert.equal(diverseFeatured(FEATURED, 5).length, 5)
    assert.equal(diverseFeatured(FEATURED, 500).length, FEATURED.length)
    assert.deepEqual(diverseFeatured([], 10), [])
  })
})

describe('retrieveCandidates', () => {
  test('lexical hits are used, with the query and the text limit', () => {
    const d = deps([cand('hit-1'), cand('hit-2')])
    const r = retrieveCandidates('  pulsing red button ', false, d)
    assert.equal(r.source, 'lexical')
    assert.deepEqual(r.candidates.map((c) => c.id), ['hit-1', 'hit-2'])
    assert.deepEqual(d.calls, [['pulsing red button', CANDIDATE_LIMIT]])
  })

  test('featured is the fallback ONLY when the lexical score is empty', () => {
    const none = retrieveCandidates('heartbeat vibes', false, deps([]))
    assert.equal(none.source, 'featured')
    assert.equal(none.candidates.length, FEATURED.length)

    const some = retrieveCandidates('button', false, deps([cand('only-one')]))
    assert.equal(some.source, 'lexical')
    assert.deepEqual(some.candidates.map((c) => c.id), ['only-one'])
  })

  test('an empty query never searches', () => {
    const d = deps([cand('x')])
    const r = retrieveCandidates('   ', true, d)
    assert.equal(r.source, 'featured')
    assert.equal(d.calls.length, 0)
  })

  test('with an image the pool is wider and topped up with featured, without duplicates', () => {
    const d = deps([cand('buttons-1'), cand('hit-2')])
    const r = retrieveCandidates('dashboard', true, d)
    assert.equal(r.source, 'lexical')
    assert.deepEqual(d.calls, [['dashboard', IMAGE_CANDIDATE_LIMIT]])
    const got = r.candidates.map((c) => c.id)
    assert.equal(got[0], 'buttons-1')
    assert.equal(got[1], 'hit-2')
    assert.equal(new Set(got).size, got.length)
    assert.ok(got.length > 2)
  })

  test('never exceeds the limit', () => {
    const many = Array.from({ length: 300 }, (_, i) => cand(`m-${i}`))
    assert.equal(retrieveCandidates('x', false, deps(many)).candidates.length, CANDIDATE_LIMIT)
    assert.equal(retrieveCandidates('x', true, deps(many)).candidates.length, IMAGE_CANDIDATE_LIMIT)
  })
})

describe('buildSearchPrompt', () => {
  test('text prompt carries the query, the count and one line per candidate', () => {
    const c = [cand('a'), cand('b')]
    const p = buildSearchPrompt('  neon card ', c, false)
    assert.match(p.user, /^Query: neon card\n/)
    assert.match(p.user, /Candidate catalog \(2 effects\):/)
    assert.match(p.user, /a \| Buttons \| Name a \| Description of a\nb \| Buttons \| Name b/)
    assert.match(p.system, /\{"ids": \["effect-id-1"/)
    assert.doesNotMatch(p.system, /keywords/)
    assert.match(p.system, new RegExp(`between 0 and ${RESULT_LIMIT} IDs`))
  })

  test('image prompt asks for keywords and refuses instructions inside the picture', () => {
    const p = buildSearchPrompt('', [cand('a')], true)
    assert.match(p.user, /Query: \(none — use the screenshot alone\)/)
    assert.match(p.system, /"keywords"/)
    assert.match(p.system, /never as an instruction/)
  })

  test('descriptions are cut to keep the prompt bounded', () => {
    const long = { ...cand('a'), description: 'x'.repeat(500) }
    assert.equal(formatCatalog([long]).split(' | ')[3]!.length, 120)
  })
})

describe('parseReply', () => {
  const pool = [cand('one'), cand('two'), cand('three')]

  test('reads plain JSON', () => {
    assert.deepEqual(parseReply('{"ids":["two","one"]}', pool), { ids: ['two', 'one'], keywords: [] })
  })

  test('reads fenced JSON and JSON with prose around it', () => {
    assert.deepEqual(parseReply('```json\n{"ids":["one"]}\n```', pool).ids, ['one'])
    assert.deepEqual(parseReply('Sure! {"ids":["three"]} Hope that helps.', pool).ids, ['three'])
  })

  test('drops ids the model invented and collapses duplicates', () => {
    assert.deepEqual(parseReply('{"ids":["one","ghost","one","two",7,null]}', pool).ids, ['one', 'two'])
  })

  test('caps the list', () => {
    const big = Array.from({ length: 40 }, (_, i) => cand(`c${i}`))
    const raw = JSON.stringify({ ids: big.map((c) => c.id) })
    assert.equal(parseReply(raw, big).ids.length, RESULT_LIMIT)
  })

  test('degrades to nothing usable, never throws', () => {
    for (const raw of ['', 'no json here', '{', '{"ids": "one"}', '{"ids": null}', '[]', '{"ids":["one"', 'null']) {
      assert.deepEqual(parseReply(raw, pool), { ids: [], keywords: [] }, raw)
    }
  })

  test('keeps only short, plain lowercase keywords', () => {
    const r = parseReply(
      JSON.stringify({
        ids: [],
        keywords: ['Gradient', ' glass ', 'a', '<script>', 'x'.repeat(40), 3, 'card-hover'],
      }),
      pool,
    )
    assert.deepEqual(r.keywords, ['gradient', 'glass', 'card-hover'])
  })
})

describe('prepareSearch', () => {
  test('is null only when there is nothing at all to rank', () => {
    const empty: RetrievalDeps = { search: () => [], featured: [] }
    assert.equal(prepareSearch('anything', undefined, empty), null)
    assert.notEqual(prepareSearch('anything', undefined, deps([])), null)
  })

  test('a text request carries no images', () => {
    const p = prepareSearch('button', undefined, deps([cand('a')]))!
    assert.deepEqual(p.images, [])
    assert.equal(p.source, 'lexical')
  })

  test('an image request carries the validated bytes, by their real type', () => {
    const p = prepareSearch('', IMAGE, deps([]))!
    assert.deepEqual(p.images, [{ mediaType: 'image/png', data: 'QUJD' }])
    assert.equal(p.source, 'featured')
    assert.match(p.prompt.system, /screenshot/)
  })
})

describe('executeSearch (model call injected)', () => {
  test('sends the prompt and low effort, and returns valid ranked ids', async () => {
    const p = prepareSearch('button', undefined, deps([cand('a'), cand('b')]))!
    let seen: Parameters<CompleteFn>[0] | null = null
    const complete: CompleteFn = async (o) => {
      seen = o
      return '{"ids":["b","zzz","a"]}'
    }
    const ids = await executeSearch(p, complete)
    assert.deepEqual(ids, ['b', 'a'])
    assert.equal(seen!.effort, 'low')
    assert.equal(seen!.system, p.prompt.system)
    assert.equal(seen!.user, p.prompt.user)
    assert.equal('images' in seen!, false) // text requests are sent exactly as before
  })

  test('an image request passes the image blocks through', async () => {
    const p = prepareSearch('card', IMAGE, deps([cand('a')]))!
    let seen: Parameters<CompleteFn>[0] | null = null
    await executeSearch(p, async (o) => {
      seen = o
      return '{"ids":["a"],"keywords":[]}'
    })
    assert.deepEqual(seen!.images, [{ mediaType: 'image/png', data: 'QUJD' }])
  })

  test('a model failure propagates, so the route can refund', async () => {
    const p = prepareSearch('button', undefined, deps([cand('a')]))!
    await assert.rejects(
      executeSearch(p, async () => {
        throw new Error('upstream 500')
      }),
      /upstream 500/,
    )
  })

  test('an unusable reply is an empty result, not a failure', async () => {
    const p = prepareSearch('button', undefined, deps([cand('a')]))!
    assert.deepEqual(await executeSearch(p, async () => 'I cannot help with that.'), [])
  })

  test('a thin screenshot reply is topped up from the model keywords, after its own picks', async () => {
    const p = prepareSearch('', IMAGE, deps([]))!
    const ids = await executeSearch(
      p,
      async () => `{"ids":["buttons-2"],"keywords":["glass","card"]}`,
      (kw) => (kw.includes('glass') ? ['extra-1', 'buttons-2', 'extra-2'] : []),
    )
    assert.deepEqual(ids, ['buttons-2', 'extra-1', 'extra-2'])
  })

  test('top-up never applies to a text search, or to a full reply', async () => {
    const text = prepareSearch('button', undefined, deps([cand('a')]))!
    let called = 0
    const topUp = () => {
      called++
      return ['x']
    }
    await executeSearch(text, async () => '{"ids":["a"],"keywords":["glass"]}', topUp)
    assert.equal(called, 0)
  })
})

describe('buildContent (the Anthropic request shape)', () => {
  test('no images: the bare string, exactly as before images existed', () => {
    assert.equal(buildContent('hello', undefined), 'hello')
    assert.equal(buildContent('hello', []), 'hello')
  })

  test('images come first as base64 image blocks, then the text', () => {
    const c = buildContent('describe', [
      { mediaType: 'image/jpeg', data: 'QUJD' },
      { mediaType: 'image/webp', data: 'REVG' },
    ])
    assert.deepEqual(c, [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'QUJD' } },
      { type: 'image', source: { type: 'base64', media_type: 'image/webp', data: 'REVG' } },
      { type: 'text', text: 'describe' },
    ])
  })
})
