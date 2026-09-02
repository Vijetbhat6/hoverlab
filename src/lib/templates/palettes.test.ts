import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  TEMPLATE_PALETTES,
  getPalette,
  paletteCss,
  paletteSwatch,
  paletteVars,
} from './palettes'

/* ------------------------------------------------------------------ *
 *  Contrast
 * ------------------------------------------------------------------ *
 *
 * The reason this file exists. A palette is four dozen numbers typed by
 * hand, and the failure mode is not a crash — it is a template that ships
 * looking fine and measures 3.8:1 on its own primary button. Signal's green
 * did exactly that on the first pass at L 30%; the loop below is what
 * caught it, and 24% is what it caught it into.
 */

/** Bare HSL channels → sRGB in 0..1. */
function hslToRgb(triple: string): [number, number, number] {
  const [h, s, l] = triple.replace(/%/g, '').split(/\s+/).map(Number)
  const sat = s / 100
  const lig = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = sat * Math.min(lig, 1 - lig)
  const f = (n: number) =>
    lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)]
}

function relativeLuminance(triple: string): number {
  const [r, g, b] = hslToRgb(triple)
  const lin = (v: number) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrast(fg: string, bg: string): number {
  const a = relativeLuminance(fg)
  const b = relativeLuminance(bg)
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Pairs a block can actually put on screen.
 *
 * The last three are the ones that get forgotten: `--primary` is not only a
 * button fill, it is link text and chip text, and it lands on all three
 * surfaces. A palette tuned only for white-on-primary passes the obvious
 * check and fails every link.
 */
const TEXT_PAIRS: Array<[string, string]> = [
  ['foreground', 'background'],
  ['card-foreground', 'card'],
  ['popover-foreground', 'popover'],
  ['primary-foreground', 'primary'],
  ['secondary-foreground', 'secondary'],
  ['muted-foreground', 'muted'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'card'],
  ['accent-foreground', 'accent'],
  ['destructive-foreground', 'destructive'],
  ['primary', 'background'],
  ['primary', 'card'],
  ['primary', 'muted'],
]

for (const palette of TEMPLATE_PALETTES) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${palette.id}/${theme} clears WCAG AA on every text pair`, () => {
      const tokens = palette[theme]
      for (const [fg, bg] of TEXT_PAIRS) {
        assert.ok(tokens[fg], `${palette.id}/${theme} is missing --${fg}`)
        assert.ok(tokens[bg], `${palette.id}/${theme} is missing --${bg}`)

        const ratio = contrast(tokens[fg], tokens[bg])
        assert.ok(
          ratio >= 4.5,
          `${palette.id}/${theme}: --${fg} on --${bg} is ${ratio.toFixed(2)}:1, under the 4.5:1 AA floor`,
        )
      }
    })
  }
}

/* ------------------------------------------------------------------ *
 *  Shape of the data
 * ------------------------------------------------------------------ */

test('ids are unique', () => {
  const ids = TEMPLATE_PALETTES.map((p) => p.id)
  assert.equal(new Set(ids).size, ids.length)
})

test('light and dark define exactly the same tokens', () => {
  // A token present in one theme and absent from the other inherits the
  // shared file's value there, which is how a palette ends up half indigo.
  for (const palette of TEMPLATE_PALETTES) {
    assert.deepEqual(
      Object.keys(palette.light).sort(),
      Object.keys(palette.dark).sort(),
      `${palette.id} defines different tokens per theme`,
    )
  }
})

test('every value is bare HSL channels, not an hsl() call', () => {
  // The whole Tailwind v3 alpha suffix depends on this.
  for (const palette of TEMPLATE_PALETTES) {
    for (const theme of ['light', 'dark'] as const) {
      for (const [name, value] of Object.entries(palette[theme])) {
        assert.match(
          value,
          /^\d+(\.\d+)? \d+(\.\d+)?% \d+(\.\d+)?%$/,
          `${palette.id}/${theme} --${name} is "${value}", not bare channels`,
        )
      }
    }
  }
})

/* ------------------------------------------------------------------ *
 *  Rendering
 * ------------------------------------------------------------------ */

test('the generated stylesheet is complete, not a patch', () => {
  // The build script's merge is per-path — this file replaces the shared
  // one rather than cascading after it, so anything missing here is missing
  // from the customer's project.
  const css = paletteCss(TEMPLATE_PALETTES[0])
  assert.match(css, /@tailwind base;/)
  assert.match(css, /@tailwind utilities;/)
  assert.match(css, /@apply border-border/)
  assert.match(css, /prefers-reduced-motion: reduce/)
  assert.match(css, /:root \{/)
  assert.match(css, /\.dark \{/)
})

test('the stylesheet carries the palette radius', () => {
  const graphite = getPalette('graphite')!
  assert.match(paletteCss(graphite), /--radius: 0\.25rem;/)
})

test('preview vars wrap the channels back into hsl()', () => {
  // Hoverlab is Tailwind v4: `var(--primary)` has to be a whole colour
  // there, and bare channels render as inherited black.
  const vars = paletteVars(TEMPLATE_PALETTES[0])
  for (const [name, value] of Object.entries(vars)) {
    if (name === '--radius') continue
    assert.match(value, /^hsl\(/, `${name} is "${value}"`)
  }
})

test('preview vars follow the theme', () => {
  const p = getPalette('graphite')!
  assert.notEqual(
    paletteVars(p, 'light')['--primary'],
    paletteVars(p, 'dark')['--primary'],
  )
})

test('the swatch is a renderable colour', () => {
  for (const palette of TEMPLATE_PALETTES) {
    assert.match(paletteSwatch(palette), /^hsl\(\d/)
  }
})

test('getPalette is undefined for unknown and missing ids', () => {
  assert.equal(getPalette('no-such-palette'), undefined)
  assert.equal(getPalette(undefined), undefined)
})
