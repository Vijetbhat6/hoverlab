/**
 * Unit tests for the Figma icon sheets.
 *
 * Runner: Node's built-in `node:test` via the tsx loader.
 *   node --import=tsx --test src/lib/assets/icon-sheets.test.ts
 *
 * As with the other asset generators, a test that asserts a path string breaks
 * on every visual improvement and proves nothing about whether the sheet works
 * in Figma. What is pinned instead is what is invisible in a preview:
 *
 *   - the transparent bounds rectangle does NOT inherit the root stroke
 *     (it would paste as a visible box around every icon)
 *   - layer names are unique, or Figma silently renames the second `arrow-up`
 *   - an unknown element throws instead of shipping a half-drawn icon
 *   - the sheet a designer downloads never says `currentColor`, and the page
 *     sample never says black
 *   - a licence that would end the XML comment early is refused
 *   - the category snapshot agrees with itself
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  CATEGORY_PRIORITY,
  SHEET,
  buildSampleSvg,
  buildSheet,
  categoryLabel,
  cellPosition,
  elementMarkup,
  escapeXml,
  orderCategories,
  sheetFileName,
  sheetSize,
  type SheetIcon,
} from './icon-sheets'

const ARROW: SheetIcon = {
  slug: 'arrow-right',
  nodes: [
    ['path', { d: 'M5 12h14', key: 'a' }],
    ['path', { d: 'm12 5 7 7-7 7', key: 'b' }],
  ],
}
const MINUS: SheetIcon = { slug: 'minus', nodes: [['path', { d: 'M5 12h14', key: 'c' }]] }
const DOT: SheetIcon = { slug: 'dot', nodes: [['circle', { cx: '12', cy: '12', r: '1', key: 'd' }]] }

const LICENSE = 'ISC License\nPermission to use, copy, modify.'

test('elementMarkup drops the React-only key attribute', () => {
  assert.equal(elementMarkup(['path', { d: 'M5 12h14', key: 'abc' }]), '<path d="M5 12h14" />')
})

test('elementMarkup escapes attribute values', () => {
  assert.match(elementMarkup(['path', { d: 'a"b<c&d' }]), /d="a&quot;b&lt;c&amp;d"/)
  assert.equal(escapeXml('<&>"'), '&lt;&amp;&gt;&quot;')
})

test('an unknown element throws rather than shipping a half-drawn icon', () => {
  assert.throws(() => elementMarkup(['text', { x: 1 }]), /unsupported element <text>/)
})

test('the bounds rectangle states stroke="none" so it cannot inherit the root stroke', () => {
  const svg = buildSheet([ARROW], { name: 'Test', license: LICENSE })
  const bounds = svg.split('\n').find((line) => line.includes('arrow-right bounds'))
  assert.ok(bounds, 'no bounds rectangle')
  assert.match(bounds, /fill="none"/)
  assert.match(bounds, /stroke="none"/)
})

test('the bounds rectangle is the full 24px cell, whatever the drawing covers', () => {
  const svg = buildSheet([MINUS], { name: 'Test', license: LICENSE })
  assert.match(svg, /id="minus bounds" width="24" height="24"/)
})

test('every icon is a group named by its slug, and names are unique', () => {
  const svg = buildSheet([ARROW, MINUS, DOT], { name: 'Test', license: LICENSE })
  const ids = [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1])
  assert.equal(new Set(ids).size, ids.length, 'duplicate id in one sheet')
  for (const slug of ['arrow-right', 'minus', 'dot']) assert.ok(ids.includes(slug), slug)
})

test('the same icon twice in one sheet is refused', () => {
  assert.throws(() => buildSheet([ARROW, ARROW], { name: 'Test', license: LICENSE }), /appears twice/)
})

test('stroke settings sit on the root once, not on every group', () => {
  const svg = buildSheet([ARROW, MINUS, DOT], { name: 'Test', license: LICENSE })
  assert.equal(svg.match(/stroke-linecap="round"/g)?.length, 1)
  assert.match(svg, /<svg [^>]*fill="none"[^>]*stroke="#000000"/)
})

test('the downloadable sheet never depends on a CSS colour', () => {
  const svg = buildSheet([ARROW], { name: 'Test', license: LICENSE })
  assert.doesNotMatch(svg, /currentColor/)
  assert.doesNotMatch(svg, /<style|:root/)
})

test('the page sample follows the theme instead of being black', () => {
  const sample = buildSampleSvg([ARROW, MINUS])
  assert.match(sample, /stroke="currentColor"/)
  assert.doesNotMatch(sample, /#000/)
  assert.match(sample, /aria-hidden="true"/)
})

test('the licence is embedded, and one that would close the comment is refused', () => {
  const svg = buildSheet([ARROW], { name: 'Test', license: LICENSE })
  assert.match(svg, /^<!--\nISC License/)
  assert.throws(() => buildSheet([ARROW], { name: 'Test', license: 'a -- b' }), /double|"--"/)
})

test('grid geometry: pitch, wrap and overall size', () => {
  const pitch = SHEET.icon + SHEET.gap
  assert.deepEqual(cellPosition(0), { x: 0, y: 0 })
  assert.deepEqual(cellPosition(1), { x: pitch, y: 0 })
  assert.deepEqual(cellPosition(SHEET.columns), { x: 0, y: pitch })
  assert.deepEqual(sheetSize(1), { width: 24, height: 24 })
  // A short sheet is as wide as its icons, not as wide as a full row.
  assert.equal(sheetSize(3).width, 3 * 24 + 2 * 16)
  // 41 icons at 20 per row is three rows.
  assert.equal(sheetSize(41).height, 3 * 24 + 2 * 16)
})

test('the same input always produces byte-identical output', () => {
  const a = buildSheet([ARROW, MINUS], { name: 'Test', license: LICENSE })
  const b = buildSheet([ARROW, MINUS], { name: 'Test', license: LICENSE })
  assert.equal(a, b)
})

test('categories: priority first, the rest alphabetical, none lost or repeated', () => {
  const input = ['weather', 'files', 'zebra', 'arrows', 'animals', 'security']
  const out = orderCategories(input)
  assert.deepEqual(out, ['arrows', 'files', 'security', 'animals', 'weather', 'zebra'])
  assert.equal(new Set(out).size, input.length)
})

test('labels and file names', () => {
  assert.equal(categoryLabel('food-beverage'), 'Food & beverage')
  assert.equal(categoryLabel('arrows'), 'Arrows')
  assert.equal(sheetFileName('food-beverage'), 'lucide-food-beverage.svg')
})

/* -------------------- the committed category snapshot -------------------- */

interface Snapshot {
  lucideVersion: string
  excluded: string[]
  categories: Record<string, string[]>
}
const snapshot = JSON.parse(
  readFileSync(join(process.cwd(), 'src/lib/assets/lucide-categories.snapshot.json'), 'utf8'),
) as Snapshot

test('snapshot: every icon has at least one category and no repeats within it', () => {
  for (const [slug, cats] of Object.entries(snapshot.categories)) {
    assert.ok(cats.length > 0, `${slug} has no category`)
    assert.equal(new Set(cats).size, cats.length, `${slug} repeats a category`)
  }
})

test('snapshot: an icon is never both categorised and excluded', () => {
  const excluded = new Set(snapshot.excluded)
  for (const slug of Object.keys(snapshot.categories)) {
    assert.ok(!excluded.has(slug), `${slug} is in both`)
  }
})

test('snapshot: every promoted category actually exists upstream', () => {
  const known = new Set(Object.values(snapshot.categories).flat())
  for (const c of CATEGORY_PRIORITY) {
    assert.ok(known.has(c), `CATEGORY_PRIORITY names "${c}", which Lucide no longer has`)
  }
})

test('snapshot: deprecated brand marks are excluded, not redistributed', () => {
  for (const brand of ['github', 'twitter', 'chrome', 'slack', 'facebook', 'youtube']) {
    assert.ok(snapshot.excluded.includes(brand), `${brand} should be excluded`)
    assert.ok(!(brand in snapshot.categories), `${brand} must not be in a sheet`)
  }
})
