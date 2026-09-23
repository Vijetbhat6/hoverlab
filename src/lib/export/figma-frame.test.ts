import { test } from 'node:test'
import assert from 'node:assert/strict'

import { serializeFrame, type Frame, type FrameIcon, type FrameNode } from './figma-frame'

/**
 * These guard the format, not the walk.
 *
 * Same reasoning as `figma-svg.test.ts` next door: every assertion here is
 * something Figma's SVG parser cares about and a browser would forgive, which
 * is the class of bug that ships unnoticed — the frame renders fine in a
 * preview and pastes as nothing, or as one black rectangle.
 *
 * The DOM walk itself is not covered here. It needs real layout — computed
 * styles and `getBoundingClientRect` — which is a browser, not a fake one; a
 * jsdom test of it would assert that our stub returns what we told it to.
 * That half is verified in the browser pass instead.
 */

function frame(nodes: FrameNode[], overrides: Partial<Frame> = {}): Frame {
  return { name: 'Hero Split', width: 800, height: 400, nodes, background: '#0b1120', ...overrides }
}

const RECT: FrameNode = {
  kind: 'rect',
  name: 'button',
  x: 10.456,
  y: 20,
  width: 120,
  height: 40,
  fill: '#3b82f6',
  stroke: null,
  strokeWidth: 0,
  radius: 8,
  opacity: 1,
}

const TEXT: FrameNode = {
  kind: 'text',
  name: 'Get started',
  x: 24,
  y: 48,
  text: 'Get started',
  fill: '#ffffff',
  fontFamily: 'Geist, sans-serif',
  fontSize: 16,
  fontWeight: 600,
  letterSpacing: 0,
  anchor: 'start',
}

test('the frame is a single well-formed svg element', () => {
  const svg = serializeFrame(frame([RECT, TEXT]))
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)
  assert.ok(svg.trimEnd().endsWith('</svg>'))
  assert.equal(svg.split('<svg ').length - 1, 1)
})

test('the artboard carries a viewBox matching its size', () => {
  const svg = serializeFrame(frame([RECT]))
  assert.match(svg, /width="800" height="400" viewBox="0 0 800 400"/)
})

test('no styles or classes survive — presentation is on the element', () => {
  // Figma drops both on import; a frame relying on them pastes unstyled.
  const svg = serializeFrame(frame([RECT, TEXT]))
  assert.doesNotMatch(svg, /<style/)
  assert.doesNotMatch(svg, /class=/)
})

test('the background is painted first so everything else lands on top', () => {
  const svg = serializeFrame(frame([RECT]))
  const bg = svg.indexOf('Hero Split background')
  const button = svg.indexOf('id="button"')
  assert.ok(bg > -1 && button > bg, 'background must precede the content layers')
})

test('a frame with no background paints none', () => {
  const svg = serializeFrame(frame([RECT], { background: null }))
  assert.doesNotMatch(svg, /background/)
})

test('coordinates are rounded rather than carried at full precision', () => {
  const svg = serializeFrame(frame([RECT]))
  assert.match(svg, /x="10\.46"/)
  assert.doesNotMatch(svg, /10\.456/)
})

test('a rect with no fill is explicitly none rather than absent', () => {
  // An omitted fill attribute means black in SVG, which would paint every
  // outline-only element as a solid block.
  const svg = serializeFrame(
    frame([{ ...RECT, fill: null, stroke: '#334155', strokeWidth: 1 }]),
  )
  assert.match(svg, /fill="none"/)
  assert.match(svg, /stroke="#334155" stroke-width="1"/)
})

test('layer names collide gracefully instead of silently merging', () => {
  const svg = serializeFrame(frame([RECT, { ...RECT, x: 200 }]))
  assert.match(svg, /id="button"/)
  assert.match(svg, /id="button 2"/)
})

test('text is escaped, including in the layer name', () => {
  const svg = serializeFrame(
    frame([
      {
        ...TEXT,
        name: 'Terms & <Conditions>',
        text: 'Terms & <Conditions>',
      } as FrameNode,
    ]),
  )
  assert.match(svg, /&amp; &lt;Conditions&gt;<\/text>/)
  assert.match(svg, /id="Terms &amp; &lt;Conditions&gt;"/)
  // An unescaped angle bracket would end the element early and produce a
  // document that is not XML at all.
  assert.doesNotMatch(svg, /<text[^>]*>[^<]*<Conditions>/)
})

test('font family is quoted so a stack with spaces survives', () => {
  const svg = serializeFrame(frame([TEXT]))
  assert.match(svg, /font-family="Geist, sans-serif"/)
})

test('default weight and anchor are omitted rather than restated', () => {
  const svg = serializeFrame(
    frame([{ ...TEXT, fontWeight: 400, anchor: 'start', letterSpacing: 0 }]),
  )
  assert.doesNotMatch(svg, /font-weight/)
  assert.doesNotMatch(svg, /text-anchor/)
  assert.doesNotMatch(svg, /letter-spacing/)
})

test('a centred label carries its anchor', () => {
  const svg = serializeFrame(frame([{ ...TEXT, anchor: 'middle' }]))
  assert.match(svg, /text-anchor="middle"/)
})

test('an empty frame is still a valid document', () => {
  const svg = serializeFrame(frame([], { background: null }))
  assert.match(svg, /^<svg /)
  assert.ok(svg.trimEnd().endsWith('</svg>'))
})

/* ------------------------------------------------------------------ *
 *  Icons
 * ------------------------------------------------------------------ */

const ICON: FrameIcon = {
  kind: 'icon',
  name: 'icon chevron-down',
  x: 420,
  y: 22,
  width: 16,
  height: 16,
  viewBox: { x: 0, y: 0, width: 24, height: 24 },
  stretch: false,
  matrix: null,
  opacity: 1,
  fill: 'none',
  stroke: '#575b60',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  shapes: [{ tag: 'path', attrs: { d: 'm6 9 6 6 6-6' }, children: [] }],
}

test('an icon is one group carrying its paint, with the shapes inside', () => {
  const svg = serializeFrame(frame([ICON]))
  assert.match(svg, /<g id="icon chevron-down" transform="translate\(420 22\) scale\(0\.667 0\.667\)"/)
  assert.match(svg, /fill="none" stroke="#575b60" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">/)
  assert.match(svg, /<path d="m6 9 6 6 6-6" \/>/)
  assert.ok(svg.includes('</g>'))
})

test('a stroke-less icon does not restate stroke attributes', () => {
  const svg = serializeFrame(frame([{ ...ICON, stroke: 'none', fill: '#ff0000' }]))
  assert.match(svg, /fill="#ff0000" stroke="none">/)
  assert.doesNotMatch(svg, /stroke-width/)
})

test('a CSS rotation is applied about the box centre, not the corner', () => {
  const svg = serializeFrame(frame([{ ...ICON, matrix: [-1, 0, 0, -1, 0, 0] }]))
  assert.match(
    svg,
    /transform="translate\(420 22\) translate\(8 8\) matrix\(-1 0 0 -1 0 0\) translate\(-8 -8\) scale\(0\.667 0\.667\)"/,
  )
})

test('a non-square box centres the viewBox instead of stretching it', () => {
  const svg = serializeFrame(frame([{ ...ICON, width: 48, height: 24 }]))
  // 24x24 fitted into 48x24 keeps scale 1 and moves right by 12.
  assert.match(svg, /translate\(12 0\) scale\(1 1\)/)
})

test('preserveAspectRatio none stretches each axis independently', () => {
  const svg = serializeFrame(frame([{ ...ICON, width: 48, height: 24, stretch: true }]))
  assert.match(svg, /scale\(2 1\)/)
})

test('nested shapes keep their nesting and escape attribute values', () => {
  const nested: FrameNode = {
    ...ICON,
    shapes: [
      {
        tag: 'g',
        attrs: { stroke: '#ff0000' },
        children: [{ tag: 'path', attrs: { d: 'M0 0"<' }, children: [] }],
      },
    ],
  }
  const svg = serializeFrame(frame([nested]))
  assert.match(svg, /<g stroke="#ff0000">\n\s+<path d="M0 0&quot;&lt;" \/>\n\s+<\/g>/)
})

test('two icons with the same name are suffixed like any other layer', () => {
  const svg = serializeFrame(frame([ICON, ICON]))
  assert.match(svg, /id="icon chevron-down"/)
  assert.match(svg, /id="icon chevron-down 2"/)
})

test('an icon frame is still well-formed and carries no classes or styles', () => {
  const svg = serializeFrame(frame([ICON, RECT, TEXT]))
  assert.equal(svg.split('<svg ').length - 1, 1)
  assert.doesNotMatch(svg, /class=|<style/)
})
