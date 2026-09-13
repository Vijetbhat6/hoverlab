import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  buildMatrix,
  encodeToCodewords,
  rsEncode,
} from './sources/qr-code'

/**
 * The QR encoder, checked against the standard rather than against itself.
 *
 * This is the one primitive whose output cannot be reviewed by eye: a
 * symbol with a wrong error-correction codeword looks exactly like a
 * correct one, scans on the phone of whoever wrote it — because the error
 * correction quietly repairs it — and fails on a worn printout or at an
 * angle. "It scanned for me" is not evidence.
 *
 * So the checks below are structural and algebraic:
 *
 *   - a Reed-Solomon codeword is divisible by the generator polynomial, so
 *     evaluating it at every root of that polynomial must give zero. QR's
 *     generator is the product of (x + α^i) for i in 0…n-1, so the roots
 *     are α^0…α^(n-1) — NOT α^1…α^n, which is the convention several other
 *     Reed-Solomon uses follow and the first thing this test got wrong.
 *     Between them the syndromes catch a wrong generator, a wrong field, an
 *     off-by-one in the remainder loop and a mis-sized block.
 *   - the module count, finder patterns, timing patterns and the dark
 *     module are fixed by the standard for a given version.
 *   - the version has to be the smallest that fits, or the symbol is bigger
 *     than it needs to be for no reason.
 */

/* The same field the encoder uses, rebuilt here so the test does not take
   the implementation's word for it. */
const EXP: number[] = []
const LOG: number[] = []
{
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
}
const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]])

/** Evaluate a codeword polynomial at α^k. Zero for every valid codeword. */
function syndrome(codeword: number[], k: number): number {
  let acc = 0
  for (const byte of codeword) acc = mul(acc, EXP[k]) ^ byte
  return acc
}

test('Reed-Solomon output is a valid codeword', () => {
  // Data + its EC codewords form a polynomial divisible by the generator,
  // so every syndrome is zero. A single altered byte breaks this, which is
  // exactly what error correction detects.
  for (const ecLen of [10, 16, 18, 22, 24, 26]) {
    const data = Array.from({ length: 20 }, (_, i) => (i * 37 + 11) & 0xff)
    const full = [...data, ...rsEncode(data, ecLen)]

    for (let k = 0; k < ecLen; k++) {
      assert.equal(
        syndrome(full, k),
        0,
        `syndrome ${k} is non-zero for ${ecLen} EC codewords — the generator or the field is wrong`,
      )
    }
  }
})

test('a corrupted codeword fails the same check', () => {
  // Guards the test itself: a syndrome function that returns 0 for
  // everything would pass the case above and prove nothing.
  const data = Array.from({ length: 20 }, (_, i) => i)
  const full = [...data, ...rsEncode(data, 10)]
  full[7] ^= 0x5a

  const syndromes = Array.from({ length: 10 }, (_, i) => syndrome(full, i))
  assert.ok(
    syndromes.some((s) => s !== 0),
    'a corrupted codeword produced all-zero syndromes — the check is inert',
  )
})

test('the smallest version that fits is chosen', () => {
  // Byte-mode capacities at error-correction level M.
  const cases: [number, number][] = [
    [10, 1],
    [14, 1],
    [15, 2],
    [26, 2],
    [27, 3],
    [42, 3],
    [43, 4],
    [180, 9],
    [181, 10],
    [213, 10],
  ]
  for (const [length, expected] of cases) {
    const { version } = encodeToCodewords('a'.repeat(length))
    assert.equal(version, expected, `${length} bytes should fit version ${expected}`)
  }
})

test('too much data is refused rather than truncated', () => {
  // A QR code holding half a URL scans perfectly and goes somewhere wrong,
  // which is worse than one that was never produced.
  assert.throws(() => encodeToCodewords('a'.repeat(214)), /213/)
})

test('the matrix has the structure the standard fixes', () => {
  for (const [value, version] of [
    ['hi', 1],
    ['https://hoverlab.dev/primitives', 3],
    ['x'.repeat(200), 10],
  ] as const) {
    const m = buildMatrix(value)
    const size = version * 4 + 17
    assert.equal(m.length, size, `${value.slice(0, 12)}… should be ${size} modules`)
    assert.equal(m[0].length, size)

    // Finder patterns: a 7x7 ring with a 3x3 core, in three corners.
    for (const [top, left] of [
      [0, 0],
      [0, size - 7],
      [size - 7, 0],
    ]) {
      assert.equal(m[top][left], true, 'finder corner is not dark')
      assert.equal(m[top + 1][left + 1], false, 'finder ring is not light')
      assert.equal(m[top + 3][left + 3], true, 'finder core is not dark')
    }

    // Timing patterns: alternating, starting dark, along row and column 6.
    for (let i = 8; i < size - 8; i++) {
      assert.equal(m[6][i], i % 2 === 0, `horizontal timing wrong at ${i}`)
      assert.equal(m[i][6], i % 2 === 0, `vertical timing wrong at ${i}`)
    }

    // The module that is always dark.
    assert.equal(m[size - 8][8], true, 'the dark module is not dark')
  }
})

test('the same value always produces the same symbol', () => {
  // Mask selection is a minimisation over a penalty score, and a tie broken
  // by iteration order. Deterministic output is what lets a QR code be
  // cached, diffed, or rendered on a server and a client.
  const a = buildMatrix('https://hoverlab.dev/primitive/qr-code')
  const b = buildMatrix('https://hoverlab.dev/primitive/qr-code')
  assert.deepEqual(a, b)
})

test('different values produce different symbols', () => {
  const a = buildMatrix('https://hoverlab.dev/a')
  const b = buildMatrix('https://hoverlab.dev/b')
  assert.notDeepEqual(a, b)
})
