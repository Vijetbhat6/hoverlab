import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  ASCII_RAMPS,
  adjust,
  asciiArt,
  bayerMatrix,
  dither,
  halftoneDots,
  halftoneSvg,
  hexToRgb,
  toPlane,
  toRgba,
  type Plane,
} from './texture-lab'

/**
 * Dithering is the kind of code that is subtly wrong for months, because
 * the output always looks plausibly like dithering. Every test here asserts
 * a property you could not confirm by looking at the picture.
 */

/** A plane filled with one tone. */
function flat(width: number, height: number, value: number): Plane {
  return { width, height, values: new Float32Array(width * height).fill(value) }
}

/** A left-to-right ramp from black to white. */
function gradient(width: number, height: number): Plane {
  const values = new Float32Array(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) values[y * width + x] = x / (width - 1)
  }
  return { width, height, values }
}

test('luminance composites alpha over white, so a transparent PNG is not black', () => {
  // Fully transparent pixels usually carry RGB zero. Ignoring alpha reads
  // them as black and the whole texture comes out as a slab.
  const data = new Uint8ClampedArray([0, 0, 0, 0, 0, 0, 0, 255])
  const plane = toPlane(data, 2, 1)
  assert.ok(Math.abs(plane.values[0] - 1) < 1e-6, 'transparent should read as white')
  assert.ok(Math.abs(plane.values[1] - 0) < 1e-6, 'opaque black should read as black')
})

test('luminance uses luma weights, not a flat average', () => {
  const green = toPlane(new Uint8ClampedArray([0, 255, 0, 255]), 1, 1).values[0]
  const blue = toPlane(new Uint8ClampedArray([0, 0, 255, 255]), 1, 1).values[0]
  // Green reads far brighter than blue to the eye; a flat average would
  // make them identical and every texture would come out tonally wrong.
  assert.ok(green > blue * 5, `green ${green} should dominate blue ${blue}`)
})

test('the Bayer matrix is a permutation of its own cells', () => {
  for (const order of [2, 4, 8]) {
    const matrix = bayerMatrix(order)
    assert.equal(matrix.length, order)
    assert.equal(matrix[0].length, order)

    // Every threshold appears exactly once. One duplicated or missing cell
    // shows up as a single wrong pixel in a repeating grid — survivable in
    // review, obvious here.
    const n = order * order
    const seen = matrix.flat().map((v) => Math.round(v * n - 0.5))
    assert.deepEqual([...seen].sort((a, b) => a - b), Array.from({ length: n }, (_, i) => i))
  }
})

test('dithering preserves average brightness where thresholding does not', () => {
  // This is the entire reason dithering exists, and the one property that
  // distinguishes it from banding. 40% grey has no representation in two
  // tones, so the pattern has to average to it.
  const plane = flat(64, 64, 0.4)

  for (const method of ['floyd-steinberg', 'atkinson', 'ordered'] as const) {
    const out = dither(plane, method, 2)
    const mean = out.reduce((sum, v) => sum + v, 0) / out.length
    assert.ok(
      Math.abs(mean - 0.4) < 0.06,
      `${method} averaged ${mean.toFixed(3)}, expected ~0.4`,
    )
  }

  const banded = dither(plane, 'threshold', 2)
  const bandedMean = banded.reduce((sum, v) => sum + v, 0) / banded.length
  assert.equal(bandedMean, 0, 'thresholding is meant to lose the tone — that is the control case')
})

test('every output level is in range, at every level count', () => {
  const plane = gradient(48, 16)
  for (const levels of [2, 3, 4, 8]) {
    for (const method of ['floyd-steinberg', 'atkinson', 'ordered', 'threshold'] as const) {
      const out = dither(plane, method, levels)
      assert.equal(out.length, 48 * 16)
      for (const v of out) {
        assert.ok(
          Number.isInteger(v) && v >= 0 && v <= levels - 1,
          `${method} at ${levels} levels produced ${v}`,
        )
      }
    }
  }
})

test('dithering does not consume its input', () => {
  // Error diffusion mutates as it walks. On the source array, toggling
  // methods in the UI would degrade the image a little more each time —
  // a slow, unexplainable rot.
  const plane = gradient(32, 8)
  const before = Float32Array.from(plane.values)
  dither(plane, 'floyd-steinberg', 2)
  dither(plane, 'atkinson', 2)
  assert.deepEqual(Array.from(plane.values), Array.from(before))
})

test('black stays black and white stays white under every method', () => {
  for (const method of ['floyd-steinberg', 'atkinson', 'ordered', 'threshold'] as const) {
    const black = dither(flat(16, 16, 0), method, 2)
    const white = dither(flat(16, 16, 1), method, 2)
    assert.ok(black.every((v) => v === 0), `${method} put noise in solid black`)
    assert.ok(white.every((v) => v === 1), `${method} put noise in solid white`)
  }
})

test('halftone dot area tracks ink coverage, not radius', () => {
  // Scaling radius linearly with darkness makes every midtone far too
  // dark, because area goes as the square. A 50% grey must cover about
  // half of what solid black covers.
  const mid = halftoneDots(flat(120, 120, 0.5), { cell: 8, angle: 0 })
  const dark = halftoneDots(flat(120, 120, 0), { cell: 8, angle: 0 })

  const area = (dots: { r: number }[]) => dots.reduce((sum, d) => sum + d.r * d.r, 0)
  const ratio = area(mid) / area(dark)
  assert.ok(Math.abs(ratio - 0.5) < 0.08, `midtone covered ${(ratio * 100).toFixed(0)}% of solid`)
})

test('a rotated screen still covers the corners', () => {
  // A lattice sized to the image leaves two bare triangles once it is
  // rotated, which reads as a crop nobody asked for.
  const plane = flat(200, 120, 0)
  const dots = halftoneDots(plane, { cell: 6, angle: 45 })

  const corners: [number, number][] = [
    [0, 0],
    [199, 0],
    [0, 119],
    [199, 119],
  ]
  for (const [cx, cy] of corners) {
    const nearest = Math.min(...dots.map((d) => Math.hypot(d.x - cx, d.y - cy)))
    assert.ok(nearest < 12, `corner ${cx},${cy} had no dot within ${nearest.toFixed(1)}px`)
  }
})

test('white paper produces no dots at all', () => {
  assert.equal(halftoneDots(flat(80, 80, 1), { cell: 6, angle: 45 }).length, 0)
  // ...and inverting makes the same input solid.
  assert.ok(halftoneDots(flat(80, 80, 1), { cell: 6, angle: 45, invert: true }).length > 0)
})

test('the halftone SVG is well-formed and carries every dot', () => {
  const dots = halftoneDots(flat(60, 60, 0.3), { cell: 10, angle: 45 })
  const svg = halftoneSvg(dots, 60, 60, '#123456')
  assert.equal((svg.match(/<circle /g) ?? []).length, dots.length)
  assert.match(svg, /viewBox="0 0 60 60"/)
  assert.match(svg, /fill="#123456"/)
  assert.ok(!svg.includes('NaN'))
  assert.ok(!svg.includes('<rect'), 'paper "none" should emit no background rect')
  assert.match(halftoneSvg(dots, 60, 60, '#000', '#fff'), /<rect[^>]*fill="#fff"/)
})

test('ASCII output corrects for the shape of a character cell', () => {
  // A monospace cell is about twice as tall as it is wide. Sampling on a
  // square grid returns an image stretched to double height — the single
  // most common bug in ASCII-art code.
  const square = flat(200, 200, 0.5)
  const art = asciiArt(square, { columns: 50, ramp: ASCII_RAMPS.standard })
  const lines = art.split('\n')
  assert.equal(lines[0].length, 50)
  assert.ok(
    Math.abs(lines.length - 25) <= 1,
    `a square image gave ${lines.length} rows for 50 columns; expected ~25`,
  )
})

test('ASCII maps dark to the heavy end of the ramp', () => {
  const ramp = ASCII_RAMPS.standard
  const dark = asciiArt(flat(64, 64, 0), { columns: 8, ramp })
  const light = asciiArt(flat(64, 64, 1), { columns: 8, ramp })
  assert.equal(dark[0], ramp[ramp.length - 1], 'black should use the densest glyph')
  assert.equal(light[0], ramp[0], 'white should use the lightest glyph')

  const inverted = asciiArt(flat(64, 64, 0), { columns: 8, ramp, invert: true })
  assert.equal(inverted[0], ramp[0])
})

test('every ramp runs light to dark and starts with a space', () => {
  for (const [name, ramp] of Object.entries(ASCII_RAMPS)) {
    assert.ok(ramp.length > 1, `${name} needs at least two glyphs`)
    // Out-of-order glyphs show up as a band of noise at exactly that tone.
    // A space first is what makes highlights read as empty page.
    assert.equal(ramp[0], ' ', `${name} should start with a space`)
    assert.notEqual(ramp[ramp.length - 1], ' ', `${name} should end on ink`)
  }
})

test('ASCII survives a degenerate ramp rather than emitting undefined', () => {
  const art = asciiArt(flat(32, 32, 0.5), { columns: 8, ramp: '' })
  assert.ok(!art.includes('undefined'))
  assert.equal(art.split('\n')[0].length, 8)
})

test('brightness and contrast stay in range and do nothing at zero', () => {
  const plane = gradient(32, 4)
  const same = adjust(plane, 0, 0)
  assert.deepEqual(Array.from(same.values), Array.from(plane.values))

  for (const [b, c] of [
    [100, 100],
    [-100, 100],
    [100, -100],
  ]) {
    for (const v of adjust(plane, b, c).values) {
      assert.ok(v >= 0 && v <= 1, `adjust(${b}, ${c}) produced ${v}`)
    }
  }
})

test('rendering back to pixels gives opaque ink and paper at the extremes', () => {
  const levels = new Uint8Array([0, 1])
  const rgba = toRgba(levels, 2, 1, 2, [17, 34, 51], [255, 255, 255])
  assert.deepEqual(Array.from(rgba.slice(0, 4)), [17, 34, 51, 255], 'level 0 is ink')
  assert.deepEqual(Array.from(rgba.slice(4, 8)), [255, 255, 255, 255], 'top level is paper')
})

test('a bad hex falls back rather than throwing', () => {
  assert.deepEqual(hexToRgb('#ff8800'), [255, 136, 0])
  assert.deepEqual(hexToRgb('ff8800'), [255, 136, 0])
  assert.deepEqual(hexToRgb('nonsense'), [0, 0, 0])
})
