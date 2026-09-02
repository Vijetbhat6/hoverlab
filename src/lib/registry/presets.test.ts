import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { DESIGN_PRESETS, findPreset, presetRegistryItem } from './presets'
import { DEFAULT_THEME_SHAPE } from '../theme-shape'

/**
 * A preset installs into a stranger's project and rewrites its whole token
 * set. The failures worth guarding are the silent ones: a variable in the
 * wrong scope applies cleanly and does nothing, and a note that promises
 * square corners while the item ships round ones is a lie nothing catches.
 */

test('every preset is addressed by a preset- name', () => {
  for (const preset of DESIGN_PRESETS) {
    assert.ok(preset.name.startsWith('preset-'), `${preset.name} lacks the prefix`)
    assert.equal(preset.name, `preset-${preset.id}`)
  }
})

test('names are unique', () => {
  const names = new Set(DESIGN_PRESETS.map((p) => p.name))
  assert.equal(names.size, DESIGN_PRESETS.length)
})

test('findPreset resolves exactly the published names', () => {
  for (const preset of DESIGN_PRESETS) {
    assert.equal(findPreset(preset.name)?.id, preset.id)
  }
  assert.equal(findPreset('preset-nonsense'), undefined)
  // The bare slug is not an address. Only the prefixed name is.
  assert.equal(findPreset('console'), undefined)
})

test('the shape lands in cssVars.theme, not in light', () => {
  // This is the one that would ship silently. Tailwind v4 reads --spacing
  // and the --text-* ramp from @theme; under :root they set properties no
  // utility looks at, so the preset would install cleanly and change
  // nothing about the gutters or the type.
  for (const preset of DESIGN_PRESETS) {
    const item = presetRegistryItem(preset)
    assert.ok(item.cssVars.theme['--spacing'], `${preset.name}: no --spacing in theme`)
    assert.ok(item.cssVars.theme['--text-base'], `${preset.name}: no type ramp in theme`)
    assert.ok(item.cssVars.theme['--radius'], `${preset.name}: no --radius in theme`)
    assert.equal(item.cssVars.light['--spacing'], undefined)
  }
})

test('the shape owns radius, not the colour half', () => {
  // `ThemeState` carries a radius of its own, and every entry in
  // THEME_PRESETS sets one. If that value won, `preset-console` would
  // advertise square corners in its note and install 8px ones.
  const console_ = DESIGN_PRESETS.find((p) => p.id === 'console')!
  const item = presetRegistryItem(console_)
  assert.equal(item.cssVars.theme['--radius'], '0.125rem')
})

test('every preset carries a complete light and dark set', () => {
  for (const preset of DESIGN_PRESETS) {
    const item = presetRegistryItem(preset)
    const light = Object.keys(item.cssVars.light)
    const dark = Object.keys(item.cssVars.dark)
    assert.ok(light.length > 20, `${preset.name}: only ${light.length} light tokens`)
    // A preset that themes light and half-themes dark is worse than one
    // that does neither: the project looks right until someone toggles.
    assert.deepEqual(light.sort(), dark.sort(), `${preset.name}: light and dark disagree`)
  }
})

test('presets publish as registry:base — what a shadcn preset resolves to', () => {
  for (const preset of DESIGN_PRESETS) {
    assert.equal(presetRegistryItem(preset).type, 'registry:base')
  }
})

test('the type ramp scales with typeScale and stays proportional', () => {
  const cockpit = DESIGN_PRESETS.find((p) => p.id === 'cockpit')!
  const item = presetRegistryItem(cockpit)
  // 0.92x of Tailwind's 1rem base.
  assert.equal(item.cssVars.theme['--text-base'], '0.92rem')
  assert.equal(item.cssVars.theme['--text-base--line-height'], '1.38rem')
})

test('a default-shape preset still emits the full shape', () => {
  // `shapeCss` deliberately emits nothing for the default shape, because a
  // stylesheet restating the defaults is noise. A registry item must not do
  // that: it cannot assume a Hoverlab project underneath it, so a preset
  // that omitted --spacing would inherit whatever was there before.
  const signal = DESIGN_PRESETS.find((p) => p.id === 'signal')!
  assert.deepEqual(signal.shape, DEFAULT_THEME_SHAPE)
  const item = presetRegistryItem(signal)
  assert.equal(item.cssVars.theme['--spacing'], '0.25rem')
  assert.equal(item.cssVars.theme['--radius'], '0.75rem')
})

test('presets are recognisably different from each other', () => {
  // A preset nobody can tell from another is a preset that makes the whole
  // list look like filler — the same argument SHAPE_PRESETS makes.
  const fingerprints = DESIGN_PRESETS.map((preset) => {
    const item = presetRegistryItem(preset)
    return [
      item.cssVars.light.primary,
      item.cssVars.theme['--radius'],
      item.cssVars.theme['--spacing'],
    ].join('|')
  })
  assert.equal(new Set(fingerprints).size, DESIGN_PRESETS.length)
})

test('an origin turns into real links, and its absence into none', () => {
  const preset = DESIGN_PRESETS[0]
  const withOrigin = presetRegistryItem(preset, 'https://hoverlab.dev/')
  assert.match(withOrigin.docs, /https:\/\/hoverlab\.dev\/tools\/shadcn/)
  assert.equal(withOrigin.meta.href, 'https://hoverlab.dev/tools/shadcn')

  const without = presetRegistryItem(preset)
  assert.doesNotMatch(without.docs, /undefined/)
  assert.equal(without.meta.href, undefined)
})
