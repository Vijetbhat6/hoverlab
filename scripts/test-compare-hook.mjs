// Smoke-test the use-compare hook's pure storage + state-transition logic
// without needing React. We re-implement just the read/write + transition
// logic here (mirroring src/hooks/use-compare.ts) so we can assert behavior.

import { strict as assert } from 'node:assert'

const STORAGE_KEY = 'hoverlab:compare'
const MAX_ENTRIES = 4

// ---- inlined from use-compare.ts ----
function readCompare(raw) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const seen = new Set()
    const out = []
    for (const id of parsed) {
      if (typeof id !== 'string') continue
      if (seen.has(id)) continue
      seen.add(id)
      out.push(id)
      if (out.length >= MAX_ENTRIES) break
    }
    return out
  } catch {
    return []
  }
}

// transition functions mirror the hook's action callbacks
function add(current, id) {
  if (current.includes(id)) return { next: current, added: true }
  if (current.length >= MAX_ENTRIES) return { next: current, added: false }
  return { next: [...current, id], added: true }
}

function toggle(current, id) {
  if (current.includes(id)) {
    return { next: current.filter((x) => x !== id), result: 'removed' }
  }
  if (current.length >= MAX_ENTRIES) return { next: current, result: 'full' }
  return { next: [...current, id], result: 'added' }
}

function clear() {
  return []
}

// ---- tests ----
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

console.log('use-compare hook logic tests:')

test('readCompare: empty / missing raw → []', () => {
  assert.deepEqual(readCompare(undefined), [])
  assert.deepEqual(readCompare(null), [])
  assert.deepEqual(readCompare(''), [])
})

test('readCompare: valid 3-item list', () => {
  const raw = JSON.stringify(['a', 'b', 'c'])
  assert.deepEqual(readCompare(raw), ['a', 'b', 'c'])
})

test('readCompare: caps at MAX_ENTRIES (4)', () => {
  const raw = JSON.stringify(['a', 'b', 'c', 'd', 'e', 'f'])
  assert.deepEqual(readCompare(raw), ['a', 'b', 'c', 'd'])
})

test('readCompare: dedupes', () => {
  const raw = JSON.stringify(['a', 'b', 'a', 'c', 'b'])
  assert.deepEqual(readCompare(raw), ['a', 'b', 'c'])
})

test('readCompare: ignores non-string entries', () => {
  const raw = JSON.stringify(['a', 1, null, 'b', {}, 'c'])
  assert.deepEqual(readCompare(raw), ['a', 'b', 'c'])
})

test('readCompare: handles corrupt JSON', () => {
  assert.deepEqual(readCompare('not json'), [])
  assert.deepEqual(readCompare('{bad'), [])
})

test('add: appends to empty list', () => {
  const { next, added } = add([], 'x')
  assert.equal(added, true)
  assert.deepEqual(next, ['x'])
})

test('add: appends to existing list', () => {
  const { next, added } = add(['a', 'b'], 'c')
  assert.equal(added, true)
  assert.deepEqual(next, ['a', 'b', 'c'])
})

test('add: no-op when already present', () => {
  const { next, added } = add(['a', 'b'], 'a')
  assert.equal(added, true)  // idempotent success
  assert.deepEqual(next, ['a', 'b'])
})

test('add: rejects when full', () => {
  const { next, added } = add(['a', 'b', 'c', 'd'], 'e')
  assert.equal(added, false)
  assert.deepEqual(next, ['a', 'b', 'c', 'd'])
})

test('toggle: adds when not present', () => {
  const { next, result } = toggle(['a'], 'b')
  assert.equal(result, 'added')
  assert.deepEqual(next, ['a', 'b'])
})

test('toggle: removes when present', () => {
  const { next, result } = toggle(['a', 'b'], 'a')
  assert.equal(result, 'removed')
  assert.deepEqual(next, ['b'])
})

test('toggle: returns "full" when at cap', () => {
  const { next, result } = toggle(['a', 'b', 'c', 'd'], 'e')
  assert.equal(result, 'full')
  assert.deepEqual(next, ['a', 'b', 'c', 'd'])
})

test('toggle: still removes when at cap (not full-blocked for removal)', () => {
  const { next, result } = toggle(['a', 'b', 'c', 'd'], 'a')
  assert.equal(result, 'removed')
  assert.deepEqual(next, ['b', 'c', 'd'])
})

test('clear: returns empty', () => {
  assert.deepEqual(clear(), [])
})

test('full workflow: add 4, reject 5th, remove 1, add it back', () => {
  let list = []
  list = add(list, 'a').next
  list = add(list, 'b').next
  list = add(list, 'c').next
  list = add(list, 'd').next
  assert.deepEqual(list, ['a', 'b', 'c', 'd'])
  // 5th rejected
  const rejected = add(list, 'e')
  assert.equal(rejected.added, false)
  assert.deepEqual(rejected.next, list)
  // remove 'b'
  const r = toggle(list, 'b')
  assert.equal(r.result, 'removed')
  list = r.next
  assert.deepEqual(list, ['a', 'c', 'd'])
  // now 'e' can be added
  list = add(list, 'e').next
  assert.deepEqual(list, ['a', 'c', 'd', 'e'])
})

console.log('')
if (failures === 0) {
  console.log(`All tests passed.`)
  process.exit(0)
} else {
  console.log(`${failures} test(s) failed.`)
  process.exit(1)
}
