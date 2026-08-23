/**
 * Tests for the argument check every MCP tool call passes through.
 *
 * The bug these exist to prevent: `search_effects` called with no `query`
 * used to reach the API with no search term, which answered with the whole
 * catalog. The tool then reported it as `835 effects matched "undefined"` —
 * a confident, well-formed, entirely fictional result that a model has no
 * way to recognise as a mistake. Every case here is either a call that must
 * be refused before it reaches the network, or a sloppy-but-recoverable
 * call that must NOT be refused.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { TOOLS, coerceArgs, validateArgs } from '../src/mcp.mjs'

const tool = (name) => TOOLS.find((t) => t.name === name)

/* ------------------------------------------------------------------ *
 *  The schema and the handlers must describe the same server
 * ------------------------------------------------------------------ */

test('every tool publishes a schema whose required list it can satisfy', () => {
  for (const t of TOOLS) {
    assert.equal(t.inputSchema.type, 'object', `${t.name} schema is not an object`)
    for (const name of t.inputSchema.required ?? []) {
      assert.ok(
        t.inputSchema.properties?.[name],
        `${t.name} requires "${name}" but never declares it`,
      )
    }
  }
})

test('no tool description states a catalog size', () => {
  // A count baked into a description drifts the moment the catalog grows,
  // and it drifts silently — nothing fails, the model is just told a
  // number that stopped being true two releases ago.
  for (const t of TOOLS) {
    assert.ok(
      !/\d[\d,]{2,}\+?\s+(hand-tuned|effects|blocks|pages)/i.test(t.description),
      `${t.name} description hardcodes a catalog count`,
    )
  }
})

/* ------------------------------------------------------------------ *
 *  Refusals
 * ------------------------------------------------------------------ */

test('a missing required argument is refused, not guessed at', () => {
  const problems = validateArgs(tool('search_effects'), {})
  assert.equal(problems.length, 1)
  assert.match(problems[0], /"query" is required/)
})

test('an empty or whitespace query counts as missing', () => {
  for (const query of ['', '   ']) {
    const problems = validateArgs(tool('search_effects'), { query })
    assert.equal(problems.length, 1, `${JSON.stringify(query)} slipped through`)
  }
})

test('every tool with a required argument refuses the empty call', () => {
  for (const t of TOOLS) {
    if (!t.inputSchema.required?.length) continue
    assert.ok(
      validateArgs(t, {}).length > 0,
      `${t.name} accepted a call with none of its required arguments`,
    )
  }
})

test('a value outside a declared enum is refused with the alternatives', () => {
  const problems = validateArgs(tool('get_effect'), { id: 'btn-gradient', framework: 'cobol' })
  assert.equal(problems.length, 1)
  assert.match(problems[0], /"framework" must be one of/)
  assert.match(problems[0], /tailwind/)
})

test('a good call reports no problems', () => {
  assert.deepEqual(validateArgs(tool('search_effects'), { query: 'neon button', limit: 5 }), [])
  assert.deepEqual(
    validateArgs(tool('get_effect'), { id: 'btn-gradient', framework: 'react', hue: 30 }),
    [],
  )
})

test('an unknown extra argument is tolerated', () => {
  // Ignoring it costs a slightly wrong call; refusing it costs the result.
  assert.deepEqual(validateArgs(tool('search_effects'), { query: 'neon', nonsense: true }), [])
})

/* ------------------------------------------------------------------ *
 *  Repairs
 * ------------------------------------------------------------------ */

test('the recolouring knobs are clamped to their documented range', () => {
  const args = coerceArgs(tool('get_effect'), {
    id: 'btn-gradient',
    hue: 9999,
    sat: -500,
    scale: 40,
    speed: 0,
  })
  assert.equal(args.hue, 180)
  assert.equal(args.sat, -100)
  assert.equal(args.scale, 1.5)
  assert.equal(args.speed, 0.25)
})

test('a knob already in range is left exactly as it was', () => {
  const args = coerceArgs(tool('get_effect'), { id: 'btn-gradient', hue: -45, speed: 1.5 })
  assert.equal(args.hue, -45)
  assert.equal(args.speed, 1.5)
})

test('limit is clamped to the range the schema advertises', () => {
  assert.equal(coerceArgs(tool('search_effects'), { query: 'x', limit: 9999 }).limit, 100)
  assert.equal(coerceArgs(tool('search_effects'), { query: 'x', limit: 0 }).limit, 1)
  assert.equal(coerceArgs(tool('match_design'), { description: 'x', limit: 200 }).limit, 20)
})

test('a number sent as a string is accepted rather than dropped', () => {
  const args = coerceArgs(tool('get_effect'), { id: 'btn-gradient', hue: '30', speed: '2' })
  assert.equal(args.hue, 30)
  assert.equal(args.speed, 2)
})

test('an integer argument stays an integer', () => {
  assert.equal(coerceArgs(tool('search_effects'), { query: 'x', limit: 7.6 }).limit, 8)
})

test('a number that is not one is left for the handler to reject', () => {
  const args = coerceArgs(tool('get_effect'), { id: 'btn-gradient', hue: 'teal' })
  assert.equal(args.hue, 'teal')
})

test('coercion never mutates the caller\'s object', () => {
  const original = { query: 'x', limit: 9999 }
  coerceArgs(tool('search_effects'), original)
  assert.equal(original.limit, 9999)
})
