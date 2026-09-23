import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  NON_DEFAULT_STATES,
  STATES,
  STATE_BY_ID,
  focusDefects,
  groupDefects,
  isStateId,
  parseVariantName,
  stateOfName,
  summarize,
  variantName,
  verdictOf,
  verdictsOf,
  type ControlCensus,
} from './states.ts'

test('the state list is the nine states, default first, unique ids and figma names', () => {
  assert.deepEqual(
    STATES.map((s) => s.id),
    ['default', 'hover', 'focus', 'active', 'disabled', 'loading', 'error', 'empty', 'long-text'],
  )
  assert.equal(new Set(STATES.map((s) => s.figmaName)).size, STATES.length)
  assert.equal(NON_DEFAULT_STATES.length, 8)
  for (const s of STATES) assert.ok(s.how.length > 10, `${s.id} says how it is forced`)
})

test('figma names are Property=Value and never contain a splitter in the value', () => {
  assert.equal(STATE_BY_ID.hover.figmaName, 'State=Hover')
  assert.equal(STATE_BY_ID['long-text'].figmaName, 'State=Long text')
  for (const s of STATES) {
    assert.match(s.figmaName, /^State=[^=,]+$/)
  }
})

test('variantName joins several properties with a comma and cleans splitters', () => {
  assert.equal(variantName('hover'), 'State=Hover')
  assert.equal(variantName('focus', { Size: 'Large' }), 'State=Focus, Size=Large')
  assert.equal(variantName('error', { 'A=B': 'x,y' }), 'State=Error, A B=x y')
  // State cannot be overridden or duplicated by the extras.
  assert.equal(variantName('active', { State: 'Nope', Theme: '' }), 'State=Active')
})

test('parseVariantName and stateOfName round-trip', () => {
  const n = variantName('long-text', { Size: 'M' })
  assert.deepEqual(parseVariantName(n), { State: 'Long text', Size: 'M' })
  assert.equal(stateOfName(n), 'long-text')
  assert.equal(stateOfName('Size=M'), null)
  assert.equal(stateOfName('State=Bogus'), null)
  assert.ok(isStateId('hover'))
  assert.ok(!isStateId('toString'))
})

test('verdictOf: true is styled, false is not-styled, absent is n/a, inapplicable wins', () => {
  assert.equal(verdictOf(true), 'styled')
  assert.equal(verdictOf(false), 'not-styled')
  assert.equal(verdictOf(null), 'n/a')
  assert.equal(verdictOf(undefined), 'n/a')
  assert.equal(verdictOf(true, false), 'n/a')
})

test('verdictsOf covers every state and default is always n/a', () => {
  const v = verdictsOf({ hover: true, focus: false, loading: null })
  assert.equal(v.default, 'n/a')
  assert.equal(v.hover, 'styled')
  assert.equal(v.focus, 'not-styled')
  assert.equal(v.loading, 'n/a')
  assert.equal(v.error, 'n/a')
  assert.equal(Object.keys(v).length, STATES.length)
})

test('summarize counts per state', () => {
  const s = summarize({
    a: { hover: 'styled', focus: 'not-styled', loading: 'n/a' },
    b: { hover: 'styled', focus: 'styled' },
    c: { hover: 'not-styled' },
  })
  assert.equal(s.primitives, 3)
  assert.deepEqual(s.perState.hover, { styled: 2, notStyled: 1, na: 0, applicable: 3 })
  assert.deepEqual(s.perState.focus, { styled: 1, notStyled: 1, na: 1, applicable: 2 })
  assert.deepEqual(s.perState.loading, { styled: 0, notStyled: 0, na: 3, applicable: 0 })
})

test('focusDefects names only controls that are clearly unstyled and visible', () => {
  const ok: ControlCensus = { label: 'button "Save"', focusStyled: true }
  const bad: ControlCensus = { label: 'a "Docs"', focusStyled: false }
  const hidden: ControlCensus = { label: 'input[hidden]', focusStyled: false, hidden: true }
  const d = focusDefects({ zeta: [ok], alpha: [bad, hidden, ok], mid: [] })
  assert.deepEqual(d, [{ primitive: 'alpha', control: 'a "Docs"' }])
  assert.deepEqual(groupDefects(d), { alpha: ['a "Docs"'] })
})
