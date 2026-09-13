import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  BOX,
  exponentFor,
  fieldAt,
  mergedShapeLoops,
  mergedShapePath,
  resampleLoop,
  shapeClipPathCss,
  shapeReactComponent,
  shapeSvg,
  type Metaball,
} from './shape-magic'

const OPTIONS = { gooeyness: 50, resolution: 128, samples: 56 }

function ball(id: number, x: number, y: number, r: number): Metaball {
  return { id, x, y, r }
}

/** Distance from `centre` to the furthest point of any loop. */
function extent(loops: [number, number][][], cx: number, cy: number): number {
  let max = 0
  for (const loop of loops) {
    for (const [x, y] of loop) max = Math.max(max, Math.hypot(x - cx, y - cy))
  }
  return max
}

test('a lone circle keeps its radius at every gooeyness', () => {
  // The invariant the whole design rests on: the exponent controls reach
  // and nothing else. If it also resized things, every move of the slider
  // would silently rescale the artifact someone is about to export.
  for (const gooeyness of [0, 25, 50, 75, 100]) {
    const loops = mergedShapeLoops([ball(1, 50, 50, 20)], { ...OPTIONS, gooeyness })
    assert.equal(loops.length, 1, `gooeyness ${gooeyness} should give one loop`)
    const radius = extent(loops, 50, 50)
    assert.ok(
      Math.abs(radius - 20) < 0.6,
      `gooeyness ${gooeyness}: radius ${radius.toFixed(2)} should be ~20`,
    )
  }
})

test('the field is exactly at the threshold on a lone circle edge', () => {
  const balls = [ball(1, 50, 50, 20)]
  for (const gooeyness of [0, 60, 100]) {
    const onEdge = fieldAt(balls, 70, 50, exponentFor(gooeyness))
    assert.ok(Math.abs(onEdge - 1) < 1e-9, `field on the edge was ${onEdge}`)
  }
})

test('circles far apart stay apart; circles close together become one shape', () => {
  const apart = mergedShapeLoops([ball(1, 22, 50, 10), ball(2, 78, 50, 10)], OPTIONS)
  assert.equal(apart.length, 2, 'two distant circles should be two loops')

  const touching = mergedShapeLoops([ball(1, 44, 50, 12), ball(2, 56, 50, 12)], OPTIONS)
  assert.equal(touching.length, 1, 'two overlapping circles should merge into one loop')
})

test('gooeyness is monotonic — more of it merges at greater distance', () => {
  // The pair is placed so that it is genuinely borderline: separate when
  // each circle's influence is local, joined when it reaches.
  const pair = [ball(1, 36, 50, 11), ball(2, 64, 50, 11)]
  const tight = mergedShapeLoops(pair, { ...OPTIONS, gooeyness: 0 })
  const loose = mergedShapeLoops(pair, { ...OPTIONS, gooeyness: 100 })

  assert.equal(tight.length, 2, 'at gooeyness 0 the pair should stay separate')
  assert.equal(loose.length, 1, 'at gooeyness 100 the pair should have grown a neck')
})

test('every loop is closed, and never repeats its first point as its last', () => {
  const loops = mergedShapeLoops([ball(1, 40, 45, 16), ball(2, 62, 58, 13)], OPTIONS)
  assert.ok(loops.length > 0)
  for (const loop of loops) {
    assert.ok(loop.length >= 3, 'a loop needs three points to have an inside')
    const first = loop[0]
    const last = loop[loop.length - 1]
    // A repeated point becomes a zero-length bezier, which some renderers
    // draw as a visible nick in an otherwise smooth outline.
    assert.ok(
      !(first[0] === last[0] && first[1] === last[1]),
      'the closing point must not be carried in the loop',
    )
  }
})

test('no coordinate is ever NaN, including a sample on a centre', () => {
  // A grid point landing exactly on a circle centre makes the field
  // infinite there; one NaN in a corner value voids that whole cell.
  const onGrid = mergedShapePath([ball(1, 50, 50, 18), ball(2, 25, 25, 12)], {
    ...OPTIONS,
    resolution: 100, // puts grid corners exactly on 50,50 and 25,25
  })
  assert.ok(onGrid.length > 0)
  assert.ok(!onGrid.includes('NaN'), 'path contained NaN')
})

test('nothing to draw produces nothing, rather than throwing', () => {
  assert.equal(mergedShapePath([], OPTIONS), '')
  assert.equal(mergedShapePath([ball(1, 50, 50, 0)], OPTIONS), '')
  assert.deepEqual(mergedShapeLoops([], OPTIONS), [])
})

test('the path stays inside the box', () => {
  const path = mergedShapePath([ball(1, 50, 50, 30)], OPTIONS)
  const numbers = path.match(/-?\d+\.\d+/g)?.map(Number) ?? []
  assert.ok(numbers.length > 0)
  for (const n of numbers) {
    // Bezier control points can sit slightly outside the contour, so this
    // is a sanity bound rather than a clip: what it catches is a coordinate
    // that has escaped the box entirely.
    assert.ok(n >= -10 && n <= BOX + 10, `coordinate ${n} is outside the box`)
  }
})

test('resampling spaces points evenly around the loop', () => {
  // A square, whose corners are far apart and whose edges have no points at
  // all — the case where marching squares' own spacing is worst.
  const square: [number, number][] = [
    [0, 0],
    [40, 0],
    [40, 40],
    [0, 40],
  ]
  const out = resampleLoop(square, 32)
  assert.equal(out.length, 32)

  const gaps = out.map((p, i) => {
    const q = out[(i + 1) % out.length]
    return Math.hypot(q[0] - p[0], q[1] - p[1])
  })
  const min = Math.min(...gaps)
  const max = Math.max(...gaps)
  assert.ok(max - min < 0.01, `spacing ranged ${min.toFixed(3)}–${max.toFixed(3)}`)
})

test('the sample count decides the path length, not the grid resolution', () => {
  // The reason both knobs exist: resolution buys fidelity, samples buy a
  // `d` string a human can read in a clip-path rule.
  const balls = [ball(1, 42, 50, 16), ball(2, 60, 48, 14)]
  const coarse = mergedShapePath(balls, { gooeyness: 50, resolution: 64, samples: 40 })
  const fine = mergedShapePath(balls, { gooeyness: 50, resolution: 200, samples: 40 })

  const curves = (d: string) => (d.match(/C /g) ?? []).length
  assert.equal(curves(coarse), curves(fine), 'both should emit one curve per sample')
})

test('the SVG fills with evenodd, so a hole stays a hole', () => {
  const svg = shapeSvg('M 0,0 Z', '#ff0000')
  assert.match(svg, /fill-rule="evenodd"/)
  assert.match(svg, /fill="#ff0000"/)
  assert.match(svg, new RegExp(`viewBox="0 0 ${BOX} ${BOX}"`))
})

test('the React export is colourless and refuses an unusable component name', () => {
  const good = shapeReactComponent('M 0,0 Z', 'HeroBlob')
  assert.match(good, /export function HeroBlob/)
  // currentColor, not a baked fill — the reason to leave with a component
  // rather than a PNG is that it still takes its surroundings' colour.
  assert.match(good, /fill="currentColor"/)
  assert.ok(!good.includes('fill-rule'), 'JSX needs fillRule, not the CSS spelling')

  // A name straight from a filename would emit uncompilable JSX.
  assert.match(shapeReactComponent('M 0,0 Z', 'my blob 2'), /export function Blob/)
  assert.match(shapeReactComponent('M 0,0 Z', ''), /export function Blob/)
})

test('the clip-path export warns that path() does not scale', () => {
  const css = shapeClipPathCss('M 0,0 Z')
  assert.match(css, /clip-path: path\('M 0,0 Z'\)/)
  // Without this the shape silently detaches from the element at any other
  // size, which looks like a broken export rather than a documented limit.
  assert.match(css, /clips in px/)
  assert.match(css, /objectBoundingBox/)
})
