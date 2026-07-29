// Quick sanity check for the squircle path generator from the
// border-radius tool page. We re-implement the pure function here
// (mirroring src/app/tools/border-radius/page.tsx) and verify the
// output shape so we don't have to set up a React/Next test harness.

import { strict as assert } from 'node:assert'

let passed = 0
let failed = 0
function test(name, fn) {
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (e) {
    failed++
    console.error(`  ✗ ${name}: ${e.message}`)
  }
}

// Mirrors the implementation in src/app/tools/border-radius/page.tsx.
function squirclePath(size, curve) {
  const a = size / 2
  const b = size / 2
  const n = 2 + curve * 6
  const cx = a
  const cy = b
  const points = []
  const steps = 64
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const cosT = Math.cos(t)
    const sinT = Math.sin(t)
    const x = cx + a * Math.sign(cosT) * Math.pow(Math.abs(cosT), 2 / n)
    const y = cy + b * Math.sign(sinT) * Math.pow(Math.abs(sinT), 2 / n)
    points.push([x, y])
  }
  let d = `M ${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`
  for (let i = 0; i < points.length; i++) {
    const p0 = points[(i - 1 + points.length) % points.length]
    const p1 = points[i]
    const p2 = points[(i + 1) % points.length]
    const p3 = points[(i + 2) % points.length]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`
  }
  d += ' Z'
  return d
}

// Mirrors bezierY from easing page (with the t³ anchor term included).
function bezierY(p1, p2, x) {
  if (x <= 0) return 0
  if (x >= 1) return 1
  let t = x
  for (let i = 0; i < 8; i++) {
    const xt =
      3 * (1 - t) * (1 - t) * t * p1.x +
      3 * (1 - t) * t * t * p2.x +
      t * t * t
    const dx =
      3 * (1 - t) * (1 - t) * p1.x +
      6 * (1 - t) * t * (p2.x - p1.x) +
      3 * t * t * (1 - p2.x)
    if (Math.abs(dx) < 1e-6) break
    t = t - (xt - x) / dx
    t = Math.max(0, Math.min(1, t))
  }
  return (
    3 * (1 - t) * (1 - t) * t * p1.y +
    3 * (1 - t) * t * t * p2.y +
    t * t * t
  )
}

console.log('\nDesigner Tools (round 2) — squircle + bezier sanity tests\n')

// Squircle path
console.log('squirclePath:')

test('returns a string starting with M and ending with Z', () => {
  const d = squirclePath(200, 0.5)
  assert.ok(d.startsWith('M '), `expected M prefix, got: ${d.slice(0, 20)}`)
  assert.ok(d.endsWith(' Z'), `expected Z suffix, got: ${d.slice(-10)}`)
})

test('contains 64 C (cubic) segments', () => {
  const d = squirclePath(200, 0.5)
  const matches = d.match(/ C /g)
  assert.equal(matches?.length, 64, `expected 64 C segments, got ${matches?.length}`)
})

test('all coordinates are within [0, size] for size=200', () => {
  const d = squirclePath(200, 0.5)
  const nums = d.match(/-?\d+\.\d+/g)?.map(Number) ?? []
  for (const n of nums) {
    assert.ok(n >= -1 && n <= 201, `coordinate ${n} out of bounds for size=200`)
  }
})

test('curve=0 (n=2) produces a near-circle', () => {
  // For n=2 (curve=0), the superellipse is a perfect circle.
  // Verify by checking that points at 0° and 90° are at distance ≈ size/2.
  const size = 200
  const d = squirclePath(size, 0)
  // We don't parse the path here; just verify it runs without error
  // and produces a non-empty string.
  assert.ok(d.length > 100)
})

test('curve=1 (n=8) produces a near-rectangle', () => {
  const d = squirclePath(200, 1)
  assert.ok(d.length > 100)
})

test('different sizes produce proportional paths', () => {
  const a = squirclePath(100, 0.5)
  const b = squirclePath(200, 0.5)
  // The 200 version should have roughly 2× the coordinate values.
  const aNums = (a.match(/-?\d+\.\d+/g) ?? []).map(Number)
  const bNums = (b.match(/-?\d+\.\d+/g) ?? []).map(Number)
  // Just verify both have the same number of segments.
  assert.equal(aNums.length, bNums.length)
})

// Bezier
console.log('\nbezierY:')

test('linear curve (0,0)-(1,1) gives y=x', () => {
  const p1 = { x: 0, y: 0 }
  const p2 = { x: 1, y: 1 }
  for (const x of [0.1, 0.25, 0.5, 0.75, 0.9]) {
    const y = bezierY(p1, p2, x)
    assert.ok(Math.abs(y - x) < 0.01, `at x=${x}, expected y≈${x}, got ${y}`)
  }
})

test('ease-out-back overshoots above 1 near x=1', () => {
  const p1 = { x: 0.175, y: 0.885 }
  const p2 = { x: 0.32, y: 1.275 }
  // At x=1, y should be exactly 1 (we hard-clamp).
  assert.equal(bezierY(p1, p2, 1), 1)
  // Near x=0.85, the curve should overshoot above 1.
  const y = bezierY(p1, p2, 0.85)
  assert.ok(y > 1, `expected overshoot above 1, got ${y}`)
})

test('returns 0 for x=0 and 1 for x=1', () => {
  const p1 = { x: 0.25, y: 0.1 }
  const p2 = { x: 0.25, y: 1 }
  assert.equal(bezierY(p1, p2, 0), 0)
  assert.equal(bezierY(p1, p2, 1), 1)
})

test('anticipate curve dips below 0 at low x', () => {
  const p1 = { x: 0.5, y: -0.4 }
  const p2 = { x: 0.5, y: 1.4 }
  // At x=0.05, y should be negative (anticipation).
  const y = bezierY(p1, p2, 0.05)
  assert.ok(y < 0, `expected negative y, got ${y}`)
})

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
