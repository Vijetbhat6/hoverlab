/**
 * Tests for the mailing list's double opt-in.
 *
 * The property that matters is negative: an address that has not confirmed
 * must not be mailed, by ANY route — including the two that are easy to get
 * wrong, a row with no status at all (everything written before this
 * existed) and a row that unsubscribed and then re-submitted. Everything
 * else here is the plumbing that keeps that true: tokens that verify, expire
 * and cannot be recovered from what is stored.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  CONFIRM_TOKEN_TTL_MS,
  RESEND_COOLDOWN_MS,
  canReceiveMail,
  decideConfirm,
  decideSubscribe,
  hashToken,
  issueToken,
  looksLikeToken,
  sequenceForSubscriber,
  statusOf,
  tokenMatches,
  type SubscriberRow,
} from './newsletter-state'
import { SIGNUP_SOURCES } from './sequences'

const NOW = Date.UTC(2026, 8, 21, 12, 0, 0)

describe('tokens', () => {
  it('are 43 url-safe characters of randomness and pass looksLikeToken', () => {
    const { token } = issueToken(NOW)
    assert.equal(token.length, 43)
    assert.ok(looksLikeToken(token))
  })

  it('are never issued twice', () => {
    const seen = new Set(Array.from({ length: 200 }, () => issueToken(NOW).token))
    assert.equal(seen.size, 200)
  })

  it('store a hash that cannot be the token, and that the token verifies against', () => {
    const issued = issueToken(NOW)
    assert.notEqual(issued.hash, issued.token)
    assert.equal(issued.hash, hashToken(issued.token))
    assert.match(issued.hash, /^[0-9a-f]{64}$/)
    assert.ok(tokenMatches(issued.token, issued.hash))
  })

  it('do not verify against another token, an empty hash, or a malformed one', () => {
    const a = issueToken(NOW)
    const b = issueToken(NOW)
    assert.equal(tokenMatches(a.token, b.hash), false)
    assert.equal(tokenMatches(a.token, undefined), false)
    assert.equal(tokenMatches(a.token, 'not-hex'), false)
  })

  it('expire seven days after issue', () => {
    const issued = issueToken(NOW)
    assert.equal(issued.expiresAt - NOW, CONFIRM_TOKEN_TTL_MS)
    assert.equal(CONFIRM_TOKEN_TTL_MS, 7 * 24 * 60 * 60 * 1000)
  })

  it('reject things that cannot be tokens before any database is asked', () => {
    for (const bad of ['', 'short', 'x'.repeat(44), `${'a'.repeat(42)}!`, null, 7, undefined]) {
      assert.equal(looksLikeToken(bad), false, String(bad))
    }
  })
})

describe('who may be mailed', () => {
  it('only confirmed rows', () => {
    assert.equal(canReceiveMail({ status: 'confirmed' }), true)
    assert.equal(canReceiveMail({ status: 'pending' }), false)
    assert.equal(canReceiveMail({ status: 'unsubscribed' }), false)
  })

  it('never a legacy row: status "subscribed", or no status at all', () => {
    assert.equal(canReceiveMail({ status: 'subscribed' }), false)
    assert.equal(canReceiveMail({}), false)
    assert.equal(canReceiveMail(null), false)
    assert.equal(canReceiveMail(undefined), false)
    assert.equal(statusOf({ status: 'subscribed' }), 'legacy')
    assert.equal(statusOf({}), 'legacy')
  })

  it('a sequence is only offered to a confirmed subscriber', () => {
    for (const source of SIGNUP_SOURCES) {
      assert.ok(sequenceForSubscriber({ status: 'confirmed', source }), source)
      assert.equal(sequenceForSubscriber({ status: 'pending', source }), null, source)
      assert.equal(sequenceForSubscriber({ status: 'subscribed', source }), null, source)
      assert.equal(sequenceForSubscriber({ source }), null, source)
      assert.equal(sequenceForSubscriber({ status: 'unsubscribed', source }), null, source)
    }
  })
})

describe('subscribing', () => {
  it('a new address becomes pending and is sent a link when mail is configured', () => {
    assert.deepEqual(decideSubscribe(null, NOW, true), { kind: 'pending', send: true })
  })

  it('with no transport it is still recorded as pending, and nothing is sent', () => {
    assert.deepEqual(decideSubscribe(null, NOW, false), { kind: 'pending', send: false })
  })

  it('a confirmed address is never demoted or re-mailed by a re-submission', () => {
    assert.deepEqual(decideSubscribe({ status: 'confirmed' }, NOW, true), { kind: 'noop' })
    assert.deepEqual(decideSubscribe({ status: 'confirmed' }, NOW, false), { kind: 'noop' })
  })

  it('an unsubscribed address must confirm again — a stranger cannot re-enrol it', () => {
    assert.deepEqual(decideSubscribe({ status: 'unsubscribed' }, NOW, true), {
      kind: 'pending',
      send: true,
    })
  })

  it('a legacy row is asked to confirm', () => {
    assert.deepEqual(decideSubscribe({ status: 'subscribed' }, NOW, true), {
      kind: 'pending',
      send: true,
    })
    assert.deepEqual(decideSubscribe({}, NOW, true), { kind: 'pending', send: true })
  })

  it('a pending address is not re-mailed inside the cooldown, and is after it', () => {
    const recent: SubscriberRow = { status: 'pending', confirmationSentAt: NOW - 60_000 }
    const old: SubscriberRow = {
      status: 'pending',
      confirmationSentAt: NOW - RESEND_COOLDOWN_MS - 1,
    }
    assert.deepEqual(decideSubscribe(recent, NOW, true), { kind: 'pending', send: false })
    assert.deepEqual(decideSubscribe(old, NOW, true), { kind: 'pending', send: true })
  })

  it('a pending address that was never sent anything is sent one once mail exists', () => {
    assert.deepEqual(decideSubscribe({ status: 'pending' }, NOW, true), {
      kind: 'pending',
      send: true,
    })
  })
})

describe('confirming', () => {
  function pendingRow(now = NOW): { row: SubscriberRow; token: string } {
    const issued = issueToken(now)
    return {
      token: issued.token,
      row: {
        status: 'pending',
        confirmTokenHash: issued.hash,
        confirmTokenExpiresAt: issued.expiresAt,
      },
    }
  }

  it('confirms a pending row with a valid, unexpired token', () => {
    const { row, token } = pendingRow()
    assert.equal(decideConfirm(row, token, NOW + 1000), 'confirmed')
  })

  it('is invalid when no row has the token', () => {
    assert.equal(decideConfirm(null, issueToken().token, NOW), 'invalid')
  })

  it('is invalid when the presented token is not the stored one', () => {
    const { row } = pendingRow()
    assert.equal(decideConfirm(row, issueToken().token, NOW), 'invalid')
  })

  it('is expired after seven days, and still valid on the last millisecond', () => {
    const { row, token } = pendingRow()
    assert.equal(decideConfirm(row, token, NOW + CONFIRM_TOKEN_TTL_MS), 'confirmed')
    assert.equal(decideConfirm(row, token, NOW + CONFIRM_TOKEN_TTL_MS + 1), 'expired')
  })

  it('a row with no recorded expiry is treated as expired, never as immortal', () => {
    const { row, token } = pendingRow()
    delete row.confirmTokenExpiresAt
    assert.equal(decideConfirm(row, token, NOW), 'expired')
  })

  it('says already-confirmed on a second click, even past the expiry', () => {
    const { row, token } = pendingRow()
    const confirmed: SubscriberRow = { ...row, status: 'confirmed' }
    assert.equal(decideConfirm(confirmed, token, NOW + 1000), 'already-confirmed')
    assert.equal(
      decideConfirm(confirmed, token, NOW + CONFIRM_TOKEN_TTL_MS * 5),
      'already-confirmed',
    )
  })

  it('never resurrects an unsubscribed row', () => {
    const { row, token } = pendingRow()
    assert.equal(
      decideConfirm({ ...row, status: 'unsubscribed' }, token, NOW + 1000),
      'unsubscribed',
    )
  })

  it('the full lifecycle: new -> pending -> confirmed -> unsubscribed -> pending again', () => {
    // 1. sign up
    assert.deepEqual(decideSubscribe(null, NOW, true), { kind: 'pending', send: true })
    const { row, token } = pendingRow()
    assert.equal(canReceiveMail(row), false)
    // 2. follow the link
    assert.equal(decideConfirm(row, token, NOW + 1000), 'confirmed')
    const confirmed: SubscriberRow = { ...row, status: 'confirmed' }
    assert.equal(canReceiveMail(confirmed), true)
    // 3. opt out
    const gone: SubscriberRow = { ...confirmed, status: 'unsubscribed' }
    assert.equal(canReceiveMail(gone), false)
    // 4. re-submitting does not re-enrol; it asks for confirmation again
    assert.deepEqual(decideSubscribe(gone, NOW + 2000, true), { kind: 'pending', send: true })
  })
})
