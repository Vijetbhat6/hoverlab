import { test } from 'node:test'
import assert from 'node:assert/strict'

import tokens from '@/lib/generated-dna.json'
import { SHAPE_PRESETS } from '@/lib/theme-shape'
import { buildDesignSystem, type DesignSystemFile } from './design-system'

/**
 * The token documents are the part of the export with an external spec to be
 * wrong against, so these check structure a consumer would reject, not prose:
 * every reference resolves, every Figma id is declared before it is used, and
 * the radius numbers agree with the `calc()` the Tailwind theme carries.
 * Whether Style Dictionary really builds the files is a manual check recorded
 * with the change — it needs a package this repo does not depend on.
 */

const colorKeys = tokens.colorKeys as string[]

function file(files: DesignSystemFile[], path: string): string {
  const found = files.find((f) => f.path === path)
  assert.ok(found, `expected ${path} in the export`)
  return found.code
}

function json(files: DesignSystemFile[], path: string) {
  return JSON.parse(file(files, path))
}

test('DTCG carries every colour, and the whole non-colour shape', () => {
  const { files } = buildDesignSystem()
  for (const mode of ['light', 'dark']) {
    const doc = json(files, `tokens.${mode}.json`)
    assert.deepEqual(Object.keys(doc.color).filter((k) => !k.startsWith('$')), colorKeys)
    assert.equal(doc.color.$type, 'color')
    for (const group of ['radius', 'spacing', 'fontSize', 'lineHeight']) {
      assert.equal(doc[group]?.$type, 'dimension', `${group} is a dimension group`)
    }
    assert.ok(doc.spacing.base.$value)
    assert.ok(doc.fontSize.xs.$value && doc.fontSize['6xl'].$value)
    assert.ok(doc.lineHeight.xs.$value && doc.lineHeight['6xl'].$value)
  }
})

test('DTCG colours are hex, and light and dark disagree where they should', () => {
  const { files } = buildDesignSystem()
  const light = json(files, 'tokens.light.json')
  const dark = json(files, 'tokens.dark.json')
  for (const key of colorKeys) {
    assert.match(light.color[key].$value, /^#[0-9a-f]{6}$/i, key)
    assert.match(dark.color[key].$value, /^#[0-9a-f]{6}$/i, key)
  }
  assert.notEqual(light.color.background.$value, dark.color.background.$value)
})

test('radius steps agree with the calc() in the Tailwind theme', () => {
  const { files } = buildDesignSystem()
  const css = file(files, 'tailwind-theme.css')
  // The theme says sm = r − 4px, md = r − 2px, lg = r, xl = r + 4px.
  assert.match(css, /--radius-sm: calc\(var\(--radius\) - 4px\)/)
  assert.match(css, /--radius-xl: calc\(var\(--radius\) \+ 4px\)/)

  const { radius } = json(files, 'tokens.light.json')
  assert.equal(radius.default.$value, '0.75rem')
  assert.equal(radius.sm.$value, '0.5rem') // 12 − 4
  assert.equal(radius.md.$value, '0.625rem') // 12 − 2
  assert.equal(radius.lg.$value, '0.75rem')
  assert.equal(radius.xl.$value, '1rem') // 12 + 4
})

test('a sharp radius never goes negative', () => {
  const sharp = SHAPE_PRESETS.find((p) => p.id === 'sharp')
  assert.ok(sharp)
  const { files } = buildDesignSystem(undefined, { shape: sharp })
  const { radius } = json(files, 'tokens.light.json')
  assert.equal(radius.sm.$value, '0rem') // 2px − 4px, clamped
  for (const step of ['default', 'sm', 'md', 'lg', 'xl']) {
    assert.ok(!radius[step].$value.startsWith('-'), step)
  }
})

test('a non-default shape reaches the DTCG, not only the CSS', () => {
  const soft = SHAPE_PRESETS.find((p) => p.id === 'soft')
  assert.ok(soft)
  const { files } = buildDesignSystem(undefined, { shape: soft })
  const doc = json(files, 'tokens.light.json')
  assert.equal(doc.radius.default.$value, '1.25rem')
  assert.equal(doc.spacing.base.$value, '0.2875rem') // 0.25 × 1.15
  // 0.875rem × 1.05
  assert.equal(doc.fontSize.sm.$value, '0.9188rem')
})

test('the two DTCG modes have the same shape', () => {
  const { files } = buildDesignSystem()
  const light = json(files, 'tokens.light.json')
  const dark = json(files, 'tokens.dark.json')
  // Only the colour values differ; a designer importing both into one
  // collection needs the same variables in each, or the second import adds
  // variables instead of adding a mode.
  const names = (doc: Record<string, unknown>) =>
    Object.entries(doc)
      .filter(([k]) => !k.startsWith('$'))
      .map(([k, v]) => [k, Object.keys(v as object)])
  assert.deepEqual(names(light), names(dark))
  assert.deepEqual(light.radius, dark.radius)
  assert.deepEqual(light.spacing, dark.spacing)
})

test('the Figma payload is self-consistent: every id declared, every mode valued', () => {
  const { files } = buildDesignSystem()
  const body = json(files, 'figma-variables.json')

  const collections = new Set<string>(body.variableCollections.map((c: { id: string }) => c.id))
  const modeIds = new Set<string>(body.variableModes.map((m: { id: string }) => m.id))
  const variableIds = new Set<string>(body.variables.map((v: { id: string }) => v.id))
  assert.equal(variableIds.size, body.variables.length, 'variable ids are unique')

  // A collection's initial mode is created for you under the temporary id, so
  // it must be renamed by a variableModes entry — an unnamed mode is "Mode 1".
  for (const c of body.variableCollections) {
    assert.ok(modeIds.has(c.initialModeId), `${c.id} names its initial mode`)
  }
  for (const m of body.variableModes) assert.ok(collections.has(m.variableCollectionId))

  const modeCollection = new Map<string, string>(
    body.variableModes.map((m: { id: string; variableCollectionId: string }) => [
      m.id,
      m.variableCollectionId,
    ]),
  )
  const seen = new Map<string, Set<string>>()
  for (const v of body.variableModeValues) {
    assert.ok(variableIds.has(v.variableId), `${v.variableId} is declared`)
    assert.ok(modeIds.has(v.modeId), `${v.modeId} is declared`)
    seen.set(v.variableId, (seen.get(v.variableId) ?? new Set()).add(v.modeId))
  }

  // Every variable has a value in every mode of its own collection — a
  // variable with a hole in one mode renders as nothing in that mode.
  for (const v of body.variables) {
    const expected = body.variableModes
      .filter((m: { variableCollectionId: string }) => m.variableCollectionId === v.variableCollectionId)
      .map((m: { id: string }) => m.id)
    assert.deepEqual([...(seen.get(v.id) ?? [])].sort(), expected.sort(), v.id)
  }
  assert.ok(modeCollection.size >= 3)
})

test('Figma colours are 0–1 floats and dimensions are pixels', () => {
  const { files } = buildDesignSystem()
  const body = json(files, 'figma-variables.json')
  const byId = new Map<string, { resolvedType: string; name: string }>(
    body.variables.map((v: { id: string; resolvedType: string; name: string }) => [v.id, v]),
  )

  for (const entry of body.variableModeValues) {
    const variable = byId.get(entry.variableId)
    assert.ok(variable)
    if (variable.resolvedType === 'COLOR') {
      for (const channel of ['r', 'g', 'b', 'a']) {
        assert.ok(entry.value[channel] >= 0 && entry.value[channel] <= 1, `${variable.name}.${channel}`)
      }
    } else {
      assert.equal(typeof entry.value, 'number', variable.name)
    }
  }

  const value = (name: string) => {
    const v = body.variables.find((x: { name: string }) => x.name === name)
    return body.variableModeValues.find((e: { variableId: string }) => e.variableId === v.id).value
  }
  assert.equal(value('radius/default'), 12) // 0.75rem
  assert.equal(value('spacing/base'), 4) // 0.25rem
  assert.equal(value('fontSize/base'), 16)
  assert.equal(value('lineHeight/base'), 24)
})

test('Figma light and dark values are the DTCG hexes, not a second derivation', () => {
  const { files } = buildDesignSystem()
  const body = json(files, 'figma-variables.json')
  const light = json(files, 'tokens.light.json')
  const dark = json(files, 'tokens.dark.json')

  const hex = ({ r, g, b }: { r: number; g: number; b: number }) =>
    `#${[r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`

  for (const key of colorKeys) {
    const variable = body.variables.find((v: { name: string }) => v.name === `color/${key}`)
    assert.ok(variable, key)
    const valueIn = (mode: string) =>
      body.variableModeValues.find(
        (e: { variableId: string; modeId: string }) =>
          e.variableId === variable.id && e.modeId === mode,
      ).value
    assert.equal(hex(valueIn('mode_light')), light.color[key].$value.toLowerCase(), `${key} light`)
    assert.equal(hex(valueIn('mode_dark')), dark.color[key].$value.toLowerCase(), `${key} dark`)
  }
})

test('the Style Dictionary config reads both DTCG files and maps them to the right selectors', () => {
  const { files } = buildDesignSystem()
  const config = file(files, 'style-dictionary.config.mjs')
  assert.match(config, /import StyleDictionary from 'style-dictionary'/)
  assert.match(config, /selector: ':root'/)
  assert.match(config, /selector: '\.dark'/)
  assert.match(config, /tokens\.\$\{mode\}\.json/)
  // The mode list is the only place a mode name is spelled; both must exist
  // as files in this export or the build would read a path that is not there.
  for (const mode of ['light', 'dark']) file(files, `tokens.${mode}.json`)
})

test('a brand name cannot break out of the config comment', () => {
  const { files } = buildDesignSystem(undefined, { name: 'Evil */ process.exit(1) /*' })
  const config = file(files, 'style-dictionary.config.mjs')
  assert.equal(config.match(/\*\//g)?.length, 1, 'only the header comment closes')
})

test('the push script reads its token from the environment, never a literal', () => {
  const { files } = buildDesignSystem()
  const script = file(files, 'push-figma-variables.mjs')
  assert.match(script, /process\.env\.FIGMA_TOKEN/)
  assert.match(script, /api\.figma\.com\/v1\/files\/\$\{key\}\/variables/)
  assert.doesNotMatch(script, /figd_[A-Za-z0-9_-]{10,}/)
})
