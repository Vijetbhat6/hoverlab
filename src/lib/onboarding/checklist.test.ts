import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, test } from 'node:test'

import {
  CHECKLIST_SOURCES,
  CHECKLIST_STEP_IDS,
  PLAYGROUND_STORAGE_KEY,
  checklistView,
  computeChecklist,
  dismissalKey,
  readDismissed,
  readPlaygroundOpened,
  writeDismissed,
  type ChecklistState,
  type ChecklistStorage,
} from './checklist'

/**
 * The checklist is a set of claims about a person ("you have not done X").
 * A wrong one is worse than none, so these pin the two failure modes that
 * matter: a step ticking off (or not) for the wrong reason, and a step being
 * shown at all when the state behind it has not loaded.
 */

/** A brand-new free account, nothing loaded beyond what /account always has. */
const FRESH: ChecklistState = {
  copiedCount: 0,
  favoriteCount: 0,
  bundleCount: 0,
  playgroundOpened: false,
  brandCustomized: false,
  hasPro: false,
}

const ids = (state: ChecklistState) => computeChecklist(state).steps.map((s) => s.id)
const done = (state: ChecklistState) =>
  computeChecklist(state)
    .steps.filter((s) => s.done)
    .map((s) => s.id)

function fakeStorage(initial: Record<string, string> = {}): ChecklistStorage & {
  data: Map<string, string>
} {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, String(value)),
    removeItem: (key) => void data.delete(key),
  }
}

/** Storage that refuses everything, as with site data blocked or a full quota. */
const THROWING: ChecklistStorage = {
  getItem() {
    throw new Error('blocked')
  },
  setItem() {
    throw new Error('blocked')
  },
  removeItem() {
    throw new Error('blocked')
  },
}

describe('computeChecklist — a fresh user', () => {
  const result = computeChecklist(FRESH)

  test('sees only the steps that need no server round-trip, all pending', () => {
    assert.deepEqual(
      result.steps.map((s) => s.id),
      ['copy', 'favorite', 'bundle', 'playground', 'brand'],
    )
    assert.equal(result.doneCount, 0)
    assert.equal(result.total, 5)
    assert.equal(result.complete, false)
    assert.equal(result.next?.id, 'copy')
  })

  test('is not shown Pro steps, or steps whose input has not loaded', () => {
    const shown = ids(FRESH)
    for (const hidden of ['passkey', 'key', 'key-used', 'collection'] as const) {
      assert.ok(!shown.includes(hidden), `${hidden} should not appear for a fresh free account`)
    }
  })
})

describe('computeChecklist — partial progress', () => {
  test('each local signal completes exactly its own step', () => {
    assert.deepEqual(done({ ...FRESH, copiedCount: 1 }), ['copy'])
    assert.deepEqual(done({ ...FRESH, favoriteCount: 3 }), ['favorite'])
    assert.deepEqual(done({ ...FRESH, bundleCount: 1 }), ['bundle'])
    assert.deepEqual(done({ ...FRESH, playgroundOpened: true }), ['playground'])
    assert.deepEqual(done({ ...FRESH, brandCustomized: true }), ['brand'])
  })

  test('progress is a count of what is true, and next skips finished steps', () => {
    const result = computeChecklist({ ...FRESH, copiedCount: 2, favoriteCount: 1 })
    assert.equal(result.doneCount, 2)
    assert.equal(result.total, 5)
    assert.equal(result.complete, false)
    assert.equal(result.next?.id, 'bundle')
  })

  test('completion is derived, not remembered: undoing the thing undoes the step', () => {
    assert.deepEqual(done({ ...FRESH, favoriteCount: 1 }), ['favorite'])
    assert.deepEqual(done({ ...FRESH, favoriteCount: 0 }), [])
  })
})

describe('computeChecklist — unknown is not zero', () => {
  test('a passkey count appears as a step only once it is known', () => {
    assert.ok(!ids({ ...FRESH, passkeyCount: null }).includes('passkey'))
    assert.ok(!ids({ ...FRESH, passkeyCount: undefined }).includes('passkey'))
    assert.ok(ids({ ...FRESH, passkeyCount: 0 }).includes('passkey'))
  })

  test('zero passkeys is pending and one is done', () => {
    const pending = computeChecklist({ ...FRESH, passkeyCount: 0 }).steps.find((s) => s.id === 'passkey')
    const complete = computeChecklist({ ...FRESH, passkeyCount: 1 }).steps.find((s) => s.id === 'passkey')
    assert.equal(pending?.done, false)
    assert.equal(complete?.done, true)
  })

  test('NaN is unknown, not a number', () => {
    assert.ok(!ids({ ...FRESH, passkeyCount: Number.NaN }).includes('passkey'))
  })
})

describe('computeChecklist — Pro steps', () => {
  const PRO: ChecklistState = { ...FRESH, hasPro: true }

  test('a free account is never handed a Pro step, even with the data', () => {
    const shown = ids({
      ...FRESH,
      hasPro: false,
      collectionCount: 4,
      licenseKey: { issued: true, used: true },
    })
    assert.ok(!shown.includes('collection'))
    assert.ok(!shown.includes('key'))
    assert.ok(!shown.includes('key-used'))
  })

  test('a Pro account with nothing loaded yet still gets only the base steps', () => {
    assert.deepEqual(ids(PRO), ['copy', 'favorite', 'bundle', 'playground', 'brand'])
  })

  test('with no key the key step is pending and using it is not offered yet', () => {
    const shown = computeChecklist({ ...PRO, licenseKey: { issued: false, used: false } }).steps
    assert.equal(shown.find((s) => s.id === 'key')?.done, false)
    assert.ok(!shown.some((s) => s.id === 'key-used'))
  })

  test('an issued, unused key offers the CLI step as pending', () => {
    const shown = computeChecklist({ ...PRO, licenseKey: { issued: true, used: false } }).steps
    assert.equal(shown.find((s) => s.id === 'key')?.done, true)
    assert.equal(shown.find((s) => s.id === 'key-used')?.done, false)
  })

  test('a used key completes both', () => {
    const shown = computeChecklist({ ...PRO, licenseKey: { issued: true, used: true } }).steps
    assert.equal(shown.find((s) => s.id === 'key')?.done, true)
    assert.equal(shown.find((s) => s.id === 'key-used')?.done, true)
  })

  test('collections count only when the store reported', () => {
    assert.ok(!ids({ ...PRO, collectionCount: null }).includes('collection'))
    assert.equal(
      computeChecklist({ ...PRO, collectionCount: 0 }).steps.find((s) => s.id === 'collection')?.done,
      false,
    )
    assert.equal(
      computeChecklist({ ...PRO, collectionCount: 2 }).steps.find((s) => s.id === 'collection')?.done,
      true,
    )
  })
})

describe('computeChecklist — complete', () => {
  const ALL_FREE: ChecklistState = {
    copiedCount: 1,
    favoriteCount: 1,
    bundleCount: 1,
    playgroundOpened: true,
    brandCustomized: true,
    hasPro: false,
    passkeyCount: 1,
  }

  test('is complete when every applicable step is done', () => {
    const result = computeChecklist(ALL_FREE)
    assert.equal(result.complete, true)
    assert.equal(result.doneCount, result.total)
    assert.equal(result.next, null)
  })

  test('a Pro step that appears later reopens a finished list', () => {
    assert.equal(computeChecklist(ALL_FREE).complete, true)
    const later = computeChecklist({
      ...ALL_FREE,
      hasPro: true,
      licenseKey: { issued: false, used: false },
    })
    assert.equal(later.complete, false)
    assert.equal(later.next?.id, 'key')
  })
})

describe('checklistView and dismissal', () => {
  const fresh = computeChecklist(FRESH)
  const finished = computeChecklist({
    ...FRESH,
    copiedCount: 1,
    favoriteCount: 1,
    bundleCount: 1,
    playgroundOpened: true,
    brandCustomized: true,
  })

  test('open by default, collapsed once dismissed, hidden once finished', () => {
    assert.equal(checklistView(fresh, false), 'open')
    assert.equal(checklistView(fresh, true), 'collapsed')
    assert.equal(checklistView(finished, false), 'hidden')
  })

  test('finished outranks dismissed: no collapsed line about nothing', () => {
    assert.equal(checklistView(finished, true), 'hidden')
  })

  test('a checklist with no verifiable steps is finished, so it is hidden', () => {
    const empty = { steps: [], doneCount: 0, total: 0, complete: true, next: null }
    assert.equal(checklistView(empty, false), 'hidden')
  })

  test('dismissal round-trips through storage, per user, with a way back', () => {
    const storage = fakeStorage()
    assert.equal(readDismissed(storage, 'u1'), false)

    assert.equal(writeDismissed(storage, 'u1', true), true)
    assert.equal(readDismissed(storage, 'u1'), true)
    assert.equal(readDismissed(storage, 'u2'), false, 'another user on this browser starts fresh')

    assert.equal(writeDismissed(storage, 'u1', false), true)
    assert.equal(readDismissed(storage, 'u1'), false, '"show again" clears it')
    assert.equal(storage.data.has(dismissalKey('u1')), false)
  })

  test('a store that throws reads as not dismissed and reports the failed write', () => {
    assert.equal(readDismissed(THROWING, 'u1'), false)
    assert.equal(writeDismissed(THROWING, 'u1', true), false)
    assert.equal(writeDismissed(THROWING, 'u1', false), false)
    assert.equal(readPlaygroundOpened(THROWING), false)
  })

  test('no storage at all (server render) is tolerated everywhere', () => {
    assert.equal(readDismissed(null, 'u1'), false)
    assert.equal(writeDismissed(null, 'u1', true), false)
    assert.equal(readPlaygroundOpened(null), false)
  })

  test('only the exact stored value counts as dismissed', () => {
    const storage = fakeStorage({ [dismissalKey('u1')]: 'true' })
    assert.equal(readDismissed(storage, 'u1'), false)
  })

  test('the playground signal is the key the playground writes', () => {
    assert.equal(readPlaygroundOpened(fakeStorage()), false)
    assert.equal(readPlaygroundOpened(fakeStorage({ [PLAYGROUND_STORAGE_KEY]: '{}' })), true)
  })
})

describe('the doc block and the code agree', () => {
  test('every step names where it reads from', () => {
    for (const id of CHECKLIST_STEP_IDS) {
      assert.ok(CHECKLIST_SOURCES[id]?.trim().length > 0, `${id} has no stated source`)
    }
  })

  test('step ids are unique and every step links somewhere real-shaped', () => {
    assert.equal(new Set(CHECKLIST_STEP_IDS).size, CHECKLIST_STEP_IDS.length)
    const everything = computeChecklist({
      ...FRESH,
      hasPro: true,
      passkeyCount: 0,
      collectionCount: 0,
      licenseKey: { issued: true, used: false },
    })
    assert.deepEqual(
      everything.steps.map((s) => s.id),
      [...CHECKLIST_STEP_IDS],
      'a fully loaded Pro account should see every step, in the documented order',
    )
    for (const step of everything.steps) {
      assert.match(step.href, /^\/[a-z]/, `${step.id} links to a site-relative path`)
    }
  })

  test('the playground key is the one the playground page actually writes', () => {
    const source = readFileSync(
      fileURLToPath(new URL('../../app/playground/page.tsx', import.meta.url)),
      'utf8',
    )
    assert.ok(
      source.includes(`STORAGE_KEY = '${PLAYGROUND_STORAGE_KEY}'`),
      'app/playground/page.tsx no longer stores under the key the checklist reads',
    )
  })

  test('the step links land on routes that exist', () => {
    const everything = computeChecklist({
      ...FRESH,
      hasPro: true,
      passkeyCount: 0,
      collectionCount: 0,
      licenseKey: { issued: true, used: false },
    })
    for (const step of everything.steps) {
      const route = step.href.split('#')[0]!.replace(/^\//, '')
      const path = fileURLToPath(new URL(`../../app/${route}/page.tsx`, import.meta.url))
      assert.doesNotThrow(() => readFileSync(path, 'utf8'), `${step.id} links to /${route}, which has no page.tsx`)
    }
  })
})
