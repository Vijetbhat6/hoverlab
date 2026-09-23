import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  createSearchIndex,
  editDistance,
  matchedIndices,
  maxEditsFor,
  search,
  stem,
  synonymsFor,
  tokenize,
  type SearchDoc,
} from './engine'

/**
 * A small fixed catalog, so ranking assertions do not shift when the real one
 * grows. Names and words are chosen to set traps: "card"/"cart" are one edit
 * apart, "tab"/"tag" are one edit apart at three letters, and "ghost"/"host"
 * differ only in the first letter.
 */
function doc(
  id: string,
  name: string,
  extra: Partial<SearchDoc> = {},
): SearchDoc {
  return {
    id,
    name,
    category: 'Misc',
    description: '',
    tags: [],
    ...extra,
  }
}

const DOCS: SearchDoc[] = [
  doc('gradient-shift-button', 'Gradient Shift Button', { category: 'Buttons', tags: ['gradient', 'hover'] }),
  doc('neon-glow-button', 'Neon Glow Button', { category: 'Buttons', tags: ['neon', 'glow'] }),
  doc('glassmorphism-card', 'Glassmorphism Card', { category: 'Cards', tags: ['glass', 'blur'] }),
  doc('cart-summary', 'Cart Summary', { category: 'Commerce', description: 'Shopping cart totals' }),
  doc('tag-cloud', 'Tag Cloud', { category: 'Badges & Tags' }),
  doc('tab-bar', 'Tab Bar', { category: 'Navigation & Menus', tags: ['nav'] }),
  doc('ghost-button', 'Ghost Button', { category: 'Buttons' }),
  doc('host-badge', 'Host Badge', { category: 'Badges & Tags' }),
  doc('spinner-ring', 'Ring Spinner', { category: 'Loaders' }),
  doc('skeleton-card', 'Skeleton Card', { category: 'Skeletons & Shimmers' }),
  doc('toggle-switch', 'Toggle Switch', { category: 'Toggles & Switches' }),
  doc('pricing-table', 'Pricing Table', { category: 'Pricing', description: 'Compare plans side by side' }),
  doc('desc-only', 'Plain Box', { description: 'A box that pulses gently with a red glow' }),
  doc('navbar-sticky', 'Sticky Navbar', { category: 'Navigation & Menus' }),
]

const index = createSearchIndex(DOCS)
const ids = (q: string, opts?: Parameters<typeof search<SearchDoc>>[2]) =>
  search(index, q, opts).map((h) => h.doc.id)

describe('tokenize and stem', () => {
  test('lowercases, drops punctuation and diacritics', () => {
    assert.deepEqual(tokenize('Inputs & Hover'), ['inputs', 'hover'])
    assert.deepEqual(tokenize('Café-Style  3D'), ['cafe', 'style', '3d'])
  })

  test('collapses regular plurals and leaves non-plurals alone', () => {
    assert.equal(stem('buttons'), 'button')
    assert.equal(stem('gradients'), 'gradient')
    assert.equal(stem('libraries'), 'library')
    for (const w of ['glass', 'focus', 'radius', 'analysis', 'css']) assert.equal(stem(w), w)
  })
})

describe('editDistance', () => {
  test('counts insert, delete, substitute and a swap as one edit each', () => {
    assert.equal(editDistance('button', 'buton', 2), 1)
    assert.equal(editDistance('gradient', 'gradiant', 2), 1)
    assert.equal(editDistance('button', 'buttno', 2), 1) // transposition
    assert.equal(editDistance('abc', 'abc', 2), 0)
  })

  test('reports "too far" as max + 1 rather than the true distance', () => {
    assert.equal(editDistance('button', 'banner', 1), 2)
    assert.equal(editDistance('a', 'abcdef', 2), 3)
  })

  test('the budget is 0 under four characters, 1 for four to seven, 2 from eight', () => {
    assert.equal(maxEditsFor(3), 0)
    assert.equal(maxEditsFor(4), 1)
    assert.equal(maxEditsFor(7), 1)
    assert.equal(maxEditsFor(8), 2)
  })
})

describe('typo tolerance', () => {
  test("'buton' finds the buttons", () => {
    const found = ids('buton')
    assert.ok(found.includes('gradient-shift-button'))
    assert.ok(found.includes('ghost-button'))
  })

  test("'gradiant' finds gradient effects", () => {
    assert.ok(ids('gradiant').includes('gradient-shift-button'))
  })

  test("'glasmorphism' finds glassmorphism (two-edit budget at 12 characters)", () => {
    assert.equal(ids('glasmorphism')[0], 'glassmorphism-card')
  })

  test('a word that exists is never corrected: card does not offer cart', () => {
    const found = ids('card')
    assert.ok(found.includes('glassmorphism-card'))
    assert.ok(!found.includes('cart-summary'))
  })
})

describe('no false positives on short words', () => {
  test('three-letter words get no edits: tab does not match tag', () => {
    // "tab" is a prefix of "table", which is fine while typing; what it must
    // not do is reach across to "tag" on an edit.
    assert.ok(ids('tab').includes('tab-bar'))
    assert.ok(!ids('tab').includes('tag-cloud'))
    assert.ok(ids('tag').includes('tag-cloud'))
    assert.ok(!ids('tag').includes('tab-bar'))
  })

  test('a typo needs the same first letter: ghost does not match host', () => {
    assert.deepEqual(ids('hosst'), ['host-badge'])
    assert.ok(!ids('ghost').includes('host-badge'))
  })

  test('nothing matches a nonsense word', () => {
    assert.deepEqual(ids('zzzqx'), [])
    assert.deepEqual(ids('xq'), [])
  })
})

describe('prefix matching', () => {
  test('the last word is a prefix while it is being typed', () => {
    assert.ok(ids('butt').includes('neon-glow-button'))
    assert.ok(ids('glass').includes('glassmorphism-card'))
  })

  test('a plural is a plural, not a prefix: tabs is not table-shaped', () => {
    assert.deepEqual(ids('tabs'), ['tab-bar'])
  })
})

describe('synonyms', () => {
  test('the table holds the curated sets and nothing invented', () => {
    assert.ok(synonymsFor('btn').includes('button'))
    assert.ok(synonymsFor('nav').includes('navbar'))
    assert.ok(synonymsFor('toggle').includes('switch'))
    assert.ok(synonymsFor('modal').includes('dialog'))
    assert.deepEqual(synonymsFor('hero'), [])
    assert.deepEqual(synonymsFor('card'), [])
  })

  test('btn reaches buttons that never say btn', () => {
    assert.ok(ids('btn').includes('neon-glow-button'))
  })

  test('nav reaches navbar and navigation', () => {
    const found = ids('nav')
    assert.ok(found.includes('navbar-sticky'))
    assert.ok(found.includes('tab-bar'))
  })

  test('spinner reaches loader-family words, ranked below the exact match', () => {
    const found = ids('spinner')
    assert.equal(found[0], 'spinner-ring')
    assert.ok(found.includes('skeleton-card'))
    assert.ok(found.indexOf('spinner-ring') < found.indexOf('skeleton-card'))
  })

  test('switching synonyms off removes the expansion', () => {
    assert.ok(!ids('btn', { synonyms: false }).includes('neon-glow-button'))
  })
})

describe('ranking', () => {
  test('a name match beats a description match', () => {
    const found = ids('glow')
    assert.equal(found[0], 'neon-glow-button')
    assert.ok(found.includes('desc-only'))
    assert.ok(found.indexOf('neon-glow-button') < found.indexOf('desc-only'))
  })

  test('an exact whole-name match leads', () => {
    assert.equal(ids('pricing table')[0], 'pricing-table')
    assert.equal(ids('ghost button')[0], 'ghost-button')
  })

  test('category and tags outrank the description', () => {
    const found = ids('pricing')
    assert.equal(found[0], 'pricing-table')
  })

  test('boost breaks a tie and cannot beat a better match', () => {
    const boosted = createSearchIndex([
      doc('a', 'Alpha Widget', { boost: 0 }),
      doc('b', 'Beta Widget', { boost: 0.75 }),
      doc('c', 'Widget', { boost: 0 }),
    ])
    const order = search(boosted, 'widget').map((h) => h.doc.id)
    assert.equal(order[0], 'c') // exact name wins outright
    assert.ok(order.indexOf('b') < order.indexOf('a')) // boost decides the tie
  })

  test('ties fall back to catalog order', () => {
    const tie = createSearchIndex([doc('x1', 'Widget One'), doc('x2', 'Widget Two')])
    assert.deepEqual(
      search(tie, 'widget').map((h) => h.doc.id),
      ['x1', 'x2'],
    )
  })
})

describe('modes and options', () => {
  test("'all' requires every word; 'any' needs one", () => {
    assert.deepEqual(ids('neon glow button'), ['neon-glow-button'])
    assert.deepEqual(ids('neon pricing'), [])
    const any = ids('neon pricing', { mode: 'any' })
    assert.ok(any.includes('neon-glow-button'))
    assert.ok(any.includes('pricing-table'))
  })

  test("'any' ranks documents matching more words higher", () => {
    const found = ids('neon glow button', { mode: 'any' })
    assert.equal(found[0], 'neon-glow-button')
  })

  test('stopwords are dropped from a natural-language query', () => {
    assert.equal(ids('a button that pulses with a red glow', { mode: 'any' })[0], 'neon-glow-button')
  })

  test('limit and filter apply to matches', () => {
    assert.equal(search(index, 'button', { limit: 1 }).length, 1)
    assert.deepEqual(
      ids('button', { filter: (d) => d.category !== 'Buttons' }),
      [],
    )
  })

  test('an empty query returns nothing — what to show is the caller decision', () => {
    assert.deepEqual(ids(''), [])
    assert.deepEqual(ids('   '), [])
  })
})

describe('matchedIndices', () => {
  test('marks whole leading word parts, not scattered letters', () => {
    assert.deepEqual(matchedIndices('Neon Glow', 'glo'), [5, 6, 7])
    assert.deepEqual(matchedIndices('Gradient Buttons', 'button'), [9, 10, 11, 12, 13, 14, 15])
  })

  test('nothing to mark for a miss', () => {
    assert.deepEqual(matchedIndices('Neon Glow', 'zzz'), [])
  })
})

describe('speed', () => {
  test('indexes and searches a catalog-sized set well inside a keystroke', () => {
    const words = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet']
    const big: SearchDoc[] = Array.from({ length: 4000 }, (_, i) =>
      doc(`id-${i}`, `${words[i % 10]} ${words[(i * 7) % 10]} ${i}`, {
        description: `${words[(i * 3) % 10]} ${words[(i * 11) % 10]} widget number ${i}`,
      }),
    )
    const t0 = performance.now()
    const big_index = createSearchIndex(big)
    const built = performance.now() - t0
    const t1 = performance.now()
    for (const q of ['alpha', 'charli', 'foxtrat', 'echo golf', 'widgt']) search(big_index, q)
    const queried = performance.now() - t1
    assert.ok(built < 1000, `index build took ${built.toFixed(0)}ms`)
    assert.ok(queried < 500, `five queries took ${queried.toFixed(0)}ms`)
  })
})
