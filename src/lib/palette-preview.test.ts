/**
 * Unit tests for the palette → token derivation.
 *
 * Runner: Node's built-in `node:test` via the tsx loader (no test deps).
 *   npm test  →  node --import=tsx --test src/lib/palette-preview.test.ts
 *
 * The derivation is the part a user never sees and always feels: they pick
 * four colours, and eighteen tokens they did not pick decide whether the
 * pricing table is readable. What is pinned here is the set of rules that
 * make those eighteen defensible — the button label chosen by measurement
 * rather than by a lightness threshold, the hover surface that must not
 * become the brand colour, the hue blend that must not go the long way round
 * the wheel, and a dark scheme that stays on the ladder every block in the
 * catalog was drawn against.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { contrastRatio } from './color-tools'
import {
  auditContrast,
  decodePalette,
  DEFAULT_PALETTE,
  deriveTokens,
  encodePalette,
  hexToOklch,
  mixOklch,
  PALETTE_PRESETS,
  paletteToCss,
  readableOn,
  tokensToStyle,
} from './palette-preview'

describe('readableOn', () => {
  it('picks by measurement, not by a lightness threshold', () => {
    // A mid-tone blue: light enough that a naive threshold says "dark text",
    // and white is in fact the higher-contrast choice.
    assert.equal(readableOn('#4f46e5'), '#ffffff')
    assert.equal(readableOn('#ffffff'), '#0a0a0a')
    assert.equal(readableOn('#000000'), '#ffffff')
    // Yellow is the case a threshold always gets wrong.
    assert.equal(readableOn('#facc15'), '#0a0a0a')
  })

  it('always clears AA against the colour it was chosen for', () => {
    for (const hex of ['#4f46e5', '#15803d', '#facc15', '#0ea5e9', '#b45309']) {
      const ratio = contrastRatio(readableOn(hex), hex) ?? 0
      assert.ok(ratio >= 4.5, `${hex} label only reached ${ratio.toFixed(2)}:1`)
    }
  })
})

describe('mixOklch', () => {
  it('takes the short way round the hue wheel', () => {
    // 350° and 10° are twenty degrees apart. Averaging the numbers gives
    // 180° — the exact opposite colour — which is the bug this exists for.
    const mixed = mixOklch({ l: 0.5, c: 0.1, h: 350 }, { l: 0.5, c: 0.1, h: 10 }, 0.5)
    assert.equal(Math.round(mixed.h), 0)
  })

  it('interpolates lightness linearly and clamps the amount', () => {
    const from = { l: 0.2, c: 0, h: 0 }
    const to = { l: 1, c: 0, h: 0 }
    // Compared with a tolerance rather than exactly: the value is a float
    // sum, and pinning 0.6000000000000001 would be pinning the arithmetic
    // rather than the behaviour.
    assert.ok(Math.abs(mixOklch(from, to, 0.5).l - 0.6) < 1e-9)
    assert.equal(mixOklch(from, to, 2).l, 1, 'amount above 1 is clamped')
    assert.equal(mixOklch(from, to, -1).l, 0.2, 'and below 0')
  })
})

describe('deriveTokens', () => {
  it('uses the light palette exactly as it was picked', () => {
    const set = deriveTokens(DEFAULT_PALETTE, 'light')
    // Round-tripping through OKLCH and back must land on the same colour.
    assert.equal(set.byName['--background'].toLowerCase(), '#ffffff')
    assert.equal(set.byName['--primary'].toLowerCase(), '#4f46e5')
  })

  it('emits every token a block reads', () => {
    const set = deriveTokens(DEFAULT_PALETTE, 'light')
    for (const name of [
      '--background',
      '--foreground',
      '--card',
      '--card-foreground',
      '--popover',
      '--primary',
      '--primary-foreground',
      '--secondary',
      '--muted',
      '--muted-foreground',
      '--accent',
      '--accent-foreground',
      '--destructive',
      '--border',
      '--input',
      '--ring',
    ]) {
      assert.ok(set.byName[name], `${name} was not derived`)
    }
  })

  it('keeps --accent a surface rather than the accent colour', () => {
    /*
      The trap this guards: `--accent` is what a menu item turns when you
      hover it. A saturated brand colour here gives a UI that flashes
      fluorescent on every hover, and 18 files in this repo read the token
      that way.
    */
    const set = deriveTokens({ ...DEFAULT_PALETTE, accent: '#ff0000' }, 'light')
    const accent = hexToOklch(set.byName['--accent'])
    assert.ok(accent.l > 0.9, 'a hover surface sits one step off the background')
    assert.ok(accent.c < 0.06, 'and carries only a trace of the accent chroma')
    // The hue survives, which is the whole point of taking the input at all.
    assert.ok(accent.h < 60 || accent.h > 330)
  })

  it('lands the dark scheme on the anchors the catalog was drawn against', () => {
    const set = deriveTokens(DEFAULT_PALETTE, 'dark')
    const background = hexToOklch(set.byName['--background'])
    const foreground = hexToOklch(set.byName['--foreground'])
    assert.ok(Math.abs(background.l - 0.145) < 0.02)
    assert.ok(Math.abs(foreground.l - 0.985) < 0.02)
    assert.ok(background.l < foreground.l, 'dark mode is not an inversion of the numbers')
  })

  it('raises the brand in the dark rather than reusing the light value', () => {
    const light = hexToOklch(deriveTokens(DEFAULT_PALETTE, 'light').byName['--primary'])
    const dark = hexToOklch(deriveTokens(DEFAULT_PALETTE, 'dark').byName['--primary'])
    assert.ok(dark.l > light.l)
    assert.ok(Math.abs(dark.h - light.h) < 8, 'the hue is the identity and must survive')
  })

  it('ties the ring to the primary, always', () => {
    const set = deriveTokens({ ...DEFAULT_PALETTE, primary: '#15803d' }, 'light')
    assert.equal(set.byName['--ring'], set.byName['--primary'])
  })

  it('does not recolour destructive to match the brand', () => {
    const green = deriveTokens({ ...DEFAULT_PALETTE, primary: '#15803d' }, 'light')
    const blue = deriveTokens({ ...DEFAULT_PALETTE, primary: '#0000ff' }, 'light')
    assert.equal(green.byName['--destructive'], blue.byName['--destructive'])
  })

  it('tints the neutrals from the background, not from the brand', () => {
    const warm = deriveTokens(
      { ...DEFAULT_PALETTE, background: '#fdfaf4', foreground: '#2b2118' },
      'light',
    )
    const muted = hexToOklch(warm.byName['--muted'])
    // A warm paper background yields warm greys — a hue in the yellow/orange
    // half of the wheel rather than a dead neutral.
    assert.ok(muted.h > 20 && muted.h < 140, `muted hue was ${muted.h}`)
  })

  it('lifts the card away from the text so its border is not the only edge', () => {
    const set = deriveTokens({ ...DEFAULT_PALETTE, background: '#f2f2f2' }, 'light')
    const background = hexToOklch(set.byName['--background'])
    const card = hexToOklch(set.byName['--card'])
    assert.ok(card.l > background.l, 'dark text on a light page means cards lift')
  })
})

describe('auditContrast', () => {
  it('checks the pairs that carry text, at the level they owe', () => {
    const checks = auditContrast(deriveTokens(DEFAULT_PALETTE, 'light'))
    assert.ok(checks.length >= 7)
    const body = checks.find((check) => check.label === 'Body text on the page')!
    assert.equal(body.required, 4.5)
    assert.ok(body.ratio > 15, 'near-black on white')
    assert.ok(body.passes)

    const borders = checks.find((check) => check.label.startsWith('Borders'))!
    assert.equal(borders.required, 3, 'a boundary is non-text contrast')
  })

  it('fails a palette that looks fine and is not', () => {
    // Light grey text on white: the single most common palette failure, and
    // one that a swatch grid shows as two perfectly pleasant rectangles.
    const checks = auditContrast(
      deriveTokens({ ...DEFAULT_PALETTE, foreground: '#a1a1aa' }, 'light'),
    )
    const body = checks.find((check) => check.label === 'Body text on the page')!
    assert.equal(body.passes, false)
    assert.ok(body.ratio < 4.5)
  })

  it('agrees with the label chosen for the primary button', () => {
    for (const preset of PALETTE_PRESETS) {
      const checks = auditContrast(deriveTokens(preset, 'light'))
      const button = checks.find((check) => check.label === 'Primary button label')!
      assert.ok(button.passes, `${preset.name}: button label at ${button.ratio}:1`)
    }
  })

  it('keeps body text legible in the derived dark scheme of every preset', () => {
    for (const preset of PALETTE_PRESETS) {
      const checks = auditContrast(deriveTokens(preset, 'dark'))
      const body = checks.find((check) => check.label === 'Body text on the page')!
      assert.ok(body.passes, `${preset.name}: dark body text at ${body.ratio}:1`)
    }
  })
})

describe('tokensToStyle', () => {
  it('is a flat record of custom properties, radius included', () => {
    const style = tokensToStyle(deriveTokens(DEFAULT_PALETTE, 'light'), 0.75)
    assert.equal(style['--radius'], '0.75rem')
    assert.match(style['--background'], /^oklch\(/)
    assert.ok(Object.keys(style).every((key) => key.startsWith('--')))
  })
})

describe('paletteToCss', () => {
  it('emits the shadcn shape, both schemes', () => {
    const css = paletteToCss(DEFAULT_PALETTE)
    assert.ok(css.includes(':root {'))
    assert.ok(css.includes('.dark {'))
    assert.ok(css.includes('--radius: 0.625rem;'))
    assert.ok(css.includes('--muted-foreground:'))
    // Two schemes means every colour token appears twice.
    assert.equal(css.match(/--primary:/g)?.length, 2)
  })
})

describe('encodePalette / decodePalette', () => {
  it('round-trips', () => {
    const encoded = encodePalette(DEFAULT_PALETTE)
    assert.deepEqual(decodePalette(encoded), DEFAULT_PALETTE)
  })

  it('rejects a mangled code rather than half-decoding it', () => {
    assert.equal(decodePalette('nope'), null)
    assert.equal(decodePalette('ffffff-0f172a-4f46e5-0ea5e9'), null, 'no radius')
    assert.equal(decodePalette('zzzzzz-0f172a-4f46e5-0ea5e9-0.625'), null)
    assert.equal(decodePalette('ffffff-0f172a-4f46e5-0ea5e9-99'), null, 'absurd radius')
  })
})

describe('advisory checks', () => {
  it('reports the border pair without scoring it as a failure', () => {
    /*
      shadcn's own default border does not clear 3:1 against its own
      background, and neither does almost any real theme's. Counting it as a
      failure would put a permanent red mark on every palette, which is how a
      contrast panel gets ignored.
    */
    const checks = auditContrast(deriveTokens(DEFAULT_PALETTE, 'light'))
    const border = checks.find((check) => check.label.startsWith('Borders'))!
    assert.equal(border.advisory, true)
    assert.ok(border.ratio > 1, 'it is still measured and still shown')

    // Nothing that carries text is advisory — those are real failures.
    for (const check of checks.filter((c) => c.required === 4.5)) {
      assert.notEqual(check.advisory, true, `${check.label} must not be excused`)
    }
  })
})
