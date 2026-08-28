import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  COLLISION_THRESHOLD,
  IDENTITY,
  VISIONS,
  atSeverity,
  findCollisions,
  oklabDistance,
  simulateHex,
  simulateVision,
  vision,
  visionMatrix,
} from './color-blindness'

/**
 * Two pages read their verdicts off these numbers, and a wrong matrix
 * would not look wrong — it would produce plausible swatches and a
 * confident "no collisions found" for a palette that collides. So the
 * properties worth pinning are the ones a bad edit would not make obvious:
 * that grey survives every simulation, that red and green actually merge
 * under deuteranopia, and that severity 0 is a no-op.
 */

/** Float-tolerant matrix compare: interpolating to t=1 lands a ulp off. */
function assertMatrix(actual: number[], expected: readonly number[]) {
  assert.equal(actual.length, expected.length)
  actual.forEach((v, i) =>
    assert.ok(
      Math.abs(v - expected[i]) < 1e-9,
      `index ${i}: ${v} !== ${expected[i]}`,
    ),
  )
}

test('greys are unmoved by every simulation', () => {
  // A neutral has equal cone responses, so no matrix that models a missing
  // cone can shift it. If one does, the matrix has been mistyped.
  for (const v of VISIONS) {
    for (const grey of ['#000000', '#808080', '#ffffff']) {
      const out = simulateHex(grey, v.matrix)
      assert.equal(out, grey, `${v.id} moved ${grey} to ${out}`)
    }
  }
})

test('deuteranopia collapses red against green', () => {
  const red = simulateVision('#ef4444', 'deuteranopia')
  const green = simulateVision('#22c55e', 'deuteranopia')

  // Plainly two colours to start with...
  assert.ok(
    oklabDistance('#ef4444', '#22c55e') > COLLISION_THRESHOLD * 2,
    'the source pair should be obviously distinct',
  )
  // ...and one after. This is the whole claim the tool makes.
  assert.ok(
    oklabDistance(red, green) < COLLISION_THRESHOLD,
    `red and green stayed ${oklabDistance(red, green).toFixed(3)} apart`,
  )
})

test('tritanopia leaves red against green alone', () => {
  // The counterexample matters as much as the example: a matrix that
  // merged everything would pass the test above and be useless.
  const red = simulateVision('#ef4444', 'tritanopia')
  const green = simulateVision('#22c55e', 'tritanopia')
  assert.ok(oklabDistance(red, green) > COLLISION_THRESHOLD)
})

test('achromatopsia produces neutrals', () => {
  const out = simulateVision('#3b82f6', 'achromatopsia')
  assert.match(out, /^#([0-9a-f]{2})\1\1$/, `${out} is not a grey`)
})

test('severity 0 is identity, severity 1 is the full matrix', () => {
  const deut = vision('deuteranopia')
  assertMatrix(atSeverity(deut.matrix, 0), IDENTITY)
  assertMatrix(atSeverity(deut.matrix, 1), deut.matrix)
  assert.equal(simulateVision('#ef4444', 'deuteranopia', 0), '#ef4444')
})

test('severity is clamped rather than extrapolated', () => {
  const deut = vision('deuteranopia')
  assertMatrix(atSeverity(deut.matrix, -1), IDENTITY)
  assertMatrix(atSeverity(deut.matrix, 5), deut.matrix)
})

test('typical vision is identity at any severity', () => {
  assertMatrix(visionMatrix('normal', 0.5), IDENTITY)
  assert.equal(simulateVision('#ef4444', 'normal'), '#ef4444')
})

test('unparseable input is returned untouched', () => {
  assert.equal(simulateHex('not a colour', visionMatrix('protanopia')), 'not a colour')
  // An unknown pair cannot be reported as a collision on a parse failure.
  assert.equal(oklabDistance('nope', '#fff'), 1)
})

test('findCollisions reports each pair once, with severity', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  const simulated = ['#22c55e', '#22c55e', '#3b82f6']
  const found = findCollisions(items, simulated)

  assert.equal(found.length, 1)
  assert.deepEqual([found[0].a.id, found[0].b.id], ['a', 'b'])
  assert.equal(found[0].severe, true)
  assert.equal(found[0].distance, 0)
})

test('a distinct palette produces no collisions', () => {
  const items = ['success', 'error', 'info']
  const found = findCollisions(items, ['#22c55e', '#ef4444', '#3b82f6'])
  assert.deepEqual(found, [])
})
