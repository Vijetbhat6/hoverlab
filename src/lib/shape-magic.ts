/**
 * Shape Magic — several circles, merged into one organic outline, as a path
 * you can actually leave with.
 *
 * ── WHY THIS IS NOT AN SVG FILTER ───────────────────────────────────────
 *
 * The usual way to make blobs merge on the web is the "gooey filter": blur
 * everything, then crank contrast so the blurred edges snap back to hard
 * ones. It looks right and it is useless as an artifact. What you get is a
 * filter chain, not a shape — you cannot put it in `clip-path`, you cannot
 * hand it to a designer, you cannot scale it without re-tuning the blur,
 * and every element it touches pays a full-screen blur on every frame.
 *
 * So this computes the outline instead. The circles define a scalar field,
 * the merged shape is that field's contour at 1.0, and marching squares
 * pulls the contour out as real geometry. The output is a `d` string, which
 * is the one representation every destination accepts: SVG, `clip-path:
 * path()`, a React component, a PNG rasterised from any of them.
 *
 * ── THE FIELD, AND WHY THE EXPONENT IS THE GOOEYNESS KNOB ───────────────
 *
 * f(p) = Σ (rᵢ / |p − cᵢ|)^k, and the shape is where f(p) ≥ 1.
 *
 * The pleasant property of that form is that a lone circle keeps its radius
 * exactly, for any k: at distance r from its centre the one term is
 * (r/r)^k = 1, which is the threshold, whatever k happens to be. So the
 * exponent is free to mean only one thing — how far each circle's influence
 * reaches — and moving it never quietly resizes anything.
 *
 * Large k localises each term, so circles stay separate until they properly
 * overlap. Small k lets them reach, and two circles a diameter apart grow a
 * neck between them. That is the entire "merge" control, and it is why this
 * is one slider rather than a blur radius and a contrast that have to be
 * tuned against each other.
 *
 * ── WHY EDGES ARE KEYED BY INDEX AND NOT BY COORDINATE ──────────────────
 *
 * Marching squares emits loose segments; turning them into closed loops
 * means joining ones that share an endpoint. Matching those endpoints by
 * their coordinates is the classic way to get a shape that is *almost*
 * closed — two cells compute the same crossing point through different
 * arithmetic, land a float apart, and the walk stops halfway round with a
 * gap nothing in the UI explains.
 *
 * So a crossing is identified by which grid edge it sits on — `h:3:7`, not
 * `(37.499998, 70.0)` — and the coordinate is looked up from a cache keyed
 * the same way. Two cells sharing an edge share the key by construction,
 * and the loop either closes or the bug is a real one.
 */

/** One circle in the field. */
export interface Metaball {
  /** Stable identity, so the UI can select and drag one. */
  id: number
  /** Centre, in the 0–100 box every path here is drawn in. */
  x: number
  y: number
  /** Radius, in the same units. */
  r: number
}

export interface MergeOptions {
  /**
   * How readily the circles blend, 0–100. 0 keeps them nearly separate
   * until they overlap; 100 grows necks between circles that are some way
   * apart. Mapped onto the field exponent — see the docblock.
   */
  gooeyness: number
  /**
   * Grid cells per side. Higher is a more faithful contour and quadratic
   * work. 96 is the default because the artifact is smoothed afterwards, so
   * detail past that is thrown away by the resample anyway.
   */
  resolution?: number
  /**
   * How many points each loop is resampled to before smoothing. This, not
   * the resolution, is what decides how long the `d` string is — and a
   * `clip-path` someone has to read matters more than a curve nobody can
   * see the difference in.
   */
  samples?: number
}

/** The 0–100 box every shape here is drawn in. */
export const BOX = 100

/** The field value that is the shape's edge. */
const THRESHOLD = 1

/**
 * Distance floor, so a sample landing exactly on a centre is finite.
 *
 * Without it the field is Infinity there, which is fine for the comparison
 * but produces NaN the moment it is interpolated against — and one NaN in a
 * corner value silently voids every segment in that cell.
 */
const MIN_DISTANCE = 1e-6

/** Gooeyness 0–100 → field exponent. See the docblock for why this is the knob. */
export function exponentFor(gooeyness: number): number {
  const t = Math.min(100, Math.max(0, gooeyness)) / 100
  return 8 - t * 6.4 // 8 → 1.6
}

/** The scalar field at one point. */
export function fieldAt(balls: Metaball[], x: number, y: number, exponent: number): number {
  let sum = 0
  for (const ball of balls) {
    if (ball.r <= 0) continue
    const dx = x - ball.x
    const dy = y - ball.y
    const distance = Math.max(MIN_DISTANCE, Math.hypot(dx, dy))
    sum += Math.pow(ball.r / distance, exponent)
  }
  return sum
}

/** Where along an edge the field crosses the threshold, as a 0–1 fraction. */
function crossing(a: number, b: number): number {
  const span = b - a
  // Parallel values mean the crossing is undefined; the midpoint is the
  // least wrong answer and cannot produce a NaN coordinate.
  if (span === 0) return 0.5
  return (THRESHOLD - a) / span
}

interface Segment {
  from: string
  to: string
}

/**
 * Marching-squares segment table, indexed by which corners are inside.
 *
 * Bits, low to high: top-left, top-right, bottom-right, bottom-left. The
 * four edge names are the cell's own sides. Cases 5 and 10 are the saddles
 * and are absent here — they need the centre sample, and `cellSegments`
 * handles them.
 */
const CASES: Record<number, [string, string][]> = {
  1: [['left', 'top']],
  2: [['top', 'right']],
  3: [['left', 'right']],
  4: [['right', 'bottom']],
  6: [['top', 'bottom']],
  7: [['left', 'bottom']],
  8: [['bottom', 'left']],
  9: [['bottom', 'top']],
  11: [['bottom', 'right']],
  12: [['right', 'left']],
  13: [['right', 'top']],
  14: [['top', 'left']],
}

/**
 * Extract the merged outline as one or more closed loops of points.
 *
 * Returns loops rather than a path string so a caller can measure, filter
 * or transform them; `mergedShapePath` is the wrapper that renders one.
 */
export function mergedShapeLoops(
  balls: Metaball[],
  options: MergeOptions,
): [number, number][][] {
  const live = balls.filter((b) => b.r > 0)
  if (live.length === 0) return []

  const n = Math.max(8, Math.round(options.resolution ?? 96))
  const exponent = exponentFor(options.gooeyness)
  const step = BOX / n

  // Sample the field on the grid corners once. Every cell reads four of
  // these, so computing them per cell would evaluate each point four times.
  const values = new Float64Array((n + 1) * (n + 1))
  for (let j = 0; j <= n; j++) {
    for (let i = 0; i <= n; i++) {
      values[j * (n + 1) + i] = fieldAt(live, i * step, j * step, exponent)
    }
  }
  const valueAt = (i: number, j: number) => values[j * (n + 1) + i]

  /*
    Crossing coordinates, keyed by the grid edge they sit on. Populated
    lazily: on a typical field only a thin band of edges is crossed at all.
  */
  const points = new Map<string, [number, number]>()

  function horizontal(i: number, j: number): string {
    const key = `h:${i}:${j}`
    if (!points.has(key)) {
      const t = crossing(valueAt(i, j), valueAt(i + 1, j))
      points.set(key, [(i + t) * step, j * step])
    }
    return key
  }

  function vertical(i: number, j: number): string {
    const key = `v:${i}:${j}`
    if (!points.has(key)) {
      const t = crossing(valueAt(i, j), valueAt(i, j + 1))
      points.set(key, [i * step, (j + t) * step])
    }
    return key
  }

  const segments: Segment[] = []

  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const va = valueAt(i, j)
      const vb = valueAt(i + 1, j)
      const vc = valueAt(i + 1, j + 1)
      const vd = valueAt(i, j + 1)

      const index =
        (va >= THRESHOLD ? 1 : 0) |
        (vb >= THRESHOLD ? 2 : 0) |
        (vc >= THRESHOLD ? 4 : 0) |
        (vd >= THRESHOLD ? 8 : 0)

      if (index === 0 || index === 15) continue

      const edge = (name: string): string => {
        switch (name) {
          case 'top':
            return horizontal(i, j)
          case 'bottom':
            return horizontal(i, j + 1)
          case 'left':
            return vertical(i, j)
          default:
            return vertical(i + 1, j)
        }
      }

      let pairs: [string, string][]
      if (index === 5 || index === 10) {
        /*
          The saddle: two opposite corners inside, two out, and the cell can
          be cut either as one waist or as two separate corners. The centre
          sample decides — if the middle of the cell is inside, the two
          inside corners are connected through it.

          At this resolution a saddle spans about a pixel of the preview, so
          the visible difference is nil; what the centre sample buys is
          consistency with the neighbouring cells, which is what keeps the
          loop closed.
        */
        const centre = fieldAt(live, (i + 0.5) * step, (j + 0.5) * step, exponent)
        const joined = centre >= THRESHOLD
        pairs =
          index === 5
            ? joined
              ? [
                  ['left', 'top'],
                  ['right', 'bottom'],
                ]
              : [
                  ['left', 'bottom'],
                  ['right', 'top'],
                ]
            : joined
              ? [
                  ['top', 'right'],
                  ['bottom', 'left'],
                ]
              : [
                  ['top', 'left'],
                  ['bottom', 'right'],
                ]
      } else {
        pairs = CASES[index] ?? []
      }

      for (const [from, to] of pairs) {
        segments.push({ from: edge(from), to: edge(to) })
      }
    }
  }

  return linkLoops(segments, points)
}

/**
 * Join segments into closed loops by walking `to` → `from`.
 *
 * A segment that leads nowhere ends its walk rather than failing: a field
 * clipped by the edge of the box genuinely produces an open chain, and
 * dropping it silently would lose a shape somebody can plainly see.
 */
function linkLoops(
  segments: Segment[],
  points: Map<string, [number, number]>,
): [number, number][][] {
  const byStart = new Map<string, Segment[]>()
  for (const segment of segments) {
    const list = byStart.get(segment.from)
    if (list) list.push(segment)
    else byStart.set(segment.from, [segment])
  }

  const used = new Set<Segment>()
  const loops: [number, number][][] = []

  for (const start of segments) {
    if (used.has(start)) continue

    const keys: string[] = [start.from]
    let current: Segment | undefined = start

    while (current && !used.has(current)) {
      used.add(current)
      keys.push(current.to)
      if (current.to === start.from) break
      current = byStart.get(current.to)?.find((s) => !used.has(s))
    }

    // Three points is the smallest thing with an inside. Anything shorter
    // is a single cell's worth of noise on the threshold.
    if (keys.length < 4) continue

    const loop = keys
      .map((key) => points.get(key))
      .filter((p): p is [number, number] => Boolean(p))

    // The walk records the closing point as well as the opening one; the
    // path renderer closes the loop itself, so carrying both would put a
    // zero-length segment in every shape.
    if (loop.length > 1 && loop[0][0] === loop[loop.length - 1][0] && loop[0][1] === loop[loop.length - 1][1]) {
      loop.pop()
    }
    if (loop.length >= 3) loops.push(loop)
  }

  return loops
}

/** Total length of a closed polyline. */
function perimeter(loop: [number, number][]): number {
  let total = 0
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i]
    const b = loop[(i + 1) % loop.length]
    total += Math.hypot(b[0] - a[0], b[1] - a[1])
  }
  return total
}

/**
 * Resample a loop to `count` points spaced evenly along its length.
 *
 * Marching squares gives points clustered wherever the grid happened to cut
 * the contour, and feeding those straight into a Catmull-Rom spline makes
 * the curve bunch and wobble in exactly those places. Even spacing is what
 * turns a traced contour into something that reads as drawn.
 */
export function resampleLoop(loop: [number, number][], count: number): [number, number][] {
  const total = perimeter(loop)
  if (total === 0 || count < 3) return loop

  const spacing = total / count
  const out: [number, number][] = []
  let travelled = 0
  let target = 0
  let i = 0

  while (out.length < count && i < loop.length) {
    const a = loop[i]
    const b = loop[(i + 1) % loop.length]
    const length = Math.hypot(b[0] - a[0], b[1] - a[1])

    while (target <= travelled + length && out.length < count) {
      const t = length === 0 ? 0 : (target - travelled) / length
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
      target += spacing
    }

    travelled += length
    i++
  }

  return out.length >= 3 ? out : loop
}

/**
 * Catmull-Rom through every point → a closed cubic-bezier `d` fragment.
 *
 * Shared with the single-blob mode of the clip-path tool, which had its own
 * copy. One curve function means the two modes cannot drift into producing
 * visibly different kinds of smoothness from the same kind of input.
 */
export function smoothClosedPath(points: [number, number][]): string {
  const n = points.length
  let d = `M ${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n]
    const p1 = points[i]
    const p2 = points[(i + 1) % n]
    const p3 = points[(i + 2) % n]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`
  }
  return d + ' Z'
}

/**
 * The merged shape as one SVG `d`, ready for a `<path>` or `clip-path`.
 *
 * Several loops become several subpaths in the same string. That is correct
 * for both destinations and is the reason the SVG this emits sets
 * `fill-rule="evenodd"`: a field with a hole in it produces an inner loop,
 * and under the default `nonzero` rule the hole fills in.
 */
export function mergedShapePath(balls: Metaball[], options: MergeOptions): string {
  const samples = Math.max(8, Math.round(options.samples ?? 56))
  return mergedShapeLoops(balls, options)
    .map((loop) => smoothClosedPath(resampleLoop(loop, samples)))
    .join(' ')
}

/** A standalone SVG document for the shape. */
export function shapeSvg(d: string, fill = 'currentColor'): string {
  return [
    `<svg viewBox="0 0 ${BOX} ${BOX}" xmlns="http://www.w3.org/2000/svg">`,
    `  <path d="${d}" fill="${fill}" fill-rule="evenodd" />`,
    '</svg>',
  ].join('\n')
}

/**
 * The shape as a React component someone can paste into a project.
 *
 * `currentColor` and a `className` pass-through rather than a baked fill:
 * the point of leaving with a component rather than a PNG is that it still
 * takes the colour of wherever it lands. `preserveAspectRatio` is left at
 * its default so the shape scales with the box it is given.
 */
export function shapeReactComponent(d: string, name = 'Blob'): string {
  const componentName = /^[A-Z][A-Za-z0-9]*$/.test(name) ? name : 'Blob'
  return `export function ${componentName}({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 ${BOX} ${BOX}"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="${d}"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  )
}`
}

/**
 * The shape as a CSS clip-path.
 *
 * Carries the same warning the single-blob mode does, and for the same
 * reason: `path()` clips in pixels, so the shape does not scale with the
 * element the way a percentage `polygon()` would. The SVG `<clipPath
 * clipPathUnits="objectBoundingBox">` route is the one that scales, and the
 * comment points at it rather than leaving someone to find out at a
 * different viewport width.
 */
export function shapeClipPathCss(d: string): string {
  return `.blob {
  /* The curve is drawn in a 0–${BOX} box, and clip-path: path() clips in px —
     so keep the element ${BOX}×${BOX}px, or transform: scale() it. To make the
     clip scale with any element instead, put this d in an SVG
     <clipPath clipPathUnits="objectBoundingBox"> and reference that. */
  width: ${BOX}px;
  height: ${BOX}px;
  clip-path: path('${d}');
}`
}
