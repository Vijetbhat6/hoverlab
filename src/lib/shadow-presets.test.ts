/**
 * The starting stacks, and the one of them that is arithmetic rather than a
 * literal.
 *
 * Neumorphism is the only preset in the builder that can be wrong: the pair
 * has to sit symmetrically either side of the surface colour, and on a base
 * near white or near black one half silently collapses onto it. These are the
 * two claims the tool makes about that — that the pair is symmetrical, and
 * that it says so when it cannot be.
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { hexToHsl } from './color-tools'
import {
  SHADOW_PRESETS,
  looksNeumorphic,
  neumorphicBase,
  neumorphicLayers,
  neumorphicPair,
  neumorphicWarning,
  shadowPresetsFor,
} from './shadow-presets'

test('the pair sits symmetrically either side of the base', () => {
  const base = '#e0e5ec'
  const pair = neumorphicPair(base)!
  const l = hexToHsl(base)!.l
  const up = hexToHsl(pair.light)!.l
  const down = hexToHsl(pair.dark)!.l
  assert.ok(up > l && down < l, 'the light half must be lighter and the dark half darker')
  assert.ok(
    Math.abs(up - l - (l - down)) < 1,
    'an asymmetric pair reads as lit from one side',
  )
})

test('the light is up-left and the dark is down-right, one pair', () => {
  const [dark, light] = neumorphicLayers('#e0e5ec')
  assert.equal(dark.x, 8)
  assert.equal(dark.y, 8)
  assert.equal(light.x, -8)
  assert.equal(light.y, -8)
  assert.ok(
    dark.opacity === 1 && light.opacity === 1,
    'the colours are the effect — translucent black is a drop shadow instead',
  )
})

test('pressed is the same pair, inward', () => {
  const raised = neumorphicLayers('#e0e5ec')
  const pressed = neumorphicLayers('#e0e5ec', { pressed: true })
  assert.ok(pressed.every((l) => l.inset))
  assert.ok(raised.every((l) => !l.inset))
  assert.deepEqual(
    pressed.map((l) => l.color),
    raised.map((l) => l.color),
  )
})

test('a base with no room to lighten is called out', () => {
  assert.equal(neumorphicWarning('#e0e5ec'), null)
  const white = neumorphicWarning('#ffffff')
  assert.ok(white && /too close to white/.test(white))
  const black = neumorphicWarning('#000000')
  assert.ok(black && /too close to black/.test(black))
})

test('loading onto white or black nudges the base into workable range', () => {
  assert.equal(neumorphicWarning(neumorphicBase('#ffffff')), null)
  assert.equal(neumorphicWarning(neumorphicBase('#000000')), null)
  // Neutral in, neutral out — white has no hue, and inventing one would
  // hand back a pink card.
  assert.match(neumorphicBase('#ffffff'), /^#([0-9a-f]{2})\1\1$/)
  // A base that already works is left exactly as the visitor set it.
  assert.equal(neumorphicBase('#e0e5ec'), '#e0e5ec')
})

test('a derived pair is recognisable without being remembered', () => {
  assert.ok(looksNeumorphic(neumorphicLayers('#e0e5ec')))
  assert.equal(
    looksNeumorphic([
      { color: '#000000', opacity: 0.1 },
      { color: '#000000', opacity: 0.2 },
    ]),
    false,
    'a two-layer black drop shadow is not neumorphism',
  )
  assert.equal(looksNeumorphic(neumorphicLayers('#e0e5ec').slice(0, 1)), false)
})

test('every preset yields at least one layer, and text ones stay flat', () => {
  for (const preset of SHADOW_PRESETS) {
    const layers = preset.layers('#3355ff')
    assert.ok(layers.length >= 1, `${preset.id} produced nothing`)
    if (preset.mode === 'text') {
      assert.ok(
        layers.every((l) => !l.inset && l.spread === 0),
        `${preset.id} uses inset or spread, which text-shadow does not have`,
      )
    }
  }
})

test('only the neumorphic pair demands a matching backdrop', () => {
  const needy = SHADOW_PRESETS.filter((p) => p.needsMatchingSurface).map((p) => p.id)
  assert.deepEqual(needy, ['neumorphic-raised', 'neumorphic-pressed'])
})

test('each mode has its own starting stacks', () => {
  assert.ok(shadowPresetsFor('box').length >= 4)
  assert.ok(shadowPresetsFor('text').length >= 2)
  assert.ok(shadowPresetsFor('text').every((p) => p.mode === 'text'))
})
