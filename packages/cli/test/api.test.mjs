/**
 * Tests for the constants every surface reads the catalog's shape from.
 *
 * ── WHY A TEST FILE FOR FOUR ARRAYS ─────────────────────────────────────
 *
 * Because the primitive tier existed for a release and was unreachable
 * from here, and every part of that failure was silent.
 *
 * `LEVELS` was missing it, so `hoverlab search combobox` could not return
 * the combobox and `--level primitive` was rejected as unknown. Installing
 * one always worked — `/api/v1/artifacts/{id}` resolves an id across every
 * tier server-side and never asks the client which rung it came from — so
 * nothing in the CLI ever threw, and the only symptom was a tier quietly
 * absent from results nobody could compare against.
 *
 * Adding it to `LEVELS` then exposed two more copies of the same class of
 * bug: two private presentation orders that still listed four tiers. The
 * CLI fetched primitives and printed "6 matches across the catalog"
 * followed by five of them. The MCP server fetched them and discarded
 * them, so an agent paid for a request whose results it never saw.
 *
 * All three were arrays that had to agree and nothing made them. These
 * tests are that. They are cheap, they touch no network, and they fail on
 * the one commit where a sixth tier is added and only half wired up.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { LEVELS, LEVEL_PLURAL, SEARCH_ORDER, searchLevel } from '../src/api.mjs'

test('SEARCH_ORDER is exactly a permutation of LEVELS', () => {
  assert.deepEqual(
    [...SEARCH_ORDER].sort(),
    [...LEVELS].sort(),
    'a tier is searched but never printed, or printed but never searched',
  )
  assert.equal(new Set(SEARCH_ORDER).size, SEARCH_ORDER.length, 'a tier is listed twice')
})

test('SEARCH_ORDER runs assembly-first', () => {
  // The property the order exists for, asserted rather than described: a
  // reader who can have the whole page should be told before being handed
  // nine buttons to build it out of.
  const rank = (level) => SEARCH_ORDER.indexOf(level)
  assert.ok(rank('template') < rank('page'), 'templates should precede pages')
  assert.ok(rank('page') < rank('block'), 'pages should precede blocks')
  assert.ok(rank('block') < rank('primitive'), 'blocks should precede primitives')
  assert.ok(rank('primitive') < rank('effect'), 'primitives should precede effects')
})

test('LEVEL_PLURAL covers every level', () => {
  for (const level of LEVELS) {
    assert.equal(
      typeof LEVEL_PLURAL[level],
      'string',
      `${level} has no plural — output would read "No undefined matched …"`,
    )
  }
  assert.deepEqual(Object.keys(LEVEL_PLURAL).sort(), [...LEVELS].sort())
})

test('the primitive tier is reachable, and named the way the API names it', async () => {
  /*
   * The specific regression. A stubbed fetch rather than the network: this
   * asserts that `primitive` resolves to the `/api/v1/primitives` path and
   * that the response key it unwraps is `primitives` — the two facts whose
   * absence made the tier invisible. Whether the deployment is up is not
   * this test's business.
   */
  const original = globalThis.fetch
  let requested = null

  globalThis.fetch = async (url) => {
    requested = String(url)
    return {
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({ total: 1, primitives: [{ id: 'segmented-control' }], categories: ['Input'] }),
    }
  }

  try {
    const result = await searchLevel({ level: 'primitive', query: 'segmented' })
    assert.match(requested, /\/api\/v1\/primitives\?/, 'asked the wrong endpoint')
    assert.equal(result.total, 1)
    assert.deepEqual(
      result.items,
      [{ id: 'segmented-control' }],
      'the response key was not unwrapped — LIST_KEY is missing this tier',
    )
  } finally {
    globalThis.fetch = original
  }
})

test('every level resolves to a path rather than throwing', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ total: 0 }),
  })

  try {
    for (const level of LEVELS) {
      const result = await searchLevel({ level, query: 'x' })
      assert.deepEqual(result.items, [], `${level} did not normalise to an items array`)
    }
  } finally {
    globalThis.fetch = original
  }
})

test('an unknown level is rejected with the list of real ones', async () => {
  await assert.rejects(() => searchLevel({ level: 'widget', query: 'x' }), (error) => {
    assert.match(error.message, /Unknown level "widget"/)
    // The message has to name the tiers, or the fix is a guess.
    for (const level of LEVELS) assert.ok(error.message.includes(level), `${level} unlisted`)
    return true
  })
})
