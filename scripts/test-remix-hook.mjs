// Smoke-test the use-remixes hook's pure storage + dedup logic.
// Re-implements just the read/write + dedup transitions here (mirroring
// src/hooks/use-remixes.ts) so we can assert behavior without React.

import { strict as assert } from 'node:assert'

const STORAGE_KEY = 'hoverlab:remixes'
const MAX_ENTRIES = 24

function optsEqual(a, b) {
  return (
    a.hue === b.hue &&
    a.saturation === b.saturation &&
    a.scale === b.scale &&
    a.speed === b.speed
  )
}

function readRemixes(raw) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((e) =>
        e && typeof e === 'object' &&
        typeof e.id === 'string' &&
        typeof e.effectId === 'string' &&
        typeof e.customizedCss === 'string'
      )
      .slice(0, MAX_ENTRIES)
  } catch {
    return []
  }
}

// save() transition: prepend new entry, dedup by effectId+opts, cap at MAX
// Uses a monotonically increasing counter for IDs to guarantee uniqueness
// (mirrors the hook's crypto.randomUUID() approach — Date.now() alone can
// collide when saves happen in the same millisecond).
let _idCounter = 0
function nextId(effectId) {
  _idCounter += 1
  return `${effectId}-${_idCounter}`
}

function save(current, input) {
  const createdAt = new Date().toISOString()
  const id = nextId(input.effectId)
  const entry = { ...input, id, createdAt }
  const without = current.filter((e) => {
    if (e.effectId !== input.effectId) return true
    return !optsEqual(e.opts, input.opts)
  })
  return [entry, ...without].slice(0, MAX_ENTRIES)
}

function removeById(current, id) {
  return current.filter((e) => e.id !== id)
}

function hasRemix(current, effectId, opts) {
  return current.some(
    (e) => e.effectId === effectId && optsEqual(e.opts, opts),
  )
}

let failures = 0
function test(name, fn) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`)
    failures++
  }
}

const sampleInput = (effectId = 'btn-gradient', opts = { hue: 15, saturation: 0, scale: 1, speed: 1 }) => ({
  effectId,
  effectName: 'Gradient Shift Button',
  effectCategory: 'Buttons',
  opts,
  customizedCss: '.btn { color: red; }',
  html: '<button class="btn">Hi</button>',
  darkSurface: false,
})

console.log('use-remixes hook logic tests:')

test('readRemixes: empty/missing raw → []', () => {
  assert.deepEqual(readRemixes(undefined), [])
  assert.deepEqual(readRemixes(null), [])
  assert.deepEqual(readRemixes(''), [])
})

test('readRemixes: valid list', () => {
  const raw = JSON.stringify([{ id: 'a-1', effectId: 'a', customizedCss: '.x{}', opts: { hue: 0, saturation: 0, scale: 1, speed: 1 } }])
  assert.equal(readRemixes(raw).length, 1)
})

test('readRemixes: filters malformed entries', () => {
  const raw = JSON.stringify([
    { id: 'a-1', effectId: 'a', customizedCss: '.x{}', opts: { hue: 0, saturation: 0, scale: 1, speed: 1 } },
    { id: 'b-1' }, // missing effectId + customizedCss
    { effectId: 'c' }, // missing id + customizedCss
    'not-an-object',
    null,
  ])
  assert.equal(readRemixes(raw).length, 1)
})

test('readRemixes: handles corrupt JSON', () => {
  assert.deepEqual(readRemixes('not json'), [])
  assert.deepEqual(readRemixes('{bad'), [])
})

test('readRemixes: caps at MAX_ENTRIES (24)', () => {
  const list = Array.from({ length: 30 }, (_, i) => ({
    id: `e-${i}`,
    effectId: `e${i}`,
    customizedCss: '.x{}',
    opts: { hue: 0, saturation: 0, scale: 1, speed: 1 },
  }))
  assert.equal(readRemixes(JSON.stringify(list)).length, 24)
})

test('save: prepends to empty list', () => {
  const next = save([], sampleInput())
  assert.equal(next.length, 1)
  assert.equal(next[0].effectId, 'btn-gradient')
})

test('save: prepends to existing list (newest first)', () => {
  let list = save([], sampleInput('a'))
  list = save(list, sampleInput('b'))
  assert.equal(list.length, 2)
  assert.equal(list[0].effectId, 'b')  // newest first
  assert.equal(list[1].effectId, 'a')
})

test('save: dedupes same effectId + same opts (refreshes timestamp)', () => {
  let list = save([], sampleInput('a', { hue: 15, saturation: 0, scale: 1, speed: 1 }))
  list = save(list, sampleInput('a', { hue: 15, saturation: 0, scale: 1, speed: 1 }))
  assert.equal(list.length, 1)  // deduped, not 2
})

test('save: keeps different opts for same effectId (multiple remixes of same effect)', () => {
  let list = save([], sampleInput('a', { hue: 15, saturation: 0, scale: 1, speed: 1 }))
  list = save(list, sampleInput('a', { hue: 90, saturation: 0, scale: 1, speed: 1 }))
  assert.equal(list.length, 2)
})

test('save: caps at MAX_ENTRIES (24)', () => {
  let list = []
  for (let i = 0; i < 30; i++) {
    list = save(list, sampleInput(`e${i}`))
  }
  assert.equal(list.length, 24)
  // Most recent should be e29 (last saved), oldest kept should be e6
  assert.equal(list[0].effectId, 'e29')
  assert.equal(list[23].effectId, 'e6')
})

test('remove: by id', () => {
  let list = save([], sampleInput('a'))
  list = save(list, sampleInput('b'))
  const idToRemove = list[0].id
  list = removeById(list, idToRemove)
  assert.equal(list.length, 1)
  assert.equal(list[0].effectId, 'a')
})

test('hasRemix: true when effectId + opts match', () => {
  const opts = { hue: 15, saturation: 0, scale: 1, speed: 1 }
  let list = save([], sampleInput('a', opts))
  assert.equal(hasRemix(list, 'a', opts), true)
  assert.equal(hasRemix(list, 'a', { hue: 90, saturation: 0, scale: 1, speed: 1 }), false)
  assert.equal(hasRemix(list, 'b', opts), false)
})

test('optsEqual: handles all four fields', () => {
  assert.equal(optsEqual({ hue: 0, saturation: 0, scale: 1, speed: 1 }, { hue: 0, saturation: 0, scale: 1, speed: 1 }), true)
  assert.equal(optsEqual({ hue: 1, saturation: 0, scale: 1, speed: 1 }, { hue: 0, saturation: 0, scale: 1, speed: 1 }), false)
  assert.equal(optsEqual({ hue: 0, saturation: 1, scale: 1, speed: 1 }, { hue: 0, saturation: 0, scale: 1, speed: 1 }), false)
  assert.equal(optsEqual({ hue: 0, saturation: 0, scale: 1.1, speed: 1 }, { hue: 0, saturation: 0, scale: 1, speed: 1 }), false)
  assert.equal(optsEqual({ hue: 0, saturation: 0, scale: 1, speed: 1.1 }, { hue: 0, saturation: 0, scale: 1, speed: 1 }), false)
})

test('full workflow: save → save-different → save-same (dedup) → remove', () => {
  let list = []
  const opts1 = { hue: 15, saturation: 0, scale: 1, speed: 1 }
  const opts2 = { hue: 90, saturation: 0, scale: 1, speed: 1 }

  list = save(list, sampleInput('btn', opts1))
  assert.equal(list.length, 1)
  assert.equal(hasRemix(list, 'btn', opts1), true)

  list = save(list, sampleInput('btn', opts2))
  assert.equal(list.length, 2)
  assert.equal(hasRemix(list, 'btn', opts2), true)

  // Re-save opts1 — should dedup (move to top, not add a third)
  list = save(list, sampleInput('btn', opts1))
  assert.equal(list.length, 2)
  assert.equal(list[0].opts.hue, 15)  // most recent is opts1 again

  // Remove the topmost
  const top = list[0]
  list = removeById(list, top.id)
  assert.equal(list.length, 1)
  assert.equal(hasRemix(list, 'btn', opts1), false)
  assert.equal(hasRemix(list, 'btn', opts2), true)
})

console.log('')
if (failures === 0) {
  console.log(`All tests passed.`)
  process.exit(0)
} else {
  console.log(`${failures} test(s) failed.`)
  process.exit(1)
}
