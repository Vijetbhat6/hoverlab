import test from 'node:test'
import assert from 'node:assert/strict'

import { mergeUsageHeads, parseUsageDoc, type UsageCount } from './usage'

/**
 * The parts of the counter that make a decision, tested without a
 * Firestore. The queries themselves are three bare `orderBy().limit()`
 * calls and there is nothing in them to get wrong; what can go wrong is
 * what happens to the rows afterwards, which is all here.
 */

function row(id: string, fields: Partial<Record<string, number>>): UsageCount {
  return parseUsageDoc(id, fields as Record<string, unknown>)
}

test('a document with every field reads as itself', () => {
  assert.deepEqual(parseUsageDoc('a', { recent7: 5, total: 9, views: 100, saves: 3 }), {
    id: 'a',
    recent: 5,
    total: 9,
    views: 100,
    saves: 3,
  })
})

test('missing fields read as zero rather than undefined', () => {
  // Every document written before views and saves existed is this shape.
  assert.deepEqual(parseUsageDoc('a', { recent7: 2, total: 2 }), {
    id: 'a',
    recent: 2,
    total: 2,
    views: 0,
    saves: 0,
  })
  assert.deepEqual(parseUsageDoc('a', undefined), {
    id: 'a',
    recent: 0,
    total: 0,
    views: 0,
    saves: 0,
  })
})

test('wrong-typed fields read as zero rather than reaching the page', () => {
  const out = parseUsageDoc('a', { recent7: '5', total: null, views: {}, saves: 'many' })
  assert.deepEqual(out, { id: 'a', recent: 0, total: 0, views: 0, saves: 0 })
})

test('a net-negative save count clamps to zero', () => {
  // `recordSignal` decrements blindly, so a browser that unsaves something
  // it saved before the counter existed drives the field below zero. A
  // card must never render "-1 saves".
  assert.equal(parseUsageDoc('a', { saves: -4 }).saves, 0)
  assert.equal(parseUsageDoc('a', { views: -4 }).views, 0)
})

test('an artifact with views and no copies survives the merge', () => {
  // The reason usageSnapshot runs three queries instead of one: a block
  // nobody copied this week is absent from the recent7 head, and if that
  // were the only head its view count would be missing from exactly the
  // artifacts that have the most of it.
  const merged = mergeUsageHeads([
    [row('copied', { recent7: 3, total: 3 })],
    [row('browsed', { views: 900 })],
    [row('hoarded', { saves: 12 })],
  ])

  assert.deepEqual(Object.keys(merged).sort(), ['browsed', 'copied', 'hoarded'])
  assert.equal(merged.browsed.views, 900)
  assert.equal(merged.browsed.recent, 0)
  assert.equal(merged.hoarded.saves, 12)
})

test('an artifact in several heads appears once, with all its numbers', () => {
  // Each head returns the whole row, so the duplicate carries the same
  // data — but only if `parseUsageDoc` reads every field regardless of
  // which query found the document.
  const full = row('popular', { recent7: 8, total: 20, views: 500, saves: 4 })
  const merged = mergeUsageHeads([[full], [full], [full]])

  assert.equal(Object.keys(merged).length, 1)
  assert.deepEqual(merged.popular, {
    id: 'popular',
    recent: 8,
    total: 20,
    views: 500,
    saves: 4,
  })
})

test('an all-zero document is dropped instead of rendering zeroes', () => {
  // Left behind by a decrement that cancelled a save, or by a write that
  // only touched `updatedAt`. The map is read as "absent means uncounted",
  // so a row of zeroes in it would put "0 copies" on a card — a verdict on
  // the artifact rather than on the counter.
  const merged = mergeUsageHeads([
    [row('empty', { recent7: 0, total: 4, views: 0, saves: 0 })],
    [row('real', { views: 1 })],
  ])

  assert.deepEqual(Object.keys(merged), ['real'])
})

test('an empty catalog merges to an empty map, not a throw', () => {
  assert.deepEqual(mergeUsageHeads([[], [], []]), {})
  assert.deepEqual(mergeUsageHeads([]), {})
})
