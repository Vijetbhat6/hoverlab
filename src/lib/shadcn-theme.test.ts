import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_THEME,
  TOKEN_NAMES,
  THEME_PRESETS,
  type ThemeState,
  buildTheme,
  chartCollisions,
  decodeTheme,
  encodeTheme,
  hexToTokenValue,
  themeContrast,
  themeCss,
  themeRegistryItem,
  tokenToHex,
} from './shadcn-theme'

/**
 * Two things here reach a stranger's machine: the CSS someone pastes into
 * their globals.css, and the JSON the shadcn CLI writes into their project
 * off a URL. The URL is the dangerous one — it is decoded on our server
 * from a string anyone can author — so most of what follows is about what
 * `decodeTheme` refuses.
 */

/* ------------------------------------------------------------------ *
 *  Derivation
 * ------------------------------------------------------------------ */

test('every token is present in both modes', () => {
  const { light, dark } = buildTheme(DEFAULT_THEME)
  for (const name of TOKEN_NAMES) {
    assert.ok(light[name], `light is missing --${name}`)
    assert.ok(dark[name], `dark is missing --${name}`)
  }
  // A mode short of the other is the seam that shows up in Figma as a
  // variable with one mode filled in.
  assert.equal(Object.keys(light).length, Object.keys(dark).length)
})

test('the hue knob moves the brand and leaves destructive alone', () => {
  const a = buildTheme(DEFAULT_THEME)
  const b = buildTheme({ ...DEFAULT_THEME, hue: 20 })
  assert.notEqual(a.light.primary, b.light.primary)
  // A warning that shifts with the brand stops reading as a warning.
  assert.equal(a.light.destructive, b.light.destructive)
})

test('an override wins over the derived value, per mode', () => {
  const state: ThemeState = { ...DEFAULT_THEME, light: { primary: '#ff0000' } }
  const { light, dark } = buildTheme(state)
  assert.equal(light.primary, '#ff0000')
  assert.notEqual(dark.primary, '#ff0000')
})

test('tokens are written in a stable order whatever the override order', () => {
  const one = buildTheme({ ...DEFAULT_THEME, light: { ring: '#fff', primary: '#000' } })
  const two = buildTheme({ ...DEFAULT_THEME, light: { primary: '#000', ring: '#fff' } })
  assert.deepEqual(Object.keys(one.light), Object.keys(two.light))
  assert.deepEqual(Object.keys(one.light), [...TOKEN_NAMES])
})

/* ------------------------------------------------------------------ *
 *  CSS
 * ------------------------------------------------------------------ */

test('the CSS carries all three blocks a v4 theme needs', () => {
  const css = themeCss(DEFAULT_THEME)
  assert.match(css, /^\/\*/)
  assert.match(css, /:root \{/)
  assert.match(css, /\.dark \{/)
  // Without @theme inline the variables exist and no utility uses them.
  assert.match(css, /@theme inline \{/)
  assert.match(css, /--color-primary: var\(--primary\);/)
  assert.match(css, /--radius: 0\.625rem;/)
  for (const name of TOKEN_NAMES) {
    assert.ok(css.includes(`--${name}:`), `CSS is missing --${name}`)
  }
})

/* ------------------------------------------------------------------ *
 *  Registry item
 * ------------------------------------------------------------------ */

test('the registry item is the shape the CLI reads', () => {
  const item = themeRegistryItem(DEFAULT_THEME)
  assert.equal(item.$schema, 'https://ui.shadcn.com/schema/registry-item.json')
  assert.equal(item.type, 'registry:theme')
  assert.ok(item.name)
  // Keys are bare, without the leading `--` — matching the base item the
  // registry already publishes.
  assert.ok(item.cssVars.light.primary)
  assert.ok(item.cssVars.dark.primary)
  assert.equal(item.cssVars.light.radius, '0.625rem')
  assert.ok(!('--primary' in item.cssVars.light))
})

/* ------------------------------------------------------------------ *
 *  The URL
 * ------------------------------------------------------------------ */

test('a theme survives the round trip through a URL', () => {
  const state: ThemeState = {
    hue: 42,
    chroma: 0.11,
    radius: 1.25,
    neutralChroma: 0.02,
    light: { primary: '#ff0000' },
    dark: { ring: 'oklch(0.5 0.1 42)' },
  }
  assert.deepEqual(decodeTheme(encodeTheme(state)), state)
})

test('the default theme encodes to almost nothing', () => {
  // Only what differs is carried, so a default-ish theme makes a short
  // command rather than a wrapped one.
  assert.ok(encodeTheme(DEFAULT_THEME).length < 8)
  assert.deepEqual(decodeTheme(encodeTheme(DEFAULT_THEME)), DEFAULT_THEME)
})

test('every preset round-trips', () => {
  for (const preset of THEME_PRESETS) {
    const state = { ...DEFAULT_THEME, ...preset.state }
    assert.deepEqual(decodeTheme(encodeTheme(state)), state, preset.id)
  }
})

test('junk in the parameter yields null rather than a theme', () => {
  for (const bad of ['', 'not base64!!', 'eyJ', null, undefined]) {
    assert.equal(decodeTheme(bad), null, JSON.stringify(bad))
  }
})

test('a payload that is not an object is refused', () => {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  assert.equal(decodeTheme(encode([1, 2, 3])), null)
  assert.equal(decodeTheme(encode('hello')), null)
  assert.equal(decodeTheme(encode(null)), null)
})

test('out-of-range numbers are clamped, not trusted', () => {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  const decoded = decodeTheme(encode({ h: 9999, c: -5, r: 1e9, n: 4 }))
  assert.ok(decoded)
  assert.equal(decoded.hue, 360)
  assert.equal(decoded.chroma, 0)
  assert.equal(decoded.radius, 3)
  assert.equal(decoded.neutralChroma, 0.05)
})

test('a non-numeric knob falls back rather than reaching the CSS', () => {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  const decoded = decodeTheme(encode({ h: 'red', c: null, r: {} }))
  assert.ok(decoded)
  assert.equal(decoded.hue, DEFAULT_THEME.hue)
  assert.equal(decoded.chroma, DEFAULT_THEME.chroma)
  assert.equal(decoded.radius, DEFAULT_THEME.radius)
})

test('an override that could break out of the rule is dropped', () => {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')

  const decoded = decodeTheme(
    encode({
      l: {
        primary: 'red; } body { display: none',
        ring: '#00ff00',
        background: 'url(https://evil.example/x)',
        border: 'oklch(0.5 0.1 20)',
        'not-a-token': '#fff',
        muted: 12345,
        card: '#' + 'a'.repeat(200),
      },
    }),
  )

  assert.ok(decoded)
  assert.deepEqual(decoded.light, { ring: '#00ff00', border: 'oklch(0.5 0.1 20)' })

  // And the CSS built from it contains none of the rejected values.
  const css = themeCss(decoded)
  assert.doesNotMatch(css, /display: none/)
  assert.doesNotMatch(css, /evil\.example/)
})

test('an unknown token name never reaches the output', () => {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  const decoded = decodeTheme(encode({ d: { 'sidebar-mystery': '#fff' } }))
  assert.ok(decoded)
  assert.deepEqual(decoded.dark, {})
})

/* ------------------------------------------------------------------ *
 *  Colour helpers and checks
 * ------------------------------------------------------------------ */

test('tokens convert to hex where a hex exists, and refuse where it does not', () => {
  assert.equal(tokenToHex('#ff0000'), '#ff0000')
  assert.match(tokenToHex('oklch(0.5 0.1 250)') ?? '', /^#[0-9a-f]{6}$/)
  // The translucent dark-mode border genuinely has no opaque hex.
  assert.equal(tokenToHex('oklch(1 0 0 / 10%)'), null)
  assert.equal(tokenToHex('nonsense'), null)
})

test('a hex from a colour input becomes an OKLCH token value', () => {
  const value = hexToTokenValue('#ff0000')
  assert.match(value, /^oklch\([\d.]+ [\d.]+ [\d.]+\)$/)
  assert.equal(tokenToHex(value), '#ff0000')
})

test('the default theme passes AA on every text pair it can measure', () => {
  const findings = themeContrast(DEFAULT_THEME)
  assert.ok(findings.length >= 16, `only ${findings.length} pairs were measurable`)
  const failures = findings.filter((f) => !f.passes)
  assert.deepEqual(
    failures.map((f) => `${f.mode}: ${f.label} at ${f.ratio.toFixed(2)}`),
    [],
  )
})

test('a deliberately bad override is reported as failing', () => {
  const findings = themeContrast({
    ...DEFAULT_THEME,
    light: { foreground: '#eeeeee' },
  })
  assert.ok(findings.some((f) => f.mode === 'light' && f.label === 'Body text' && !f.passes))
})

test('the generated chart ramp survives all three dichromacies', () => {
  /*
    The claim the page makes, and the exact size of it.

    Five categorical colours that a dichromat can separate is close to the
    limit of what a five-colour palette can do, and the solver in
    `chartRamp` is what gets it there — measured across the whole hue
    wheel, no fixed lightness order manages it.

    Achromatopsia is deliberately *not* in this assertion. It is pure
    luminance, so the only thing that separates five series is a lightness
    span wide enough that the palest is nearly white — which fixes a
    0.003%-prevalence case by making the palette unusable for everyone. It
    is reported on the page instead of being designed around here.
  */
  const dichromacies = ['Protanopia', 'Deuteranopia', 'Tritanopia']

  for (const preset of THEME_PRESETS) {
    const findings = chartCollisions({ ...DEFAULT_THEME, ...preset.state })
    assert.deepEqual(
      findings.filter((f) => dichromacies.includes(f.vision)),
      [],
      preset.id,
    )
  }
})

test('overriding two chart colours to the same value is caught', () => {
  const findings = chartCollisions({
    ...DEFAULT_THEME,
    light: { 'chart-1': '#22c55e', 'chart-2': '#22c55e' },
  })
  assert.ok(findings.length, 'identical chart colours went unreported')
  assert.ok(
    findings.every((f) => f.pairs.some(([a, b]) => a === 'chart-1' && b === 'chart-2')),
  )
})

test('a red-green chart pair is caught under deuteranopia', () => {
  const findings = chartCollisions({
    ...DEFAULT_THEME,
    light: { 'chart-1': '#e5484d', 'chart-2': '#54a15a' },
  })
  assert.ok(findings.some((f) => f.vision === 'Deuteranopia'))
})
