import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import {
  parseRegistrySearch,
  searchRegistryItems,
  type SearchableItem,
} from './search'

/**
 * The shadcn dynamic-search contract, checked field by field.
 *
 * The failure mode this guards is not "search returns odd results" — it is
 * "the CLI silently stops trusting the pagination object and downloads the
 * whole 377 KB index anyway", which looks exactly like success from here.
 * So the shape assertions matter as much as the ranking ones.
 */

const ITEMS: SearchableItem[] = [
  { name: 'hoverlab', type: 'registry:base', title: 'Hoverlab', description: 'The design system.' },
  {
    name: 'hero-split',
    type: 'registry:block',
    title: 'Split Hero',
    description: 'A hero with copy on one side and a screenshot on the other.',
    categories: ['Hero'],
  },
  {
    name: 'hero-centered',
    type: 'registry:block',
    title: 'Centered Hero',
    description: 'A centered hero section.',
    categories: ['Hero'],
  },
  {
    name: 'pricing-tiers',
    type: 'registry:block',
    title: 'Pricing Tiers',
    description: 'Three plans side by side.',
    categories: ['Pricing'],
  },
  {
    name: 'saas-landing-page',
    type: 'registry:page',
    title: 'SaaS Landing Page',
    description: 'A full landing route composed of hero, pricing and FAQ blocks.',
    categories: ['Marketing'],
  },
  {
    name: 'btn-gradient',
    type: 'registry:item',
    title: 'Gradient Button',
    description: 'A button with a gradient hover fill.',
    categories: ['Buttons'],
  },
]

function search(query: string, extra: Partial<ReturnType<typeof parseRegistrySearch>> = {}) {
  return searchRegistryItems(ITEMS, {
    q: query,
    types: [],
    limit: 50,
    offset: 0,
    requested: true,
    ...extra,
  })
}

/* -- params ------------------------------------------------------------- */

test('a bare registry.json is not a search request', () => {
  const params = parseRegistrySearch(new URL('https://hoverlab.dev/registry.json'))
  assert.equal(params.requested, false)
})

test('any one of the four params makes it a search request', () => {
  for (const query of ['?q=hero', '?type=registry:block', '?limit=10', '?offset=5']) {
    const params = parseRegistrySearch(new URL(`https://hoverlab.dev/registry.json${query}`))
    assert.equal(params.requested, true, `${query} should count as a search`)
  }
})

test('an empty q still counts as a search — the CLI sends it', () => {
  // `?q=` with nothing after it is a cleared search box, not "no search".
  // Answering with the full 1,211-item document would be the exact
  // download this feature exists to avoid.
  const params = parseRegistrySearch(new URL('https://hoverlab.dev/registry.json?q='))
  assert.equal(params.requested, true)
  assert.equal(params.q, '')
})

test('type is split on commas, as the CLI sends it', () => {
  const params = parseRegistrySearch(
    new URL('https://hoverlab.dev/registry.json?type=registry:block,registry:page'),
  )
  assert.deepEqual(params.types, ['registry:block', 'registry:page'])
})

test('limit and offset are clamped rather than trusted', () => {
  const params = parseRegistrySearch(
    new URL('https://hoverlab.dev/registry.json?limit=999999&offset=-4'),
  )
  assert.equal(params.limit, 1000)
  assert.equal(params.offset, 0)
})

test('garbage limit falls back to the default rather than to zero', () => {
  const params = parseRegistrySearch(new URL('https://hoverlab.dev/registry.json?limit=banana'))
  assert.equal(params.limit, 50)
})

/* -- ranking ------------------------------------------------------------ */

test('an exact name wins', () => {
  assert.equal(search('hero-split').items[0].name, 'hero-split')
})

test('spaces and hyphens are the same query', () => {
  assert.equal(search('hero split').items[0].name, 'hero-split')
})

test('every term must match — a two-word query does not fall back to either', () => {
  // "pricing" matches two items and "gradient" matches one, but nothing
  // matches both. An OR search would answer this with three items and rank
  // whichever it liked first.
  assert.equal(search('pricing gradient').items.length, 0)
})

test('a name hit outranks a description hit', () => {
  // `saas-landing-page` mentions pricing in its description; the block
  // named for it is the answer.
  assert.equal(search('pricing').items[0].name, 'pricing-tiers')
})

test('search is case-insensitive', () => {
  assert.equal(search('HERO Split').items[0].name, 'hero-split')
})

test('no query returns the index in its own order, base first', () => {
  const { items } = search('')
  assert.equal(items[0].name, 'hoverlab')
  assert.equal(items.length, ITEMS.length)
})

/* -- filtering and paging ----------------------------------------------- */

test('type narrows to those types only', () => {
  const { items, pagination } = search('', { types: ['registry:block'] })
  assert.equal(items.length, 3)
  assert.equal(pagination.total, 3)
  assert.ok(items.every((item) => item.type === 'registry:block'))
})

test('type and q compose', () => {
  const { items } = search('hero', { types: ['registry:page'] })
  assert.deepEqual(
    items.map((item) => item.name),
    ['saas-landing-page'],
  )
})

test('pagination reports the full match count, not the page size', () => {
  const { items, pagination } = search('', { limit: 2 })
  assert.equal(items.length, 2)
  assert.equal(pagination.total, ITEMS.length)
  assert.equal(pagination.limit, 2)
  assert.equal(pagination.offset, 0)
  assert.equal(pagination.hasMore, true)
})

test('the last page reports hasMore false', () => {
  const { items, pagination } = search('', { limit: 2, offset: 4 })
  assert.equal(items.length, 2)
  assert.equal(pagination.hasMore, false)
})

test('an offset past the end is empty rather than an error', () => {
  const { items, pagination } = search('', { offset: 500 })
  assert.equal(items.length, 0)
  assert.equal(pagination.total, ITEMS.length)
  // hasMore must be false here. True would send a CLI paging forever.
  assert.equal(pagination.hasMore, false)
})

test('paging through covers every item exactly once', () => {
  const seen: string[] = []
  for (let offset = 0; offset < ITEMS.length; offset += 2) {
    seen.push(...search('', { limit: 2, offset }).items.map((item) => item.name))
  }
  assert.deepEqual(seen, ITEMS.map((item) => item.name))
})

test('an unknown type matches nothing rather than everything', () => {
  const { items, pagination } = search('', { types: ['registry:nonsense'] })
  assert.equal(items.length, 0)
  assert.equal(pagination.total, 0)
})
