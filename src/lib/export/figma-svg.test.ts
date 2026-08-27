import { test } from 'node:test'
import assert from 'node:assert/strict'

import { buildFigmaSheet } from './figma-svg'
import { DEFAULT_BRAND_COLOR } from '../brand-presets'

/**
 * These guard the format, not the layout.
 *
 * Every assertion here is something Figma's SVG parser cares about and a
 * browser would forgive, which is exactly the class of bug that would ship
 * unnoticed: the sheet renders perfectly in a preview and pastes as
 * nothing, or as forty black rectangles.
 */

test('the sheet is a single well-formed svg element', () => {
  const { svg, width, height } = buildFigmaSheet()
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)
  assert.ok(svg.trimEnd().endsWith('</svg>'))
  assert.equal(svg.split('<svg ').length - 1, 1)
  assert.ok(width > 0 && height > 0)
  assert.match(svg, new RegExp(`viewBox="0 0 ${width} ${height}"`))
})

test('no colour reaches the output in a form Figma cannot parse', () => {
  const { svg } = buildFigmaSheet()
  // Figma's importer resolves neither CSS variables nor oklch(). Either
  // one arriving here means a token was passed through unresolved.
  assert.ok(!svg.includes('oklch('), 'oklch() must be resolved to hex first')
  assert.ok(!svg.includes('var(--'), 'CSS variables do not survive the clipboard')
  assert.ok(!svg.includes('hsl('), 'hsl() channels must be resolved to hex first')
  assert.ok(!/currentColor/i.test(svg), 'currentColor has no meaning off-page')

  // Every fill is a hex literal or the explicit `none` on the root.
  for (const [, value] of svg.matchAll(/fill="([^"]+)"/g)) {
    assert.match(value, /^(#[0-9a-fA-F]{3,8}|none)$/, `unparseable fill: ${value}`)
  }
})

test('presentation is on the elements, not in a stylesheet', () => {
  const { svg } = buildFigmaSheet()
  // A <style> block or class attributes would be dropped on import and
  // take every colour in the sheet with them.
  assert.ok(!svg.includes('<style'), 'a <style> block does not survive import')
  assert.ok(!svg.includes('class="'), 'class attributes have nothing to resolve against')
})

test('layers arrive named after the tokens they carry', () => {
  const { svg, tokenCount } = buildFigmaSheet()
  // Figma names layers from `id`. Without these the paste is anonymous
  // rectangles, which is most of the value gone.
  assert.match(svg, /id="light-primary"/)
  assert.match(svg, /id="dark-primary"/)
  assert.match(svg, /id="radius-lg"/)
  assert.ok(tokenCount > 10, `expected a full token set, got ${tokenCount}`)
})

test('the brand actually moves the sheet', () => {
  const teal = buildFigmaSheet({ ...DEFAULT_BRAND_COLOR, hue: 180, chroma: 0.15 })
  const rose = buildFigmaSheet({ ...DEFAULT_BRAND_COLOR, hue: 20, chroma: 0.15 })
  assert.notEqual(
    teal.svg,
    rose.svg,
    'two different brands produced an identical sheet — the brand is being ignored',
  )
})

test('a hostile name cannot break out of the markup', () => {
  const { svg } = buildFigmaSheet(DEFAULT_BRAND_COLOR, {
    name: '</text><script>alert(1)</script>',
  })
  assert.ok(!svg.includes('<script'), 'the name escaped into markup')
  assert.match(svg, /&lt;script&gt;/)
})
