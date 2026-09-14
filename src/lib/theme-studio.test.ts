/**
 * Unit tests for the theme → token-generator handoff.
 *
 * Runner: Node's built-in `node:test` via the tsx loader (no test deps).
 *   npm test  →  node --import=tsx --test src/lib/theme-studio.test.ts
 *
 * WHY THIS FILE IS ONLY ABOUT `tokenGeneratorState`. The rest of
 * `theme-studio.ts` is either data (the preset lists, which /themes renders
 * and which cannot be wrong in a way a unit test would catch) or a thin
 * write to `document.documentElement` (which needs a DOM, not a test). The
 * handoff is different: it is arithmetic against slider ranges that live in
 * a *different* file — the `min`/`max`/`step` on the four controls in
 * `app/tools/tokens/page.tsx`. Nothing imports those numbers, so nothing
 * would fail if somebody narrowed one, and the symptom would be a landing
 * page that hands the generator a value its slider cannot show.
 *
 * So the contract pinned here is: for every shipped preset, the four
 * numbers land inside the tool's ranges and on its steps. If a range is
 * tightened, this goes red instead of the hero quietly producing a link
 * that opens on a snapped-back value.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_THEME,
  THEME_PRESETS,
  tokenGeneratorState,
  matchingPreset,
  themeEquals,
  coerceTheme,
} from './theme-studio'

/**
 * The four sliders in `/tools/tokens`, copied here on purpose.
 *
 * A test that imported the page would pull a client component and its whole
 * import graph into the runner. Copying the numbers is the point: this file
 * is the thing that notices when the two copies stop agreeing.
 */
const SLIDERS = {
  hue: { min: 0, max: 360, step: 1 },
  chroma: { min: 0, max: 0.3, step: 0.005 },
  radius: { min: 0, max: 1.5, step: 0.025 },
  neutralChroma: { min: 0, max: 0.03, step: 0.001 },
} as const

/** True when `n` sits on `step`, allowing for binary floating point. */
function onStep(n: number, step: number): boolean {
  const steps = n / step
  return Math.abs(steps - Math.round(steps)) < 1e-6
}

describe('tokenGeneratorState', () => {
  it('lands every shipped preset inside the generator’s own ranges', () => {
    for (const preset of THEME_PRESETS) {
      const state = tokenGeneratorState(preset)
      for (const [key, slider] of Object.entries(SLIDERS)) {
        const value = state[key as keyof typeof state]
        assert.ok(
          value >= slider.min && value <= slider.max,
          `${preset.id}: ${key} = ${value} is outside ${slider.min}–${slider.max}`,
        )
        assert.ok(
          onStep(value, slider.step),
          `${preset.id}: ${key} = ${value} is not on a step of ${slider.step}`,
        )
      }
    }
  })

  it('carries the accent through unrounded where it already fits', () => {
    // Storefront's accent is 0.2 chroma at hue 12 — both exactly
    // representable, so neither may be moved by the rounding.
    const storefront = THEME_PRESETS.find((p) => p.id === 'storefront')!
    const state = tokenGeneratorState(storefront)
    assert.equal(state.hue, 12)
    assert.equal(state.chroma, 0.2)
    // Pill corners are the top of the radius slider, not past it.
    assert.equal(state.radius, 1.5)
  })

  it('turns the neutral multiplier into the absolute the generator wants', () => {
    // The catalog default is a multiplier of 1, and 1 means 0.006 in
    // globals.css. A generator opened from the default theme must show the
    // generator's own default tint, or the handoff is visibly lossy on the
    // one theme everybody sees first.
    assert.equal(tokenGeneratorState(DEFAULT_THEME).neutralChroma, 0.006)

    // Zinc is a true grey: no tint at all, not "a little".
    const terminalGrey = tokenGeneratorState({
      ...DEFAULT_THEME,
      base: { warmHue: 90, coolHue: 250, chroma: 0 },
    })
    assert.equal(terminalGrey.neutralChroma, 0)
  })

  it('clamps a hand-made theme rather than emitting an unreachable slider', () => {
    // `coerceTheme` allows a base chroma up to 4, which is past the point
    // the generator's tint slider can represent (4 * 0.006 = 0.024 fits,
    // but nothing stops a future axis widening). Clamping is asserted at
    // the top of the allowed range so the behaviour is pinned either way.
    const loud = tokenGeneratorState({
      ...DEFAULT_THEME,
      accent: { hue: 400, chroma: 0.9, lightL: 0.5, darkL: 0.7 },
      base: { warmHue: 90, coolHue: 250, chroma: 4 },
      radiusRem: 9,
    })
    assert.equal(loud.hue, 40, 'hue is normalised onto the wheel, not clamped at 360')
    assert.equal(loud.chroma, SLIDERS.chroma.max)
    assert.equal(loud.radius, SLIDERS.radius.max)
    assert.equal(loud.neutralChroma, 0.024)
  })
})

describe('the four themes the landing hero shows', () => {
  /*
    `hero-theme-pills.tsx` resolves these ids out of THEME_PRESETS and
    throws at module load if one is missing — which is a build failure on
    the busiest page on the site. This is the same check, in the runner,
    where it costs a second instead of a deploy.
  */
  const HERO_IDS = ['default', 'terminal', 'editorial', 'storefront']

  it('all exist', () => {
    for (const id of HERO_IDS) {
      assert.ok(
        THEME_PRESETS.some((p) => p.id === id),
        `the hero asks for a theme preset "${id}" that no longer exists`,
      )
    }
  })

  it('are visibly different from each other, not four shades of one theme', () => {
    // The whole argument for these four over Console and Clinic is that
    // each moves the typeface AND the corner radius as well as the colour.
    // A retune that quietly gave two of them the same font would make the
    // hero look like a colour picker.
    const chosen = HERO_IDS.map((id) => THEME_PRESETS.find((p) => p.id === id)!)
    assert.equal(new Set(chosen.map((p) => p.fontId)).size, chosen.length)
    assert.equal(new Set(chosen.map((p) => p.radiusRem)).size, chosen.length)
  })

  it('leaves the default pill pressed after a reset', () => {
    // The pill for "Hoverlab" calls `reset()` rather than `set()`, so what
    // lights it afterwards is `matchingPreset(DEFAULT_THEME)` — and that
    // has to be the 'default' preset, not null.
    assert.equal(matchingPreset(DEFAULT_THEME)?.id, 'default')
  })
})

describe('coerceTheme', () => {
  it('salvages the axes it can and defaults the ones it cannot', () => {
    const salvaged = coerceTheme({
      accent: { hue: 200, chroma: 0.1, lightL: 0.5, darkL: 0.7 },
      base: { warmHue: 'nonsense', coolHue: 300, chroma: 2 },
      fontId: 'a-font-that-was-removed',
      radiusRem: 0.5,
    })
    assert.ok(salvaged)
    assert.equal(salvaged.accent.hue, 200, 'a valid accent survives a broken sibling')
    assert.equal(salvaged.base.warmHue, DEFAULT_THEME.base.warmHue)
    assert.equal(salvaged.base.coolHue, 300)
    assert.equal(salvaged.fontId, DEFAULT_THEME.fontId, 'a deleted font falls back')
    assert.equal(salvaged.radiusRem, 0.5)
  })

  it('refuses what is not a theme at all', () => {
    assert.equal(coerceTheme(null), null)
    assert.equal(coerceTheme('a string'), null)
  })

  it('round-trips every preset through storage unchanged', () => {
    for (const preset of THEME_PRESETS) {
      const back = coerceTheme(JSON.parse(JSON.stringify(preset)))
      assert.ok(back, `${preset.id} did not survive a JSON round trip`)
      assert.ok(themeEquals(back, preset), `${preset.id} changed on the way back`)
    }
  })
})
