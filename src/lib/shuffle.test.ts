import test from 'node:test'
import assert from 'node:assert/strict'

import { newSeed, parseSeed, seededShuffle } from './shuffle'

/**
 * The Randomized sort's whole contract is that it is reproducible: the
 * order lives in a query string, so two browsers opening the same link
 * have to get the same grid. `Math.random()` cannot promise that, which is
 * the reason this module exists — so these tests are mostly about the
 * property that a naive implementation would quietly lose.
 */

const ITEMS = Array.from({ length: 50 }, (_, i) => `item-${i}`)

test('the same seed always gives the same order', () => {
  assert.deepEqual(seededShuffle(ITEMS, 12345), seededShuffle(ITEMS, 12345))
})

test('different seeds give different orders', () => {
  assert.notDeepEqual(seededShuffle(ITEMS, 1), seededShuffle(ITEMS, 2))
})

test('a shuffle is a permutation, not a filter', () => {
  const out = seededShuffle(ITEMS, 99)
  assert.equal(out.length, ITEMS.length)
  assert.deepEqual([...out].sort(), [...ITEMS].sort())
})

test('the input is not mutated', () => {
  // The callers hand over arrays that belong to someone else — a
  // server-rendered item list, a filtered catalog — and a shuffle that
  // mutated would make the order depend on how often it had been viewed.
  const original = [...ITEMS]
  seededShuffle(ITEMS, 7)
  assert.deepEqual(ITEMS, original)
})

test('degenerate inputs are left alone rather than throwing', () => {
  assert.deepEqual(seededShuffle([], 1), [])
  assert.deepEqual(seededShuffle(['only'], 1), ['only'])
})

test('seed 0 shuffles like any other seed', () => {
  // Zero is the seed a `?seed=0` link carries and the one a falsy check
  // would silently discard. It has to behave as a seed, not as "no seed".
  const out = seededShuffle(ITEMS, 0)
  assert.equal(out.length, ITEMS.length)
  assert.deepEqual(out, seededShuffle(ITEMS, 0))
  assert.notDeepEqual(out, ITEMS)
})

test('every position moves at least sometimes', () => {
  // A generator with a weak low bit can leave a prefix of the array in
  // place for every seed, which reads as "the shuffle is broken" long
  // before it reads as a statistics problem.
  const seen = new Set<number>()
  for (let seed = 0; seed < 40; seed++) {
    seededShuffle(ITEMS, seed).forEach((item, i) => {
      if (item !== ITEMS[i]) seen.add(i)
    })
  }
  assert.equal(seen.size, ITEMS.length)
})

test('parseSeed accepts what the URL can carry and rejects the rest', () => {
  assert.equal(parseSeed('0'), 0)
  assert.equal(parseSeed('12345'), 12345)

  // Each of these reaches the app as a real `?seed=` at some point — a
  // hand-edited URL, a truncated paste, a crawler appending a token. The
  // caller mints a fresh seed for all of them rather than shuffling by
  // NaN, which would silently return the catalog order.
  for (const bad of [null, '', 'abc', '-1', '1.5', '1e9', ' 12', '99999999999']) {
    assert.equal(parseSeed(bad), null, `expected ${JSON.stringify(bad)} to be rejected`)
  }
})

test('newSeed round-trips through the query string', () => {
  for (let i = 0; i < 200; i++) {
    const seed = newSeed()
    assert.equal(parseSeed(String(seed)), seed)
  }
})
