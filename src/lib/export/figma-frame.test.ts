import { test } from 'node:test'
import assert from 'node:assert/strict'

import { serializeFrame, type Frame, type FrameNode } from './figma-frame'

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
    frame([{ ...RECT, fill: null, stroke: '#334155', strokeWidth: 1 } as FrameNode]),
  )
  assert.match(svg, /fill="none"/)
  assert.match(svg, /stroke="#334155" stroke-width="1"/)
})

test('layer names collide gracefully instead of silently merging', () => {
  const svg = serializeFrame(frame([RECT, { ...RECT, x: 200 } as FrameNode]))
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
    frame([{ ...TEXT, fontWeight: 400, anchor: 'start', letterSpacing: 0 } as FrameNode]),
  )
  assert.doesNotMatch(svg, /font-weight/)
  assert.doesNotMatch(svg, /text-anchor/)
  assert.doesNotMatch(svg, /letter-spacing/)
})

test('a centred label carries its anchor', () => {
  const svg = serializeFrame(frame([{ ...TEXT, anchor: 'middle' } as FrameNode]))
  assert.match(svg, /text-anchor="middle"/)
})

test('an empty frame is still a valid document', () => {
  const svg = serializeFrame(frame([], { background: null }))
  assert.match(svg, /^<svg /)
  assert.ok(svg.trimEnd().endsWith('</svg>'))
})
