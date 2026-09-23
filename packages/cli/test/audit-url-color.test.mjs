/**
 * Colour maths behind `hoverlab audit-url`: the numbers a contrast finding
 * quotes have to be the numbers WCAG defines.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  composite,
  contrastRatio,
  deltaE,
  formatRatio,
  isGrey,
  requiredRatio,
  toHex,
} from '../src/audit-url/color.mjs'

test('black on white is 21:1 and identical colours are 1:1', () => {
  assert.ok(Math.abs(contrastRatio([0, 0, 0], [255, 255, 255]) - 21) < 1e-9)
  assert.equal(contrastRatio([10, 20, 30], [10, 20, 30]), 1)
})

test('the ratio is symmetric', () => {
  const a = [153, 153, 153]
  const b = [255, 255, 255]
  assert.equal(contrastRatio(a, b), contrastRatio(b, a))
})

test('the two famous greys straddle the AA line', () => {
  // #767676 is the lightest grey that passes on white; #777777 is one step past it.
  assert.ok(contrastRatio([0x76, 0x76, 0x76], [255, 255, 255]) >= 4.5)
  assert.ok(contrastRatio([0x77, 0x77, 0x77], [255, 255, 255]) < 4.5)
  assert.ok(contrastRatio([0x99, 0x99, 0x99], [255, 255, 255]) < 3)
})

test('large text is 24px, or 18.66px and bold', () => {
  assert.deepEqual(requiredRatio(16, '400'), { large: false, ratio: 4.5 })
  assert.deepEqual(requiredRatio(24, '400'), { large: true, ratio: 3 })
  assert.deepEqual(requiredRatio(18.66, '700'), { large: true, ratio: 3 })
  assert.deepEqual(requiredRatio(18, '700'), { large: false, ratio: 4.5 })
  assert.deepEqual(requiredRatio(20, '600'), { large: false, ratio: 4.5 })
})

test('a ratio is truncated for display, never rounded up into a pass', () => {
  assert.equal(formatRatio(4.499), '4.49:1')
  assert.equal(formatRatio(21), '21.00:1')
})

test('compositing lays a translucent colour over an opaque one', () => {
  assert.deepEqual(composite([0, 0, 0, 0.5], [255, 255, 255, 1]), [127.5, 127.5, 127.5, 1])
  assert.deepEqual(composite([10, 20, 30, 1], [255, 255, 255, 1]), [10, 20, 30, 1])
  assert.deepEqual(composite([10, 20, 30, 0], [200, 100, 50, 1]), [200, 100, 50, 1])
})

test('hex output carries alpha only when there is some', () => {
  assert.equal(toHex([255, 0, 128, 1]), '#ff0080')
  assert.equal(toHex([255, 0, 128, 0.5]), '#ff008080')
})

test('delta-E is zero for the same colour and small for one shade apart', () => {
  assert.equal(deltaE([244, 244, 245], [244, 244, 245]), 0)
  assert.ok(deltaE([244, 244, 245], [246, 246, 247]) < 1.5)
  assert.ok(deltaE([0, 0, 0], [255, 255, 255]) > 90)
})

test('greys are greys, including tinted ones, and brand colours are not', () => {
  assert.ok(isGrey([128, 128, 128]))
  assert.ok(isGrey([100, 116, 139])) // Tailwind slate-500, faintly blue
  assert.ok(!isGrey([225, 113, 0]))
  assert.ok(!isGrey([0, 120, 46]))
})
