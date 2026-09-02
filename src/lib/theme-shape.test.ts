import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_THEME_SHAPE,
  SHAPE_BOUNDS,
  SHAPE_PRESETS,
  coerceThemeShape,
  describeShape,
  findShapePreset,
  shapeCss,
} from './theme-shape'

test('the default shape emits nothing', () => {
  // A file that restates the defaults is noise handed to a customer who
  // never touched the controls.
  assert.equal(shapeCss(DEFAULT_THEME_SHAPE), '')
})

test('only the axes that moved are emitted', () => {
  const css = shapeCss({ ...DEFAULT_THEME_SHAPE, radiusRem: 0.25 })
  assert.match(css, /--radius: 0\.25rem;/)
  assert.doesNotMatch(css, /--spacing/)
  assert.doesNotMatch(css, /--text-/)
})

test('density is emitted as a multiple of the base unit', () => {
  const css = shapeCss({ ...DEFAULT_THEME_SHAPE, density: 0.8 })
  // 0.25rem × 0.8
  assert.match(css, /--spacing: 0\.2rem;/)
})

test('the type ramp scales proportionally and keeps its line heights', () => {
  const css = shapeCss({ ...DEFAULT_THEME_SHAPE, typeScale: 2 })
  assert.match(css, /--text-base: 2rem;/)
  assert.match(css, /--text-base--line-height: 3rem;/)
  assert.match(css, /--text-xs: 1\.5rem;/)
})

test('the block is @theme, not :root', () => {
  // `--spacing` and the `--text-*` ramp are Tailwind theme variables: set
  // in `:root` they are custom properties no utility reads, and the whole
  // control would silently do nothing.
  const css = shapeCss({ ...DEFAULT_THEME_SHAPE, density: 1.2 })
  assert.match(css, /^@theme \{/)
  assert.doesNotMatch(css, /:root/)
})

test('out-of-range input is clamped rather than trusted', () => {
  // Reached from a public API route, so "trust the caller" is not available.
  const wild = coerceThemeShape({ radiusRem: 99, density: 0.01, typeScale: -4 })

  assert.equal(wild.radiusRem, SHAPE_BOUNDS.radiusRem.max)
  assert.equal(wild.density, SHAPE_BOUNDS.density.min)
  assert.equal(wild.typeScale, SHAPE_BOUNDS.typeScale.min)
})

test('nonsense input falls back to the default shape', () => {
  assert.deepEqual(coerceThemeShape(null), DEFAULT_THEME_SHAPE)
  assert.deepEqual(coerceThemeShape('soft'), DEFAULT_THEME_SHAPE)
  assert.deepEqual(coerceThemeShape({ radiusRem: 'wide' }), DEFAULT_THEME_SHAPE)
})

test('a partial shape keeps the defaults for the axes it omits', () => {
  const partial = coerceThemeShape({ density: 1.1 })
  assert.equal(partial.density, 1.1)
  assert.equal(partial.radiusRem, DEFAULT_THEME_SHAPE.radiusRem)
  assert.equal(partial.typeScale, DEFAULT_THEME_SHAPE.typeScale)
})

test('every preset is inside the supported bounds', () => {
  // A preset the coercion would clamp is a preset that cannot be selected.
  for (const preset of SHAPE_PRESETS) {
    for (const key of ['radiusRem', 'density', 'typeScale'] as const) {
      const { min, max } = SHAPE_BOUNDS[key]
      assert.ok(
        preset[key] >= min && preset[key] <= max,
        `${preset.id}.${key} = ${preset[key]} is outside ${min}–${max}`,
      )
    }
  }
})

test('every preset is distinguishable from the default', () => {
  // A preset nobody can tell apart makes the control look broken.
  const others = SHAPE_PRESETS.filter((preset) => preset.id !== 'default')
  assert.ok(others.length >= 3)
  for (const preset of others) {
    assert.notEqual(shapeCss(preset), '', `${preset.id} renders identically to the default`)
  }
})

test('a preset shape is recognised and described by name', () => {
  const soft = SHAPE_PRESETS.find((p) => p.id === 'soft')!
  assert.equal(findShapePreset(soft)?.id, 'soft')
  assert.match(describeShape(soft), /^Soft — /)
})

test('a custom shape describes its own numbers', () => {
  const custom = { radiusRem: 0.5, density: 1.1, typeScale: 1 }
  assert.equal(findShapePreset(custom), null)
  assert.match(describeShape(custom), /Custom — 8px corners, 110% spacing/)
})
