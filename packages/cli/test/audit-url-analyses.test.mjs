/**
 * The contrast and right-to-left analyses, driven by hand-built element
 * records so no browser is involved. The browser half is covered by the
 * end-to-end test; this half is where the decisions are made.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { analyzeContrast, backgroundOf } from '../src/audit-url/contrast.mjs'
import { analyzeRtl, flipsHorizontally, pascalCase } from '../src/audit-url/rtl-audit.mjs'
import { PAGE, tree } from '../test-fixtures/audit-url/records.mjs'

const WHITE = [255, 255, 255, 1]
const where = { page: '/' }

/** html, body, then whatever the caller adds under body. */
function page(children, over = {}) {
  return tree([
    { tag: 'html', bg: WHITE, r: [0, 0, 1280, 800], p: -1 },
    { tag: 'body', r: [0, 0, 1280, 800], p: 0 },
    ...children.map((c) => ({ p: 1, ...c })),
  ]).map((r) => ({ ...r, ...(over[r.i] ?? {}) }))
}

const grey = (n, a = 1) => [n, n, n, a]

/* ── contrast ── */

test('contrast: #999 on white fails and is grouped with its ratio and example', () => {
  const els = page([{ tag: 'p', tx: 'Muted words', color: grey(0x99), fill: grey(0x99), lab: 'p.muted' }])
  const { groups, flagged, measured } = analyzeContrast(els, PAGE, where)
  assert.equal(measured, 1)
  assert.ok(flagged.has(2))
  const [group] = [...groups.values()]
  assert.equal(group.fg, '#999999')
  assert.equal(group.bg, '#ffffff')
  assert.equal(group.needed, 4.5)
  assert.ok(group.ratio > 2.8 && group.ratio < 2.9)
  assert.match(group.examples[0].selector, /p\.muted/)
})

test('contrast: text that passes produces no group', () => {
  const els = page([{ tag: 'p', tx: 'Fine', color: grey(0x59), fill: grey(0x59) }])
  assert.equal(analyzeContrast(els, PAGE, where).groups.size, 0)
})

test('contrast: 24px text is held to 3:1, not 4.5:1', () => {
  // White on a 50% black layer is #808080: 3.95:1.
  const layer = { tag: 'div', bg: [0, 0, 0, 0.5], p: 1 }
  const small = page([layer, { tag: 'p', p: 2, tx: 'Hi', color: WHITE, fill: WHITE, fs: 16 }])
  const large = page([layer, { tag: 'p', p: 2, tx: 'Hi', color: WHITE, fill: WHITE, fs: 24 }])
  assert.equal(analyzeContrast(small, PAGE, where).groups.size, 1)
  assert.equal(analyzeContrast(large, PAGE, where).groups.size, 0)
})

test('contrast: translucent layers are composited in order, down to the first opaque one', () => {
  const els = page([
    { tag: 'section', bg: [0, 0, 0, 0.5] },
    { tag: 'div', p: 2, bg: [255, 255, 255, 0.5] },
    { tag: 'p', p: 3, tx: 'x', fill: grey(0), color: grey(0) },
  ])
  const bg = backgroundOf(els, 4, WHITE)
  // 50% black over white = 127.5; 50% white over that = 191.25.
  assert.ok(Math.abs(bg.rgb[0] - 191.25) < 1e-9)
})

test('contrast: text over a background image is skipped and counted, not guessed at', () => {
  const els = page([
    { tag: 'section', bgImg: true },
    { tag: 'p', p: 2, tx: 'over a photo', color: grey(0xcc), fill: grey(0xcc) },
  ])
  const { groups, skipped, measured } = analyzeContrast(els, PAGE, where)
  assert.equal(groups.size, 0)
  assert.equal(measured, 0)
  assert.equal(skipped.image, 1)
})

test('contrast: disabled, gradient-clipped, transparent, hidden and SVG text are skipped', () => {
  const pale = { color: grey(0xcc), fill: grey(0xcc) }
  const els = page([
    { tag: 'button', tx: 'Disabled', dis: true, ...pale },
    { tag: 'h1', tx: 'Gradient', bgText: true, ...pale },
    { tag: 'p', tx: 'Invisible', color: grey(0xcc), fill: [0, 0, 0, 0] },
    { tag: 'p', tx: 'Hidden', hid: true, ...pale },
    { tag: 'svg' },
    { tag: 'text', p: 6, tx: 'in svg', ...pale },
  ])
  const { groups, measured } = analyzeContrast(els, PAGE, where)
  assert.equal(groups.size, 0)
  assert.equal(measured, 0)
})

test('contrast: an opacity above the text lowers its effective contrast', () => {
  const els = page([{ tag: 'p', tx: 'Faded', color: grey(0), fill: grey(0), op: 0.4 }])
  // 40% black on white is #999: fails.
  assert.equal(analyzeContrast(els, PAGE, where).groups.size, 1)
})

test('contrast: the dark canvas is used when nothing paints a background', () => {
  const els = tree([
    { tag: 'html', r: [0, 0, 1280, 800], p: -1 },
    { tag: 'body', r: [0, 0, 1280, 800], p: 0 },
    { tag: 'p', p: 1, tx: 'light on dark', color: grey(0xee), fill: grey(0xee) },
  ])
  assert.equal(analyzeContrast(els, { ...PAGE, colorScheme: 'dark' }, where).groups.size, 0)
  assert.equal(analyzeContrast(els, { ...PAGE, colorScheme: 'normal' }, where).groups.size, 1)
})

/* ── RTL ── */

test('rtl: flip detection reads transform, scale and rotate', () => {
  assert.equal(flipsHorizontally({ tr: 'matrix(-1, 0, 0, 1, 0, 0)' }), true)
  assert.equal(flipsHorizontally({ tr: 'matrix(1, 0, 0, 1, 0, 0)' }), false)
  assert.equal(flipsHorizontally({ tr: 'none', scale: '-1 1' }), true)
  assert.equal(flipsHorizontally({ tr: 'none', scale: '1 1' }), false)
  assert.equal(flipsHorizontally({ tr: 'none', rot: '180deg' }), true)
  assert.equal(flipsHorizontally({ tr: 'none', rot: '90deg' }), false)
  assert.equal(flipsHorizontally({ tr: 'none', scale: 'none', rot: 'none' }), false)
})

test('rtl: lucide kebab names become ledger keys', () => {
  assert.equal(pascalCase('arrow-right'), 'ArrowRight')
  assert.equal(pascalCase('chevrons-left'), 'ChevronsLeft')
})

/** The same toolbar in both directions: three chips that mirror and a close button that does not. */
function toolbar({ rtl, closeX }) {
  const chipXs = rtl ? [840, 732, 624] : [340, 448, 556]
  const specs = [
    { tag: 'div', lab: 'div.toolbar', pos: 'relative', r: [340, 0, 600, 48] },
    ...chipXs.map((x) => ({ tag: 'div', p: 2, tx: 'Chip', r: [x, 8, 100, 32] })),
    { tag: 'button', p: 2, tx: 'x', lab: 'button.close', pos: 'absolute', insetL: 12, insetR: 'auto', r: [closeX, 12, 24, 24] },
  ]
  return page(specs).map((r) => (rtl ? { ...r, dir: 'rtl' } : r))
}

test('rtl: content that stayed put while its neighbours mirrored is reported, with the cause', () => {
  const ltr = { elements: toolbar({ rtl: false, closeX: 352 }), page: PAGE }
  const rtl = { elements: toolbar({ rtl: true, closeX: 352 }), page: PAGE }
  const { findings } = analyzeRtl(ltr, rtl, where)
  const stuck = findings.find((f) => f.rule === 'rtl-not-mirrored')
  assert.ok(stuck, 'expected an rtl-not-mirrored finding')
  assert.equal(stuck.count, 1)
  assert.match(stuck.examples[0].selector, /button\.close/)
  assert.match(stuck.examples[0].detail, /left: 12px and right: auto/)
})

test('rtl: a button that DID mirror is not reported', () => {
  const ltr = { elements: toolbar({ rtl: false, closeX: 352 }), page: PAGE }
  const rtl = { elements: toolbar({ rtl: true, closeX: 904 }), page: PAGE }
  assert.deepEqual(analyzeRtl(ltr, rtl, where).findings, [])
})

test('rtl: with no sign that mirroring happened anywhere nearby, nothing is reported', () => {
  // Same rects in both passes: the page is direction-agnostic or forced LTR. No evidence, no finding.
  const ltr = { elements: toolbar({ rtl: false, closeX: 352 }), page: PAGE }
  const flat = toolbar({ rtl: false, closeX: 352 }).map((r) => ({ ...r, dir: 'rtl' }))
  assert.deepEqual(analyzeRtl(ltr, { elements: flat, page: PAGE }, where).findings, [])
})

test('rtl: elements that are deliberately direction: ltr are left alone', () => {
  const ltr = { elements: toolbar({ rtl: false, closeX: 352 }), page: PAGE }
  const rtl = { elements: toolbar({ rtl: true, closeX: 352 }).map((r) => (r.tag === 'button' ? { ...r, dir: 'ltr' } : r)), page: PAGE }
  assert.equal(analyzeRtl(ltr, rtl, where).findings.filter((f) => f.rule === 'rtl-not-mirrored').length, 0)
})

test('rtl: text pushed past the left edge only in RTL is an overflow, and the page scrolls', () => {
  const build = (x, rtl) =>
    page([{ tag: 'span', tx: 'A label that is far too long for its box', r: [x, 100, 300, 20], lab: 'span.pin' }]).map((r) =>
      rtl ? { ...r, dir: 'rtl' } : r,
    )
  const ltr = { elements: build(0, false), page: PAGE }
  const rtl = { elements: build(-230, true), page: { ...PAGE, scrollW: 1523 } }
  const { findings } = analyzeRtl(ltr, rtl, where)
  assert.deepEqual(findings.map((f) => f.rule).sort(), ['rtl-overflow', 'rtl-page-scroll'])
  const overflow = findings.find((f) => f.rule === 'rtl-overflow')
  assert.equal(overflow.severity, 'violation')
  assert.equal(overflow.data.side, 'left')
  assert.equal(overflow.data.worst, 230)
})

test('rtl: overflow that exists in LTR too is not blamed on RTL', () => {
  const build = (rtl) =>
    page([{ tag: 'span', tx: 'Wide', r: [-230, 100, 300, 20] }]).map((r) => (rtl ? { ...r, dir: 'rtl' } : r))
  const { findings } = analyzeRtl({ elements: build(false), page: PAGE }, { elements: build(true), page: PAGE }, where)
  assert.deepEqual(findings, [])
})

test('rtl: content inside a scroller is not an escape', () => {
  const build = (x, rtl) =>
    page([
      { tag: 'div', ox: 'auto', r: [100, 100, 400, 40] },
      { tag: 'span', p: 2, tx: 'Scrolls', r: [x, 100, 900, 20] },
    ]).map((r) => (rtl ? { ...r, dir: 'rtl' } : r))
  const { findings } = analyzeRtl({ elements: build(100, false), page: PAGE }, { elements: build(-500, true), page: PAGE }, where)
  assert.equal(findings.filter((f) => f.rule === 'rtl-overflow').length, 0)
})

test('rtl: a box that newly clips its own text is reported; one with an ellipsis is not', () => {
  const build = (rtl, ellipsis) =>
    page([
      {
        tag: 'div',
        tx: 'Truncated heading text',
        ox: 'hidden',
        to: ellipsis ? 'ellipsis' : 'clip',
        r: [0, 0, 200, 24],
        sw: rtl ? 320 : 200,
        cw: 200,
      },
    ]).map((r) => (rtl ? { ...r, dir: 'rtl' } : r))
  const clipped = analyzeRtl({ elements: build(false, false), page: PAGE }, { elements: build(true, false), page: PAGE }, where)
  assert.deepEqual(clipped.findings.map((f) => f.rule), ['rtl-clipped-text'])
  const ellipsed = analyzeRtl({ elements: build(false, true), page: PAGE }, { elements: build(true, true), page: PAGE }, where)
  assert.deepEqual(ellipsed.findings, [])
})

test('rtl: a ledger "mirror" icon that was not flipped is reported once per icon, with the ruling', () => {
  const icon = (extra = {}) => ({ tag: 'svg', cls: 'lucide lucide-arrow-right', r: [0, 0, 16, 16], ...extra })
  const build = (rtl, extra) => page([icon(extra), icon(extra), { tag: 'svg', cls: 'lucide lucide-copy', r: [0, 40, 16, 16] }]).map((r) => (rtl ? { ...r, dir: 'rtl' } : r))
  const bad = analyzeRtl({ elements: build(false), page: PAGE }, { elements: build(true), page: PAGE }, where)
  assert.equal(bad.findings.length, 1)
  assert.equal(bad.findings[0].rule, 'rtl-icon-not-mirrored')
  assert.equal(bad.findings[0].count, 2)
  assert.equal(bad.findings[0].data.icon, 'ArrowRight')

  const flipped = analyzeRtl({ elements: build(false), page: PAGE }, { elements: build(true, { tr: 'matrix(-1, 0, 0, 1, 0, 0)' }), page: PAGE }, where)
  assert.deepEqual(flipped.findings, [])
})

test('rtl: text hard-aligned left is an advisory; td and short text are not', () => {
  const build = (rtl) =>
    page([
      { tag: 'p', tx: 'A paragraph that someone aligned to the left', ta: 'left', r: [0, 0, 400, 24] },
      { tag: 'td', tx: 'A numeric cell that is right aligned', ta: 'right', r: [0, 40, 400, 24] },
      { tag: 'p', tx: 'Short', ta: 'left', r: [0, 80, 400, 24] },
    ]).map((r) => (rtl ? { ...r, dir: 'rtl' } : r))
  const { findings } = analyzeRtl({ elements: build(false), page: PAGE }, { elements: build(true), page: PAGE }, where)
  assert.equal(findings.length, 1)
  assert.equal(findings[0].rule, 'rtl-text-align')
  assert.equal(findings[0].count, 1)
})
