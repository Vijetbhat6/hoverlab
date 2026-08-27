import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  allowsAnalytics,
  clearConsent,
  readConsent,
  recordConsent,
  subscribeConsent,
} from './consent'

/**
 * The consent record decides whether PostHog runs at all, and every way it
 * can be wrong is silent: a stale version that keeps honouring an answer to
 * a question we no longer ask, a refusal that round-trips as consent, a
 * corrupt entry that throws on a page nobody was testing. None of those is
 * a type error and none of them shows up in a render.
 *
 * `window` is stubbed rather than mocked through a DOM library: consent.ts
 * touches exactly two browser things — a storage object and an event target
 * — and both have small honest fakes in the standard library.
 */

class MemoryStorage {
  private map = new Map<string, string>()
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value))
  }
  removeItem(key: string): void {
    this.map.delete(key)
  }
  get keys(): string[] {
    return [...this.map.keys()]
  }
  clear(): void {
    this.map.clear()
  }
}

const storage = new MemoryStorage()
const fakeWindow = Object.assign(new EventTarget(), { localStorage: storage })
;(globalThis as { window?: unknown }).window = fakeWindow

beforeEach(() => {
  storage.clear()
})

describe('readConsent', () => {
  test('nothing stored is not a refusal, it is no decision', () => {
    assert.equal(readConsent(), null)
    assert.equal(allowsAnalytics(readConsent()), false)
  })

  test('a record from an older version reads as no decision', () => {
    storage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ version: CONSENT_VERSION - 1, allowed: ['essential', 'analytics'], at: '' }),
    )
    // The point of the version: an answer to a narrower question is not
    // consent to a wider one, so the banner has to come back.
    assert.equal(readConsent(), null)
  })

  test('corrupt storage reads as no decision rather than throwing', () => {
    storage.setItem(CONSENT_STORAGE_KEY, '{not json')
    assert.equal(readConsent(), null)
    storage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ version: CONSENT_VERSION }))
    assert.equal(readConsent(), null)
  })

  test('an id we no longer offer is dropped, not treated as invalidating', () => {
    storage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        version: CONSENT_VERSION,
        allowed: ['essential', 'analytics', 'marketing'],
        at: '2026-01-01T00:00:00.000Z',
      }),
    )
    assert.deepEqual(readConsent()?.allowed, ['essential', 'analytics'])
  })
})

describe('recordConsent', () => {
  test('accepting round-trips as consent', () => {
    recordConsent(['analytics'])
    assert.equal(allowsAnalytics(readConsent()), true)
  })

  test('refusing round-trips as a refusal, not as an absence', () => {
    recordConsent([])
    const record = readConsent()
    assert.notEqual(record, null, 'a refusal must be stored, or the banner returns every page')
    assert.deepEqual(record?.allowed, ['essential'])
    assert.equal(allowsAnalytics(record), false)
  })

  test('essential is forced in and never duplicated', () => {
    recordConsent(['essential', 'essential', 'analytics'])
    assert.deepEqual(readConsent()?.allowed, ['essential', 'analytics'])
  })

  test('it writes one key and only that key', () => {
    recordConsent(['analytics'])
    assert.deepEqual(storage.keys, [CONSENT_STORAGE_KEY])
  })

  test('the decision is timestamped', () => {
    recordConsent([])
    assert.match(readConsent()?.at ?? '', /^\d{4}-\d{2}-\d{2}T/)
  })
})

describe('subscribeConsent', () => {
  test('a decision reaches listeners without a reload', () => {
    const seen: (string[] | null)[] = []
    const stop = subscribeConsent((record) => seen.push(record?.allowed ?? null))

    recordConsent(['analytics'])
    clearConsent()
    stop()
    recordConsent([])

    assert.deepEqual(seen, [['essential', 'analytics'], null], 'after stop() nothing more arrives')
  })
})

/**
 * The two decision buttons must stay indistinguishable. This is the one
 * property a later "make the primary action pop" edit would quietly break,
 * and unequal prominence is what regulators have treated as invalidating
 * consent — so it is checked against the source, where the drift happens.
 */
describe('the banner treats both answers alike', () => {
  const BANNER = readFileSync(
    fileURLToPath(new URL('../components/cookie-consent-banner.tsx', import.meta.url)),
    'utf8',
  )

  test('both decisions render from the same class constant', () => {
    const uses = [...BANNER.matchAll(/className=\{DECISION_BUTTON\}/g)]
    assert.equal(uses.length, 2, 'reject and accept must both use DECISION_BUTTON, unmodified')
    assert.equal(
      /className=\{`\$\{DECISION_BUTTON\}/.test(BANNER),
      false,
      'appending to DECISION_BUTTON at one call site is how the two stop matching',
    )
  })

  test('neither decision is styled as the loud one', () => {
    const decisionRow = BANNER.slice(BANNER.indexOf('const DECISION_BUTTON'))
    assert.equal(
      /DECISION_BUTTON =\s*'[^']*bg-primary/.test(decisionRow),
      false,
      'a filled primary treatment here is the visual version of burying reject',
    )
  })
})
