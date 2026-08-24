import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  isToolId,
  rejectionReason,
  sanitizeToolPreset,
  sortToolPresets,
  TOOL_PRESET_LIMITS,
  type ToolPreset,
} from './tool-presets'

/**
 * A preset's `state` is opaque to the server — whatever the tool keeps goes
 * in the document unread. That is the design (see the note at the top of
 * tool-presets.ts) and it puts all the weight on this validator: it is the
 * only thing between an untrusted request body and a Firestore write.
 *
 * So these test the refusals rather than the happy path. Everything here is
 * something a hand-written request could actually contain.
 */

const NOW = '2026-08-24T00:00:00.000Z'

function preset(over: Partial<ToolPreset> = {}): Record<string, unknown> {
  return {
    id: 'abc-123',
    tool: '/tools/tokens',
    name: 'Northwind',
    state: { hue: 250, chroma: 0.19 },
    createdAt: NOW,
    updatedAt: NOW,
    ...over,
  }
}

describe('isToolId', () => {
  test('accepts the tool routes we serve', () => {
    for (const id of ['/tools/tokens', '/tools/border-radius', '/tools/color']) {
      assert.ok(isToolId(id), id)
    }
  })

  test('rejects anything that is not one', () => {
    for (const id of [
      '',
      '/tools/',
      '/tools/Tokens',
      '/tools/../account',
      '/tools/a/b',
      'tools/tokens',
      '/library',
      42,
      null,
    ]) {
      assert.ok(!isToolId(id), String(id))
    }
  })
})

describe('rejectionReason', () => {
  test('accepts a well-formed preset', () => {
    assert.equal(rejectionReason(preset()), null)
  })

  test('names what is wrong, rather than just refusing', () => {
    // Every one of these becomes a sentence the user reads. A bare 400 is
    // what makes people stop trusting a save button.
    assert.match(rejectionReason(preset({ name: '   ' }))!, /name/i)
    assert.match(rejectionReason(preset({ tool: '/nope' }))!, /tool/i)
    assert.match(rejectionReason({ ...preset(), state: undefined })!, /state/i)
  })

  test('rejects state that will not survive JSON', () => {
    // NaN and Infinity pass `typeof x === "number"` and become null in
    // JSON.stringify — a slider value silently changing on the way to disk.
    assert.ok(rejectionReason(preset({ state: { size: NaN } as never })))
    assert.ok(rejectionReason(preset({ state: { size: Infinity } as never })))
    assert.ok(rejectionReason(preset({ state: { fn: () => 1 } as never })))
    assert.ok(rejectionReason(preset({ state: { d: new Date() } as never })))
  })

  test('rejects a state nested past the depth limit', () => {
    let deep: Record<string, unknown> = { leaf: 1 }
    for (let i = 0; i < TOOL_PRESET_LIMITS.stateDepth + 2; i++) deep = { deep }
    assert.ok(rejectionReason(preset({ state: deep })))
  })

  test('rejects a state past the size limit, and says how big it was', () => {
    const big = { blob: 'x'.repeat(TOOL_PRESET_LIMITS.stateBytes + 1) }
    const reason = rejectionReason(preset({ state: big }))
    assert.match(reason!, /KB/)
  })

  test('accepts a state just under the size limit', () => {
    const fits = { blob: 'x'.repeat(TOOL_PRESET_LIMITS.stateBytes - 100) }
    assert.equal(rejectionReason(preset({ state: fits })), null)
  })

  test('rejects an array as state', () => {
    // `typeof [] === 'object'`, so this needs its own check — and a tool
    // whose state is a bare array cannot grow a field without a migration.
    assert.ok(rejectionReason(preset({ state: [1, 2] as never })))
  })
})

describe('sanitizeToolPreset', () => {
  test('trims and truncates the name rather than refusing it', () => {
    const long = 'n'.repeat(TOOL_PRESET_LIMITS.nameLength + 40)
    const clean = sanitizeToolPreset(preset({ name: `  ${long}  ` }), NOW)
    assert.equal(clean!.name.length, TOOL_PRESET_LIMITS.nameLength)
  })

  test('rejects ids that are not safe as a document key', () => {
    for (const id of ['../other', '__proto__', 'a/b', 'x'.repeat(65), 'has space']) {
      assert.equal(sanitizeToolPreset(preset({ id }), NOW), null, id)
    }
  })

  test('takes updatedAt from the caller, never from the body', () => {
    // Otherwise a client could backdate — or postdate — itself to the top of
    // a list sorted by updatedAt.
    const clean = sanitizeToolPreset(
      preset({ updatedAt: '2099-01-01T00:00:00.000Z' }),
      NOW,
    )
    assert.equal(clean!.updatedAt, NOW)
  })

  test('keeps createdAt when the body has one, so an overwrite is not a new preset', () => {
    const clean = sanitizeToolPreset(preset({ createdAt: '2020-01-01T00:00:00.000Z' }), NOW)
    assert.equal(clean!.createdAt, '2020-01-01T00:00:00.000Z')
  })
})

describe('sortToolPresets', () => {
  test('most recently touched first', () => {
    const a = sanitizeToolPreset(preset({ id: 'a' }), '2026-01-01T00:00:00.000Z')!
    const b = sanitizeToolPreset(preset({ id: 'b' }), '2026-06-01T00:00:00.000Z')!
    assert.deepEqual(
      sortToolPresets([a, b]).map((p) => p.id),
      ['b', 'a'],
    )
  })
})
