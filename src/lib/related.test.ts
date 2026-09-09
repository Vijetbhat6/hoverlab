/**
 * The bridge in `related.ts` is half-checked by the compiler. This is the
 * other half.
 *
 * `Record<EffectCategory, readonly BlockCategory[]>` guarantees both sides
 * are spelled correctly and that no effect category is unmapped. What it
 * cannot see is whether a mapped block category holds any blocks —
 * `BLOCK_CATEGORIES` describes the finished catalog and runs ahead of it,
 * so a perfectly typed row can produce an empty rail. That is the failure
 * this file exists to catch, and it catches it at the category level so
 * the message names the row to fix.
 */

import test from 'node:test'
import assert from 'node:assert/strict'

import { fitsIn, mappedBlockCategories, relatedBlocks } from './related'
import { BLOCK_INDEX } from './blocks/block-index'
import { CATEGORIES } from './effect-types'

test('every mapped block category actually holds blocks', () => {
  const empty = mappedBlockCategories().filter(
    (category) => !BLOCK_INDEX.some((b) => b.category === category),
  )
  assert.deepEqual(
    empty,
    [],
    `related.ts maps to block categories with no blocks in them: ${empty.join(', ')}. ` +
      'Either build blocks there or point those rows at a populated category.',
  )
})

test('every effect category yields at least one related block', () => {
  const barren = CATEGORIES.filter((category) => relatedBlocks(category).length === 0)
  assert.deepEqual(barren, [], `effect categories with an empty rail: ${barren.join(', ')}`)
})

test('every effect category is mapped to at least two block categories', () => {
  // Two is the floor because the rail's whole point is breadth — one
  // category would send every effect in it to the same section, which is a
  // duplicate link rather than a recommendation.
  for (const category of CATEGORIES) {
    assert.ok(
      fitsIn(category).length >= 2,
      `${category} maps to fewer than two block categories`,
    )
  }
})

test('results are distinct, and capped at the limit', () => {
  for (const category of CATEGORIES) {
    const hits = relatedBlocks(category, 3)
    assert.ok(hits.length <= 3, `${category} returned ${hits.length} hits for a limit of 3`)
    assert.equal(
      new Set(hits.map((h) => h.id)).size,
      hits.length,
      `${category} returned the same block twice`,
    )
  }
})

test('a limit larger than the mapping can fill still returns only real blocks', () => {
  // The second pass exists to fill remaining slots from the same
  // categories. It must never invent a row or reach outside the mapping.
  for (const category of CATEGORIES) {
    const mapped = new Set<string>(fitsIn(category))
    for (const hit of relatedBlocks(category, 12)) {
      assert.ok(
        mapped.has(hit.category),
        `${category} produced ${hit.id} from ${hit.category}, which it does not map to`,
      )
      assert.ok(
        BLOCK_INDEX.some((b) => b.id === hit.id),
        `${category} produced ${hit.id}, which is not a real block`,
      )
    }
  }
})

test('hrefs point at the block detail route', () => {
  for (const hit of relatedBlocks('Buttons', 3)) {
    assert.equal(hit.href, `/block/${hit.id}`)
  }
})

test('the first pass takes one block per category before doubling up', () => {
  // Three slots against a three-category mapping should read as three
  // different kinds of section. Buttons maps to CTA / Pricing / Heroes,
  // all of which are populated, so this is the shape the rail should have.
  const hits = relatedBlocks('Buttons', 3)
  assert.equal(hits.length, 3)
  assert.equal(new Set(hits.map((h) => h.category)).size, 3)
})
