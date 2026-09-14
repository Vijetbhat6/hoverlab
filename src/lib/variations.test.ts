import test from 'node:test'
import assert from 'node:assert/strict'

import { EFFECTS } from './effects'
import { PRESETS, customizeCss, optsToHash, hashToOpts, parseHash } from './customize'
import {
  ALL_RECIPES,
  COMMUNITY_VARIATIONS,
  FAMILIES,
  VARIATIONS_PER_EFFECT,
  authorHref,
  authorLabel,
  isPresetOrDefault,
  supportsVariations,
  variationsFor,
} from './variations'

/**
 * This rail is server-rendered onto 1,047 statically generated pages and its
 * permalinks are meant to be shareable, so almost everything here is about
 * one of two properties a plausible-looking implementation would lose:
 * determinism (the build and the browser must agree, forever) and honesty
 * (nothing gets a byline we cannot support).
 */

/* ── the shape of the rail ─────────────────────────────────────────────── */

test('the rail is exactly as long as there are families', () => {
  assert.equal(VARIATIONS_PER_EFFECT, FAMILIES.length)
  assert.equal(VARIATIONS_PER_EFFECT, 7)
})

test('every effect that can publish variations publishes exactly seven', () => {
  const published = EFFECTS.filter((e) => supportsVariations(e.renderer))
  for (const effect of published) {
    assert.equal(
      variationsFor(effect.id).length,
      VARIATIONS_PER_EFFECT,
      `${effect.id} published the wrong number`,
    )
  }
  // The rail is meant to be on effectively the whole catalog, not a corner of
  // it. If a future renderer took most of the catalog out of scope, "seven
  // under every effect" would have quietly stopped being true.
  assert.ok(
    published.length > EFFECTS.length * 0.95,
    `only ${published.length} of ${EFFECTS.length} effects publish variations`,
  )
})

test('shader effects publish nothing, because their CSS is not the effect', () => {
  // A webgl/canvas effect paints from a GLSL program; its `css` is the
  // fallback gradient. `customizeCss` cannot reach the program, so seven
  // recolourings of the fallback would be seven false claims. See
  // supportsVariations.
  const shaders = EFFECTS.filter((e) => e.renderer && e.renderer !== 'css')
  assert.ok(shaders.length > 0, 'no shader effects to check')
  for (const e of shaders) {
    assert.equal(supportsVariations(e.renderer), false, `${e.id} should be excluded`)
  }
  assert.equal(supportsVariations('css'), true)
  assert.equal(supportsVariations(undefined), true)
})

test('the seven are distinct, by id and by what they do', () => {
  for (const effect of EFFECTS.filter((e) => supportsVariations(e.renderer))) {
    const got = variationsFor(effect.id)
    const ids = new Set(got.map((v) => v.id))
    assert.equal(ids.size, got.length, `${effect.id} repeated a variation id`)
    // Two different names doing the identical transform is the same card
    // twice as far as the reader is concerned.
    const shapes = new Set(
      got.map((v) => `${v.opts.hue}|${v.opts.saturation}|${v.opts.scale}|${v.opts.speed}`),
    )
    assert.equal(shapes.size, got.length, `${effect.id} repeated a transform`)
  }
})

test('one variation per family, while nothing has been displaced', () => {
  if (COMMUNITY_VARIATIONS.length > 0) return
  for (const effect of EFFECTS.slice(0, 200)) {
    const families = variationsFor(effect.id).map((v) => v.family)
    assert.deepEqual(
      [...families].sort(),
      [...FAMILIES].sort(),
      `${effect.id} did not draw one of each family`,
    )
  }
})

/* ── determinism ───────────────────────────────────────────────────────── */

test('the same effect always draws the same seven', () => {
  for (const effect of EFFECTS.slice(0, 300)) {
    assert.deepEqual(variationsFor(effect.id), variationsFor(effect.id))
  }
})

test('different effects get different sevens', () => {
  // Not a guarantee for any specific pair — the pools are finite — but a
  // uniform rail would collapse to one combination, which is the failure
  // this is watching for.
  const seen = new Set(
    EFFECTS.map((e) =>
      variationsFor(e.id)
        .map((v) => v.id)
        .join(','),
    ),
  )
  assert.ok(
    seen.size > EFFECTS.length / 4,
    `only ${seen.size} distinct rails across ${EFFECTS.length} effects`,
  )
})

/* ── the recipes are real slider positions ─────────────────────────────── */

test('every recipe lands on a position the customize panel can hold', () => {
  // The panel's own bounds and steps, from <CustomizePanel>'s SliderRows.
  const onStep = (v: number, step: number) =>
    Math.abs(Math.round(v / step) * step - v) < 1e-9

  for (const r of ALL_RECIPES) {
    const { hue, saturation, scale, speed } = r.opts
    assert.ok(hue >= -180 && hue <= 180, `${r.id}: hue out of range`)
    assert.ok(onStep(hue, 5), `${r.id}: hue off-step`)
    assert.ok(saturation >= -100 && saturation <= 100, `${r.id}: saturation out of range`)
    assert.ok(onStep(saturation, 5), `${r.id}: saturation off-step`)
    assert.ok(scale >= 0.5 && scale <= 1.5, `${r.id}: scale out of range`)
    assert.ok(onStep(scale, 0.05), `${r.id}: scale off-step`)
    assert.ok(speed >= 0.25 && speed <= 3, `${r.id}: speed out of range`)
    assert.ok(onStep(speed, 0.25), `${r.id}: speed off-step`)
  }
})

test('no recipe is a no-op or a preset chip in disguise', () => {
  for (const r of ALL_RECIPES) {
    assert.equal(
      isPresetOrDefault(r.opts),
      false,
      `${r.id} duplicates a preset chip or changes nothing`,
    )
  }
  // And the guard itself works, or the assertion above proves nothing.
  assert.equal(isPresetOrDefault(PRESETS[0].opts), true)
})

test('recipe ids are unique across every pool', () => {
  const ids = ALL_RECIPES.map((r) => r.id)
  assert.equal(new Set(ids).size, ids.length)
})

test('saturation never reaches -100, where hue stops meaning anything', () => {
  for (const r of ALL_RECIPES) {
    assert.ok(r.opts.saturation > -100, `${r.id} is fully desaturated`)
  }
})

/* ── tempo actually does what the name says ────────────────────── */

/**
 * The one thing in this file that asserts against the real engine rather than
 * against the data.
 *
 * `speed` multiplies DURATION, so a bigger number is a slower animation while
 * the slider above it is labelled "Speed". Every tempo recipe in the first
 * draft was inverted by exactly that confusion, and no structural check could
 * see it: the values were in range, on-step, distinct from each other and from
 * the presets, and round-tripped through the URL. A card named "Sprint" simply
 * ran four times too slow.
 *
 * These are the durations a 1s animation must come out as. Written as the
 * observable outcome, not as the input, so the test still fails if the engine's
 * convention flips underneath it.
 */
const EXPECTED_DURATION: Record<string, string> = {
  // tempo
  'half-time': '2s',
  'slow-burn': '3s',
  brisk: '0.75s',
  'double-time': '0.5s',
  sprint: '0.25s',
  // signature
  'neon-night': '0.75s',
  'faded-poster': '1.5s',
  arcade: '0.5s',
  silk: '2s',
  brutal: '2s',
  candy: '0.75s',
}

test('every recipe that changes tempo changes it in the direction it claims', () => {
  for (const r of ALL_RECIPES) {
    const expected = EXPECTED_DURATION[r.id]
    if (r.opts.speed === 1) {
      assert.equal(expected, undefined, `${r.id} does not touch speed but is listed`)
      continue
    }
    assert.ok(expected, `${r.id} changes speed and is not pinned in EXPECTED_DURATION`)
    const out = customizeCss('.x { animation: spin 1s linear infinite; }', r.opts)
    const got = /animation: spin ([\d.]+s)/.exec(out)?.[1]
    assert.equal(got, expected, `${r.id} ("${r.blurb}") produced ${got}`)
  }
})

test('the words faster and slower are on the correct side of 1', () => {
  for (const r of ALL_RECIPES) {
    if (r.opts.speed === 1) continue
    const claimsFaster = /fast|quick/i.test(r.blurb + r.name)
    const claimsSlower = /slow|longer|as long/i.test(r.blurb + r.name)
    if (claimsFaster && !claimsSlower) {
      assert.ok(r.opts.speed < 1, `${r.id} claims faster but slows the animation down`)
    }
    if (claimsSlower && !claimsFaster) {
      assert.ok(r.opts.speed > 1, `${r.id} claims slower but speeds the animation up`)
    }
  }
})

/* ── permalinks round-trip ─────────────────────────────────────────────── */

test('every variation survives the trip through a URL hash', () => {
  for (const effect of EFFECTS.slice(0, 100)) {
    for (const v of variationsFor(effect.id)) {
      const back = hashToOpts(parseHash(optsToHash(v.opts)))
      assert.deepEqual(back, v.opts, `${effect.id}/${v.id} did not round-trip`)
    }
  }
})

/* ── authorship ────────────────────────────────────────────────────────── */

test('every variation has a byline', () => {
  for (const effect of EFFECTS.slice(0, 100)) {
    for (const v of variationsFor(effect.id)) {
      assert.ok(authorLabel(v.author).length > 0, `${v.id} has no byline`)
    }
  }
})

test('the house byline links nowhere and a person always does', () => {
  assert.equal(authorHref({ kind: 'house' }), null)
  assert.equal(
    authorHref({
      kind: 'person',
      name: 'Someone',
      profile: 'https://example.com/someone',
      permission: 'submitted it and asked us to publish it',
      addedOn: '2026-09-14',
    }),
    'https://example.com/someone',
  )
})

test('a community variation names a real effect, and a checkable person', () => {
  const ids = new Set(EFFECTS.map((e) => e.id))
  for (const v of COMMUNITY_VARIATIONS) {
    assert.ok(ids.has(v.effectId), `${v.id} varies an effect that does not exist`)
    // The whole evidentiary value of a byline is that the reader can open it.
    assert.match(v.author.profile, /^https:\/\//, `${v.id}: profile is not a URL`)
    assert.ok(v.author.permission.trim().length > 10, `${v.id}: permission is not a sentence`)
    assert.match(v.author.addedOn, /^\d{4}-\d{2}-\d{2}$/, `${v.id}: addedOn is not a date`)
  }
})

test('community entries displace house recipes instead of lengthening the rail', () => {
  // Guards the invariant even while the array is empty: if the slot
  // arithmetic in variationsFor ever changed to append, the count test above
  // would only catch it after somebody added a real entry.
  const effect = EFFECTS[0]
  const got = variationsFor(effect.id)
  const houseCount = got.filter((v) => v.author.kind === 'house').length
  const personCount = got.filter((v) => v.author.kind === 'person').length
  assert.equal(houseCount + personCount, VARIATIONS_PER_EFFECT)
})
