// Smoke test for src/lib/color-tools.ts
// Transpiles the source via tsc and runs assertions against the actual
// implementation.

import { strict as assert } from 'node:assert'
import { execSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const tmpDir = mkdtempSync(join(tmpdir(), 'color-tools-test-'))
try {
  execSync(
    `npx tsc src/lib/color-tools.ts --outDir ${tmpDir} --module esnext --target es2022 --moduleResolution bundler --skipLibCheck --noEmitOnError false`,
    { stdio: 'inherit' },
  )
} catch (e) {
  console.error('Transpile failed:', e)
  process.exit(1)
}

const mod = await import(pathToFileURL(join(tmpDir, 'color-tools.js')).href)
const {
  hexToRgb,
  rgbToHex,
  hexToHsl,
  rgbToHsl,
  hslToRgb,
  hslToHex,
  generatePalette,
  contrastRatio,
  wcagLevel,
  relativeLuminance,
  normalizeHex,
  randomHex,
} = mod

let passed = 0
let failed = 0
function test(name, fn) {
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (e) {
    failed++
    console.error(`  ✗ ${name}: ${e.message}`)
  }
}

console.log('\nColor tools — unit tests\n')

// ============================================================
// hexToRgb
// ============================================================
console.log('hexToRgb:')

test('parses #rrggbb', () => {
  assert.deepEqual(hexToRgb('#ff0080'), { r: 255, g: 0, b: 128 })
})

test('parses #rgb (3-digit, expands)', () => {
  assert.deepEqual(hexToRgb('#f00'), { r: 255, g: 0, b: 0 })
})

test('parses without leading #', () => {
  assert.deepEqual(hexToRgb('00ff00'), { r: 0, g: 255, b: 0 })
})

test('parses #rrggbbaa (ignores alpha for RGB)', () => {
  assert.deepEqual(hexToRgb('#ff0000ff'), { r: 255, g: 0, b: 0 })
})

test('returns null for invalid input', () => {
  assert.equal(hexToRgb('not-a-color'), null)
  assert.equal(hexToRgb('#xyz'), null)
  assert.equal(hexToRgb(''), null)
})

test('is case-insensitive', () => {
  assert.deepEqual(hexToRgb('#FF0080'), { r: 255, g: 0, b: 128 })
})

// ============================================================
// rgbToHex
// ============================================================
console.log('\nrgbToHex:')

test('formats as #rrggbb lowercase', () => {
  assert.equal(rgbToHex({ r: 255, g: 0, b: 128 }), '#ff0080')
})

test('clamps out-of-range values', () => {
  assert.equal(rgbToHex({ r: 999, g: -10, b: 128 }), '#ff0080')
})

test('zero-pads single-digit channels', () => {
  assert.equal(rgbToHex({ r: 0, g: 5, b: 15 }), '#00050f')
})

// ============================================================
// hex <-> hsl round-trip
// ============================================================
console.log('\nhex <-> hsl round-trip:')

test('round-trips through HSL within tolerance', () => {
  const cases = ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000', '#808080', '#3b82f6', '#10b981']
  for (const hex of cases) {
    const hsl = hexToHsl(hex)
    assert.ok(hsl, `hexToHsl failed for ${hex}`)
    const back = hslToHex(hsl)
    // Allow off-by-one in any channel due to rounding.
    const a = hexToRgb(hex)
    const b = hexToRgb(back)
    assert.ok(a && b, `parse failed for ${hex}`)
    assert.ok(
      Math.abs(a.r - b.r) <= 1 && Math.abs(a.g - b.g) <= 1 && Math.abs(a.b - b.b) <= 1,
      `round-trip drift for ${hex}: got ${back}`,
    )
  }
})

// ============================================================
// generatePalette
// ============================================================
console.log('\ngeneratePalette:')

test('analogous returns 5 colors', () => {
  const p = generatePalette('#3b82f6', 'analogous')
  assert.equal(p.colors.length, 5)
  assert.equal(p.name, 'Analogous')
})

test('complementary includes base at index 1', () => {
  const p = generatePalette('#3b82f6', 'complementary')
  assert.equal(p.colors[1], '#3b82f6')
})

test('analogous includes base at index 2 (middle)', () => {
  const p = generatePalette('#3b82f6', 'analogous')
  assert.equal(p.colors[2], '#3b82f6')
})

test('triadic returns 5 colors', () => {
  const p = generatePalette('#3b82f6', 'triadic')
  assert.equal(p.colors.length, 5)
})

test('all schemes return 5 colors', () => {
  const schemes = ['analogous', 'complementary', 'triadic', 'split-complementary', 'tetradic', 'monochromatic', 'shades']
  for (const s of schemes) {
    const p = generatePalette('#3b82f6', s)
    assert.equal(p.colors.length, 5, `scheme ${s} returned ${p.colors.length}`)
  }
})

test('returns base × 5 for invalid hex', () => {
  const p = generatePalette('not-a-color', 'analogous')
  assert.deepEqual(p.colors, ['not-a-color', 'not-a-color', 'not-a-color', 'not-a-color', 'not-a-color'])
})

// ============================================================
// contrastRatio & wcagLevel
// ============================================================
console.log('\ncontrastRatio & wcagLevel:')

test('black on white = 21:1', () => {
  const r = contrastRatio('#000000', '#ffffff')
  assert.ok(r)
  assert.ok(Math.abs(r - 21) < 0.1, `expected ~21, got ${r}`)
})

test('same color = 1:1', () => {
  const r = contrastRatio('#3b82f6', '#3b82f6')
  assert.ok(r)
  assert.ok(Math.abs(r - 1) < 0.01, `expected 1, got ${r}`)
})

test('white on white = 1:1', () => {
  const r = contrastRatio('#ffffff', '#ffffff')
  assert.ok(Math.abs(r - 1) < 0.01)
})

test('wcagLevel AAA at 7:1 for normal text', () => {
  assert.equal(wcagLevel(7, false), 'AAA')
})

test('wcagLevel AA at 4.5:1 for normal text', () => {
  assert.equal(wcagLevel(4.5, false), 'AA')
})

test('wcagLevel AA Large at 3:1 for normal text', () => {
  assert.equal(wcagLevel(3, false), 'AA Large')
})

test('wcagLevel Fail below 3:1', () => {
  assert.equal(wcagLevel(2, false), 'Fail')
})

test('wcagLevel AAA for large text at 4.5:1', () => {
  assert.equal(wcagLevel(4.5, true), 'AAA')
})

test('wcagLevel AA Large for large text at 3:1', () => {
  assert.equal(wcagLevel(3, true), 'AA Large')
})

test('returns null for invalid colors', () => {
  assert.equal(contrastRatio('not-a-color', '#fff'), null)
})

// ============================================================
// normalizeHex
// ============================================================
console.log('\nnormalizeHex:')

test('lowercases and adds #', () => {
  assert.equal(normalizeHex('FF0080'), '#ff0080')
})

test('expands 3-digit', () => {
  assert.equal(normalizeHex('f0a'), '#ff00aa')
})

test('preserves valid 6-digit', () => {
  assert.equal(normalizeHex('#3b82f6'), '#3b82f6')
})

test('returns null for invalid', () => {
  assert.equal(normalizeHex('xyz'), null)
  assert.equal(normalizeHex(''), null)
  assert.equal(normalizeHex('#abcd'), null)
})

// ============================================================
// randomHex
// ============================================================
console.log('\nrandomHex:')

test('returns a valid 6-digit hex', () => {
  for (let i = 0; i < 20; i++) {
    const h = randomHex()
    assert.ok(/^#[0-9a-f]{6}$/.test(h), `invalid hex: ${h}`)
  }
})

// ============================================================
// relativeLuminance
// ============================================================
console.log('\nrelativeLuminance:')

test('black = 0', () => {
  assert.equal(relativeLuminance({ r: 0, g: 0, b: 0 }), 0)
})

test('white = 1', () => {
  assert.ok(Math.abs(relativeLuminance({ r: 255, g: 255, b: 255 }) - 1) < 0.001)
})

// ============================================================
// Cleanup
// ============================================================
rmSync(tmpDir, { recursive: true, force: true })

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
