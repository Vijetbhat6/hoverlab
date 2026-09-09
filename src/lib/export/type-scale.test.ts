/**
 * What makes the hand-written table in `type-scale.ts` safe.
 *
 * It parses `globals.css` — the actual stylesheet, read off disk, not a
 * copy — and asserts every number in the table matches what the browser
 * will really apply. Editing one without the other fails here, which is
 * the guarantee a build step would give, at five rows and no build step.
 *
 * Parsing CSS with regular expressions is normally a mistake. It is fine
 * in this narrow case: the targets are three single-selector rules whose
 * shape is fixed by the file above them, and if any of that changes the
 * test fails loudly with "rule not found" rather than passing on a
 * misparse. A failure here means read the CSS, not fix the regex.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { TYPE_SCALE, formatRange, formatTracking } from './type-scale'

const CSS = readFileSync(
  fileURLToPath(new URL('../../app/globals.css', import.meta.url)),
  'utf8',
)

/** The declaration body of the standalone `.type-x { … }` rule, or null. */
function ruleBody(className: string): string | null {
  /*
   * The leading `[{};]` is load-bearing, and the first version of this
   * test did not have it. Every one of these classes appears twice: once
   * in the grouped `.type-display, .type-hub, .type-page` selector that
   * sets the shared weight, and once in its own rule. Matching the class
   * alone finds the grouped one first — it comes earlier in the file — and
   * that body declares no font-size at all. Requiring the selector to
   * start after a brace or a semicolon is what excludes the
   * comma-separated appearance.
   */
  const match = CSS.match(new RegExp(`[{};]\\s*\\.${className}\\s*\\{([^}]*)\\}`))
  return match ? match[1] : null
}

function declaration(body: string, property: string): string | null {
  const match = body.match(new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`))
  return match ? match[1].trim() : null
}

/** `clamp(2.75rem, 1.55rem + 4.2vw, 4.5rem)` → `[44, 72]` in px. */
function clampBounds(value: string): [number, number] {
  const match = value.match(/clamp\(\s*([\d.]+)rem\s*,[^,]+,\s*([\d.]+)rem\s*\)/)
  assert.ok(match, `not a two-rem clamp: ${value}`)
  return [Number(match[1]) * 16, Number(match[2]) * 16]
}

for (const role of TYPE_SCALE) {
  test(`${role.className} matches globals.css`, () => {
    const body = ruleBody(role.className)
    assert.ok(body, `no .${role.className} rule in globals.css`)

    const fontSize = declaration(body, 'font-size')
    assert.ok(fontSize, `.${role.className} declares no font-size`)
    const [min, max] = clampBounds(fontSize)
    assert.equal(min, role.minPx, `.${role.className} min`)
    assert.equal(max, role.maxPx, `.${role.className} max`)

    const lineHeight = declaration(body, 'line-height')
    assert.equal(Number(lineHeight), role.lineHeight, `.${role.className} line-height`)

    const tracking = declaration(body, 'letter-spacing')
    assert.equal(tracking, `${role.letterSpacing}em`, `.${role.className} letter-spacing`)
  })
}

test('all three roles share the weight the grouped selector sets', () => {
  // The stylesheet sets font-weight once, on `.type-display, .type-hub,
  // .type-page`. The table repeats it per role because a Figma text layer
  // needs it on every layer — this asserts the repetition still agrees
  // with the single source it was copied from.
  const grouped = CSS.match(
    /\.type-display,\s*\.type-hub,\s*\.type-page\s*\{([^}]*)\}/,
  )
  assert.ok(grouped, 'the grouped .type-* selector is gone from globals.css')

  const weight = declaration(grouped[1], 'font-weight')
  for (const role of TYPE_SCALE) {
    assert.equal(Number(weight), role.fontWeight, `${role.className} weight`)
  }
})

test('the scale descends, with no two roles the same size', () => {
  for (let i = 1; i < TYPE_SCALE.length; i += 1) {
    assert.ok(
      TYPE_SCALE[i].maxPx < TYPE_SCALE[i - 1].maxPx,
      `${TYPE_SCALE[i].className} is not smaller than ${TYPE_SCALE[i - 1].className}`,
    )
  }
})

test('every role is fluid — the clamp has two different ends', () => {
  // A role whose min equals its max is a fixed size wearing a clamp, and
  // the two-ended label the sheet prints would read "48 → 48px".
  for (const role of TYPE_SCALE) {
    assert.ok(role.minPx < role.maxPx, `${role.className} does not grow`)
  }
})

test('the labels read the way the sheet prints them', () => {
  assert.equal(formatRange(44, 72), '44 → 72px')
  assert.equal(formatTracking(-0.032), '-0.032em')
})
