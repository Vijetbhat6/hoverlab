/**
 * Tests for the per-client rate limiter.
 *
 *   npm test  →  node --conditions=react-server --import=tsx --test "src/lib/**\/*.test.ts"
 *
 * What matters here is not the counting, which is one comparison. It is the
 * three properties the callers depend on: a blocked client gets a usable
 * Retry-After, one client's budget never spends another's, and a broken
 * store lets the request through rather than taking sign-in down with it.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  RATE_LIMITS,
  enforceRateLimit,
  evaluateRateLimit,
  rateLimitKey,
  rateLimitedResponse,
  type RateLimitPolicy,
  type RateLimitStore,
} from './rate-limit'

/** An in-memory store with the same contract as the Firestore one. */
function memoryStore(): RateLimitStore & { keys: () => string[] } {
  const counts = new Map<string, number>()
  return {
    async hit(key) {
      const next = (counts.get(key) ?? 0) + 1
      counts.set(key, next)
      return next
    },
    keys: () => [...counts.keys()],
  }
}

const failingStore: RateLimitStore = {
  async hit() {
    throw new Error('firestore is down')
  },
}

const POLICY: RateLimitPolicy = {
  name: 'test',
  limit: 3,
  windowSeconds: 600,
  message: 'slow down',
}

const NOW = Date.UTC(2026, 8, 21, 12, 3, 20) // 12:03:20 — 200s into a ten-minute window

describe('evaluateRateLimit', () => {
  it('allows up to the limit and denies the next hit', async () => {
    const store = memoryStore()
    const seen: boolean[] = []
    for (let i = 0; i < 5; i++) {
      seen.push((await evaluateRateLimit(store, POLICY, 'abc', NOW)).allowed)
    }
    assert.deepEqual(seen, [true, true, true, false, false])
  })

  it('reports the seconds to the end of the window as Retry-After', async () => {
    const decision = await evaluateRateLimit(memoryStore(), POLICY, 'abc', NOW)
    // 12:03:20 sits 200s into the 12:00 window, so 400s remain.
    assert.equal(decision.retryAfterSeconds, 400)
  })

  it('never reports a zero or negative Retry-After', async () => {
    // Exactly on the boundary the previous window has just closed; the new
    // one is a full window long.
    const onBoundary = Date.UTC(2026, 8, 21, 12, 10, 0)
    const decision = await evaluateRateLimit(memoryStore(), POLICY, 'abc', onBoundary)
    assert.equal(decision.retryAfterSeconds, 600)
    const lastSecond = await evaluateRateLimit(
      memoryStore(),
      POLICY,
      'abc',
      onBoundary - 1,
    )
    assert.equal(lastSecond.retryAfterSeconds, 1)
  })

  it('keeps one client from spending another client\'s budget', async () => {
    const store = memoryStore()
    for (let i = 0; i < 4; i++) await evaluateRateLimit(store, POLICY, 'attacker', NOW)
    assert.equal((await evaluateRateLimit(store, POLICY, 'attacker', NOW)).allowed, false)
    assert.equal((await evaluateRateLimit(store, POLICY, 'bystander', NOW)).allowed, true)
  })

  it('keeps routes apart: login attempts do not spend the signup budget', async () => {
    const store = memoryStore()
    const a: RateLimitPolicy = { ...POLICY, name: 'login' }
    const b: RateLimitPolicy = { ...POLICY, name: 'signup' }
    for (let i = 0; i < 4; i++) await evaluateRateLimit(store, a, 'same-ip', NOW)
    assert.equal((await evaluateRateLimit(store, b, 'same-ip', NOW)).allowed, true)
  })

  it('starts a fresh count in the next window', async () => {
    const store = memoryStore()
    for (let i = 0; i < 4; i++) await evaluateRateLimit(store, POLICY, 'abc', NOW)
    assert.equal((await evaluateRateLimit(store, POLICY, 'abc', NOW)).allowed, false)
    const nextWindow = NOW + 600 * 1000
    assert.equal((await evaluateRateLimit(store, POLICY, 'abc', nextWindow)).allowed, true)
  })

  it('FAILS OPEN when the store throws', async () => {
    const original = console.error
    console.error = () => {}
    try {
      const decision = await evaluateRateLimit(failingStore, POLICY, 'abc', NOW)
      assert.equal(decision.allowed, true)
      assert.equal(decision.failedOpen, true)
    } finally {
      console.error = original
    }
  })
})

describe('rateLimitedResponse', () => {
  it('is a 429 with a Retry-After header in whole seconds', async () => {
    const decision = await evaluateRateLimit(memoryStore(), POLICY, 'abc', NOW)
    const res = rateLimitedResponse(POLICY, { ...decision, allowed: false })
    assert.equal(res.status, 429)
    assert.equal(res.headers.get('Retry-After'), '400')
    assert.equal(res.headers.get('Cache-Control'), 'no-store')
    const body = (await res.json()) as { error: string }
    assert.equal(body.error, 'slow down')
  })
})

describe('rateLimitKey / enforceRateLimit', () => {
  const req = (headers: Record<string, string>) =>
    new Request('https://example.test/api/x', { method: 'POST', headers })

  it('hashes the address: the key never contains it', () => {
    const key = rateLimitKey(req({ 'x-real-ip': '203.0.113.9' }))
    assert.ok(key)
    assert.match(key, /^[0-9a-f]{32}$/)
    assert.ok(!key.includes('203'))
  })

  it('gives the same key to the same address and different keys to different ones', () => {
    const a1 = rateLimitKey(req({ 'x-real-ip': '203.0.113.9' }))
    const a2 = rateLimitKey(req({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' }))
    const b = rateLimitKey(req({ 'x-real-ip': '203.0.113.10' }))
    assert.equal(a1, a2)
    assert.notEqual(a1, b)
  })

  it('does not limit a request with no address at all', async () => {
    assert.equal(rateLimitKey(req({})), null)
    // A store that would throw is never even reached.
    const limited = await enforceRateLimit(req({}), RATE_LIMITS.login, failingStore)
    assert.equal(limited, null)
  })

  it('returns the 429 once the budget is spent, and null before', async () => {
    const store = memoryStore()
    const request = req({ 'x-real-ip': '198.51.100.7' })
    const outcomes: (number | null)[] = []
    for (let i = 0; i < RATE_LIMITS.login.limit + 2; i++) {
      const res = await enforceRateLimit(request, RATE_LIMITS.login, store)
      outcomes.push(res ? res.status : null)
    }
    assert.deepEqual(
      outcomes,
      [...Array(RATE_LIMITS.login.limit).fill(null), 429, 429],
    )
  })

  it('lets the request through when the store is down', async () => {
    const original = console.error
    console.error = () => {}
    try {
      const res = await enforceRateLimit(
        req({ 'x-real-ip': '198.51.100.7' }),
        RATE_LIMITS.login,
        failingStore,
      )
      assert.equal(res, null)
    } finally {
      console.error = original
    }
  })
})

describe('RATE_LIMITS', () => {
  it('gives every policy a distinct name, so counters cannot collide', () => {
    const names = Object.values(RATE_LIMITS).map((p) => p.name)
    assert.equal(new Set(names).size, names.length)
  })

  it('sets the budgets the product promises', () => {
    assert.equal(RATE_LIMITS.login.limit, 10)
    assert.equal(RATE_LIMITS.login.windowSeconds, 600)
    assert.equal(RATE_LIMITS.newsletter.limit, 5)
    assert.equal(RATE_LIMITS.newsletter.windowSeconds, 3600)
    assert.equal(RATE_LIMITS.feedback.limit, 10)
    assert.equal(RATE_LIMITS.feedback.windowSeconds, 3600)
  })
})
