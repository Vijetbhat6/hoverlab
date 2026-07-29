// Unit tests for src/lib/brand-presets.ts
// Transpiles the source via tsc and imports it directly, so we're testing
// the actual implementation rather than a re-implementation.

import { strict as assert } from 'node:assert'
import { execSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

// 1. Transpile src/lib/brand-presets.ts -> JS in a temp dir.
const tmpDir = mkdtempSync(join(tmpdir(), 'brand-test-'))
try {
  execSync(
    `npx tsc src/lib/brand-presets.ts --outDir ${tmpDir} --module esnext --target es2022 --moduleResolution bundler --skipLibCheck --noEmitOnError false`,
    { stdio: 'inherit' },
  )
} catch (e) {
  console.error('Transpile failed:', e)
  process.exit(1)
}

const mod = await import(pathToFileURL(join(tmpDir, 'brand-presets.js')).href)
const {
  DEFAULT_BRAND_COLOR,
  BRAND_PRESETS,
  clamp,
  normalizeHue,
  coerceBrandColor,
  brandEquals,
  findMatchingPreset,
  applyBrandColorToDocument,
  clearBrandColorFromDocument,
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
    console.error(`  ✗ ${name}`)
    console.error(`    ${e.message}`)
  }
}

console.log('\nBrand color system — unit tests\n')

// ============================================================
// DEFAULT_BRAND_COLOR
// ============================================================
console.log('DEFAULT_BRAND_COLOR:')

test('has all 4 required fields', () => {
  assert.ok(typeof DEFAULT_BRAND_COLOR.hue === 'number')
  assert.ok(typeof DEFAULT_BRAND_COLOR.chroma === 'number')
  assert.ok(typeof DEFAULT_BRAND_COLOR.lightL === 'number')
  assert.ok(typeof DEFAULT_BRAND_COLOR.darkL === 'number')
})

test('hue is in [0, 360)', () => {
  assert.ok(DEFAULT_BRAND_COLOR.hue >= 0 && DEFAULT_BRAND_COLOR.hue < 360)
})

test('chroma is in (0, 0.32]', () => {
  assert.ok(DEFAULT_BRAND_COLOR.chroma > 0 && DEFAULT_BRAND_COLOR.chroma <= 0.32)
})

test('lightL and darkL are in (0, 1)', () => {
  assert.ok(DEFAULT_BRAND_COLOR.lightL > 0 && DEFAULT_BRAND_COLOR.lightL < 1)
  assert.ok(DEFAULT_BRAND_COLOR.darkL > 0 && DEFAULT_BRAND_COLOR.darkL < 1)
})

// ============================================================
// BRAND_PRESETS
// ============================================================
console.log('\nBRAND_PRESETS:')

test('has at least 8 presets (curated variety)', () => {
  assert.ok(BRAND_PRESETS.length >= 8, `expected ≥8, got ${BRAND_PRESETS.length}`)
})

test('each preset has unique id', () => {
  const ids = new Set(BRAND_PRESETS.map((p) => p.id))
  assert.equal(ids.size, BRAND_PRESETS.length, 'duplicate preset ids')
})

test('each preset has unique name', () => {
  const names = new Set(BRAND_PRESETS.map((p) => p.name))
  assert.equal(names.size, BRAND_PRESETS.length, 'duplicate preset names')
})

test('each preset has a swatch string', () => {
  for (const p of BRAND_PRESETS) {
    assert.equal(typeof p.swatch, 'string')
    assert.ok(p.swatch.length > 0, `empty swatch on ${p.id}`)
  }
})

test('emerald preset matches DEFAULT_BRAND_COLOR', () => {
  const emerald = BRAND_PRESETS.find((p) => p.id === 'emerald')
  assert.ok(emerald, 'no emerald preset')
  assert.ok(brandEquals(emerald, DEFAULT_BRAND_COLOR), 'emerald ≠ default')
})

test('every preset is findable via findMatchingPreset', () => {
  for (const p of BRAND_PRESETS) {
    const found = findMatchingPreset(p)
    assert.ok(found, `preset ${p.id} not found by findMatchingPreset`)
    assert.equal(found.id, p.id)
  }
})

// ============================================================
// clamp
// ============================================================
console.log('\nclamp:')

test('clamps below min', () => {
  assert.equal(clamp(-5, 0, 10), 0)
})

test('clamps above max', () => {
  assert.equal(clamp(15, 0, 10), 10)
})

test('passes through value in range', () => {
  assert.equal(clamp(5, 0, 10), 5)
})

test('handles boundary values', () => {
  assert.equal(clamp(0, 0, 10), 0)
  assert.equal(clamp(10, 0, 10), 10)
})

// ============================================================
// normalizeHue
// ============================================================
console.log('\nnormalizeHue:')

test('passes through hue in [0, 360)', () => {
  assert.equal(normalizeHue(180), 180)
  assert.equal(normalizeHue(0), 0)
})

test('wraps hue ≥ 360', () => {
  assert.equal(normalizeHue(360), 0)
  assert.equal(normalizeHue(540), 180)
  assert.equal(normalizeHue(720), 0)
})

test('wraps negative hue', () => {
  assert.equal(normalizeHue(-90), 270)
  assert.equal(normalizeHue(-360), 0)
  assert.equal(normalizeHue(-720), 0)
})

// ============================================================
// coerceBrandColor
// ============================================================
console.log('\ncoerceBrandColor:')

test('returns null for null', () => {
  assert.equal(coerceBrandColor(null), null)
})

test('returns null for undefined', () => {
  assert.equal(coerceBrandColor(undefined), null)
})

test('returns null for non-object', () => {
  assert.equal(coerceBrandColor('hello'), null)
  assert.equal(coerceBrandColor(42), null)
  assert.equal(coerceBrandColor(true), null)
})

test('returns null when any field is missing', () => {
  assert.equal(coerceBrandColor({ hue: 180 }), null)
  assert.equal(coerceBrandColor({ hue: 180, chroma: 0.2 }), null)
  assert.equal(coerceBrandColor({ hue: 180, chroma: 0.2, lightL: 0.5 }), null)
})

test('returns null when any field is wrong type', () => {
  assert.equal(coerceBrandColor({ hue: '180', chroma: 0.2, lightL: 0.5, darkL: 0.7 }), null)
  assert.equal(coerceBrandColor({ hue: 180, chroma: '0.2', lightL: 0.5, darkL: 0.7 }), null)
})

test('coerces a valid color', () => {
  const result = coerceBrandColor({ hue: 180, chroma: 0.2, lightL: 0.5, darkL: 0.7 })
  assert.deepEqual(result, { hue: 180, chroma: 0.2, lightL: 0.5, darkL: 0.7 })
})

test('normalizes hue > 360', () => {
  const result = coerceBrandColor({ hue: 540, chroma: 0.2, lightL: 0.5, darkL: 0.7 })
  assert.equal(result.hue, 180)
})

test('normalizes negative hue', () => {
  const result = coerceBrandColor({ hue: -90, chroma: 0.2, lightL: 0.5, darkL: 0.7 })
  assert.equal(result.hue, 270)
})

test('clamps chroma to [0, 0.32]', () => {
  assert.equal(coerceBrandColor({ hue: 180, chroma: -0.1, lightL: 0.5, darkL: 0.7 }).chroma, 0)
  assert.equal(coerceBrandColor({ hue: 180, chroma: 1.0, lightL: 0.5, darkL: 0.7 }).chroma, 0.32)
})

test('clamps lightL to [0.1, 0.95]', () => {
  assert.equal(coerceBrandColor({ hue: 180, chroma: 0.2, lightL: -1, darkL: 0.7 }).lightL, 0.1)
  assert.equal(coerceBrandColor({ hue: 180, chroma: 0.2, lightL: 5, darkL: 0.7 }).lightL, 0.95)
})

test('clamps darkL to [0.1, 0.95]', () => {
  assert.equal(coerceBrandColor({ hue: 180, chroma: 0.2, lightL: 0.5, darkL: 0 }).darkL, 0.1)
  assert.equal(coerceBrandColor({ hue: 180, chroma: 0.2, lightL: 0.5, darkL: 99 }).darkL, 0.95)
})

// ============================================================
// brandEquals
// ============================================================
console.log('\nbrandEquals:')

test('returns true for identical colors', () => {
  const a = { hue: 180, chroma: 0.2, lightL: 0.5, darkL: 0.7 }
  assert.ok(brandEquals(a, { ...a }))
})

test('returns false for different hue', () => {
  const a = { hue: 180, chroma: 0.2, lightL: 0.5, darkL: 0.7 }
  const b = { ...a, hue: 200 }
  assert.ok(!brandEquals(a, b))
})

test('returns false for different chroma', () => {
  const a = { hue: 180, chroma: 0.2, lightL: 0.5, darkL: 0.7 }
  const b = { ...a, chroma: 0.21 }
  assert.ok(!brandEquals(a, b))
})

test('returns false for different lightL', () => {
  const a = { hue: 180, chroma: 0.2, lightL: 0.5, darkL: 0.7 }
  const b = { ...a, lightL: 0.55 }
  assert.ok(!brandEquals(a, b))
})

test('returns false for different darkL', () => {
  const a = { hue: 180, chroma: 0.2, lightL: 0.5, darkL: 0.7 }
  const b = { ...a, darkL: 0.75 }
  assert.ok(!brandEquals(a, b))
})

test('tolerates tiny hue differences (<0.5°)', () => {
  const a = { hue: 180, chroma: 0.2, lightL: 0.5, darkL: 0.7 }
  const b = { ...a, hue: 180.3 }
  assert.ok(brandEquals(a, b))
})

test('rejects hue differences ≥0.5°', () => {
  const a = { hue: 180, chroma: 0.2, lightL: 0.5, darkL: 0.7 }
  const b = { ...a, hue: 181 }
  assert.ok(!brandEquals(a, b))
})

// ============================================================
// findMatchingPreset
// ============================================================
console.log('\nfindMatchingPreset:')

test('returns emerald for DEFAULT_BRAND_COLOR', () => {
  const result = findMatchingPreset(DEFAULT_BRAND_COLOR)
  assert.ok(result)
  assert.equal(result.id, 'emerald')
})

test('returns null for a custom color that matches no preset', () => {
  const custom = { hue: 137, chroma: 0.17, lightL: 0.61, darkL: 0.74 }
  assert.equal(findMatchingPreset(custom), null)
})

test('returns the matching preset even with tiny tolerance', () => {
  const indigo = BRAND_PRESETS.find((p) => p.id === 'indigo')
  const slightlyOff = {
    hue: indigo.hue + 0.1,
    chroma: indigo.chroma,
    lightL: indigo.lightL,
    darkL: indigo.darkL,
  }
  const result = findMatchingPreset(slightlyOff)
  assert.ok(result)
  assert.equal(result.id, 'indigo')
})

// ============================================================
// applyBrandColorToDocument / clearBrandColorFromDocument
// ============================================================
console.log('\napplyBrandColorToDocument / clearBrandColorFromDocument:')

// These functions check `typeof document === 'undefined'` and return early
// in non-browser environments. We verify they don't throw.
test('applyBrandColorToDocument does not throw in Node', () => {
  assert.doesNotThrow(() =>
    applyBrandColorToDocument({ hue: 180, chroma: 0.2, lightL: 0.5, darkL: 0.7 }),
  )
})

test('clearBrandColorFromDocument does not throw in Node', () => {
  assert.doesNotThrow(() => clearBrandColorFromDocument())
})

// ============================================================
// End-to-end save → load → apply cycle (re-implements the hook's
// localStorage read/write logic to verify round-trip behavior).
// ============================================================
console.log('\nRound-trip (localStorage simulation):')

test('a brand color can be saved to localStorage and read back', () => {
  const original = { hue: 265, chroma: 0.2, lightL: 0.5, darkL: 0.68 }
  const serialized = JSON.stringify(original)
  // Simulate what the hook does:
  const read = coerceBrandColor(JSON.parse(serialized))
  assert.deepEqual(read, original)
})

test('null (reset) can be saved and read back as null', () => {
  const serialized = JSON.stringify(null)
  const parsed = JSON.parse(serialized)
  // The hook treats `null` as "no override" and returns null from
  // readBrandColor. coerceBrandColor(null) returns null too.
  assert.equal(coerceBrandColor(parsed), null)
})

test('corrupt JSON in localStorage does not throw on parse', () => {
  // The hook wraps JSON.parse in try/catch; we verify the coerce step
  // is also safe against any value JSON.parse might return.
  const cases = [42, 'hello', true, false, [], [1, 2, 3], { foo: 'bar' }]
  for (const c of cases) {
    assert.doesNotThrow(() => coerceBrandColor(c))
  }
})

// ============================================================
// Cleanup
// ============================================================
rmSync(tmpDir, { recursive: true, force: true })

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
