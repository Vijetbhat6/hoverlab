/**
 * Tests for the design matcher behind the `match_design` MCP tool.
 *
 * The scenario that motivates every case here: an agent has read a Figma
 * frame and describes it in designer vocabulary. The strict catalog search
 * would return nothing for these phrasings — each test is a phrasing that
 * must NOT come back empty, plus the ranking properties that make the top
 * result trustworthy.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildGroups,
  matchDesign,
  rankCandidates,
  tokenize,
} from '../src/design.mjs'

/* ------------------------------------------------------------------ *
 *  Fixtures — catalog summaries as the list endpoints return them
 * ------------------------------------------------------------------ */

const BLOCKS = [
  {
    id: 'pricing-tiers',
    name: 'Pricing Tiers',
    level: 'block',
    category: 'Pricing',
    description: 'Three tier cards with a monthly/yearly billing toggle.',
    tags: ['pricing', 'tiers', 'toggle', 'cards'],
    featured: true,
  },
  {
    id: 'checkout-form',
    name: 'Checkout Form',
    level: 'block',
    category: 'Cart & Checkout',
    description: 'Address and payment fields with an order summary.',
    tags: ['checkout', 'form', 'payment'],
    featured: false,
  },
  {
    id: 'auth-login',
    name: 'Login Card',
    level: 'block',
    category: 'Authentication',
    description: 'Email and password form with social sign-in buttons.',
    tags: ['login', 'auth', 'form', 'social'],
    featured: false,
  },
  {
    id: 'nav-mega-menu',
    name: 'Mega Menu',
    level: 'block',
    category: 'Navigation',
    description: 'Header bar with a hover-open mega menu.',
    tags: ['navigation', 'menu', 'header'],
    featured: false,
  },
]

const PAGES = [
  {
    id: 'pricing-page',
    name: 'Pricing Page',
    level: 'page',
    category: 'Marketing Pages',
    description: 'Full pricing screen: tiers, comparison table, FAQ.',
    tags: ['pricing', 'faq', 'comparison'],
    featured: false,
  },
]

/** URL-aware fetch stub: blocks and pages endpoints answer differently. */
function stubCatalogFetch() {
  const original = globalThis.fetch
  globalThis.fetch = async (url) => {
    const body = String(url).includes('/api/v1/pages')
      ? { total: PAGES.length, pages: PAGES, categories: [] }
      : { total: BLOCKS.length, blocks: BLOCKS, categories: [] }
    return { ok: true, status: 200, text: async () => JSON.stringify(body) }
  }
  return () => {
    globalThis.fetch = original
  }
}

/* ------------------------------------------------------------------ *
 *  Tokenizing and concept building
 * ------------------------------------------------------------------ */

test('tokenize keeps the signal and drops the layout prose', () => {
  assert.deepEqual(
    tokenize('three plan cards side by side, the middle card highlighted'),
    ['plan', 'cards', 'card'],
  )
  // Deduped, lowercased, punctuation-split.
  assert.deepEqual(tokenize('Toggle! toggle TOGGLE'), ['toggle'])
  assert.deepEqual(tokenize(''), [])
  assert.deepEqual(tokenize(undefined), [])
})

test('buildGroups expands designer vocabulary and weights elements up', () => {
  const groups = buildGroups({
    description: 'navbar across the top',
    elements: ['search field'],
  })

  const navbar = groups.find((g) => g.token === 'navbar')
  assert.ok(navbar, 'navbar survives as a concept')
  assert.ok(navbar.variants.includes('navigation'), 'navbar tries "navigation"')
  assert.equal(navbar.weight, 1)

  const search = groups.find((g) => g.token === 'search')
  assert.equal(search.weight, 1.5, 'element concepts outweigh description concepts')
})

test('buildGroups does not double-count a word in both inputs', () => {
  const groups = buildGroups({
    description: 'a toggle above the cards',
    elements: ['toggle'],
  })
  assert.equal(groups.filter((g) => g.token === 'toggle').length, 1)
  // The element claimed it first, so it keeps the element weight.
  assert.equal(groups.find((g) => g.token === 'toggle').weight, 1.5)
})

/* ------------------------------------------------------------------ *
 *  Ranking
 * ------------------------------------------------------------------ */

test('a Figma-shaped phrasing the strict search would refuse still matches', () => {
  // Strict AND-search fails on this: "plan" and "monthly" match nothing
  // together with "side". Here it must surface Pricing Tiers, first.
  const groups = buildGroups({
    description: 'three plan cards side by side with a monthly yearly toggle',
  })
  const ranked = rankCandidates([...BLOCKS, ...PAGES], groups)

  assert.ok(ranked.length > 0, 'must not come back empty')
  assert.equal(ranked[0].artifact.id, 'pricing-tiers')
  assert.ok(ranked[0].matched.includes('plan'), '"plan" mapped to pricing')
  assert.ok(ranked[0].matched.includes('toggle'))
})

test('coverage beats one lucky strong word', () => {
  // "form" alone hits checkout-form and auth-login equally; the login
  // concepts must pull Login Card ahead.
  const groups = buildGroups({
    description: 'sign-in form with social buttons',
  })
  const ranked = rankCandidates(BLOCKS, groups)
  assert.equal(ranked[0].artifact.id, 'auth-login')
})

test('modal/navbar vocabulary reaches Navigation without those words in the catalog', () => {
  const groups = buildGroups({ description: 'navbar with a dropdown menu' })
  const ranked = rankCandidates(BLOCKS, groups)
  assert.equal(ranked[0].artifact.id, 'nav-mega-menu')
})

test('artifacts matching nothing are excluded, not ranked last', () => {
  const groups = buildGroups({ description: 'checkout payment fields' })
  const ranked = rankCandidates(BLOCKS, groups)
  assert.ok(ranked.every((r) => r.matched.length > 0))
  assert.ok(!ranked.some((r) => r.artifact.id === 'nav-mega-menu'))
})

test('rankCandidates respects limit and reports coverage', () => {
  const groups = buildGroups({ description: 'pricing' })
  const ranked = rankCandidates([...BLOCKS, ...PAGES], groups, { limit: 1 })
  assert.equal(ranked.length, 1)
  assert.equal(ranked[0].coverage, 1)
})

/* ------------------------------------------------------------------ *
 *  matchDesign end to end (stubbed network)
 * ------------------------------------------------------------------ */

test('matchDesign searches blocks and pages together by default', async () => {
  const restore = stubCatalogFetch()
  try {
    const { results } = await matchDesign({
      description: 'pricing screen with tier cards and an faq',
    })
    const levels = new Set(results.map((r) => r.artifact.level))
    assert.ok(levels.has('page'), 'pages searched')
    assert.ok(levels.has('block'), 'blocks searched')
    // A whole screen described → the page should win over the section.
    assert.equal(results[0].artifact.id, 'pricing-page')
  } finally {
    restore()
  }
})

test('matchDesign can be pinned to one level', async () => {
  const restore = stubCatalogFetch()
  try {
    const { results } = await matchDesign({
      description: 'pricing tier cards',
      level: 'block',
    })
    assert.ok(results.length > 0)
    assert.ok(results.every((r) => r.artifact.level === 'block'))
  } finally {
    restore()
  }
})

test('matchDesign rejects what it cannot work with, with advice', async () => {
  await assert.rejects(() => matchDesign({ description: '   ' }), /Describe the design region/)
  await assert.rejects(
    () => matchDesign({ description: 'login form', level: 'effect' }),
    /not visible in a static design/,
  )
  // All stopwords: structurally non-empty, semantically empty.
  await assert.rejects(
    () => matchDesign({ description: 'the big one on the left' }),
    /no usable words/,
  )
})
