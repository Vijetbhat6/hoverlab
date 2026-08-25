/**
 * Tests for the signup-source → sequence mapping.
 *
 *   npm test  →  node --import=tsx --test src/lib/sequences.test.ts
 *
 * The point of these is not the mapping function, which is four lines. It
 * is the invariant underneath it: a `source` the signup endpoint accepts is
 * a promise that whoever signed up there receives something. Five of the
 * six sources broke that promise for months — the route validated them,
 * Firestore recorded them, and `sequenceForSource` returned null for every
 * one — and nothing anywhere failed, because nothing was checking.
 *
 * So the first test is the one that matters, and it fails the build rather
 * than warning: adding a source to SIGNUP_SOURCES without writing what it
 * sends is now a broken test, not a silent dead end.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  SEQUENCES,
  SIGNUP_SOURCES,
  sequenceForSource,
  type Sequence,
} from './sequences'

describe('signup sources', () => {
  it('every accepted source enrols into a sequence', () => {
    for (const source of SIGNUP_SOURCES) {
      assert.ok(
        sequenceForSource(source),
        `signup source "${source}" is accepted by the API and enrols nobody into anything`,
      )
    }
  })

  it('no source is claimed by two sequences', () => {
    const seen = new Map<string, string>()
    for (const sequence of SEQUENCES) {
      for (const source of sequence.sources) {
        const already = seen.get(source)
        assert.equal(
          already,
          undefined,
          `source "${source}" is claimed by both "${already}" and "${sequence.id}"`,
        )
        seen.set(source, sequence.id)
      }
    }
  })

  it('no sequence claims a source the API does not accept', () => {
    // The other direction of the same invariant. A sequence written for a
    // source nothing sends is not harmless — it reads as covered on the
    // page listing what we send, and enrols nobody.
    const accepted = new Set<string>(SIGNUP_SOURCES)
    for (const sequence of SEQUENCES) {
      for (const source of sequence.sources) {
        assert.ok(
          accepted.has(source),
          `sequence "${sequence.id}" claims source "${source}", which the signup API rejects`,
        )
      }
    }
  })

  it('an unknown source enrols into nothing rather than the default', () => {
    // Deliberate: a typo must surface as "nobody is enrolled", never as a
    // stranger receiving someone else's five emails.
    assert.equal(sequenceForSource('not-a-source'), null)
    assert.equal(sequenceForSource(''), null)
  })
})

describe('sequence shape', () => {
  const forEachEmail = (fn: (s: Sequence, i: number) => void) => {
    for (const sequence of SEQUENCES) {
      sequence.emails.forEach((_, i) => fn(sequence, i))
    }
  }

  it('sequence ids are unique', () => {
    const ids = SEQUENCES.map((s) => s.id)
    assert.equal(new Set(ids).size, ids.length)
  })

  it('every sequence starts on day 0 and its days ascend', () => {
    for (const sequence of SEQUENCES) {
      assert.ok(sequence.emails.length > 0, `${sequence.id} has no emails`)
      assert.equal(
        sequence.emails[0]?.day,
        0,
        `${sequence.id} does not send anything on signup`,
      )

      // Strictly ascending. Two emails on the same day is a scheduling bug
      // that reads as fine in source order and arrives as a double-send.
      for (let i = 1; i < sequence.emails.length; i += 1) {
        const prev = sequence.emails[i - 1]!
        const curr = sequence.emails[i]!
        assert.ok(
          curr.day > prev.day,
          `${sequence.id}: email ${i} is on day ${curr.day}, after day ${prev.day}`,
        )
      }
    }
  })

  it('every email has a subject and a body', () => {
    forEachEmail((sequence, i) => {
      const email = sequence.emails[i]!
      assert.ok(email.subject.trim().length > 0, `${sequence.id}[${i}] has no subject`)
      assert.ok(email.body.trim().length > 0, `${sequence.id}[${i}] has no body`)
    })
  })

  it('no email mentions a price', () => {
    // Prices move and these are written months before they send. Every
    // sequence links to /pricing or /licence instead, which cannot go
    // stale. A "$59" surviving in an email that goes out after a price
    // change is a number we would be held to.
    forEachEmail((sequence, i) => {
      const email = sequence.emails[i]!
      const found = `${email.subject} ${email.body}`.match(/\$\d/)
      assert.equal(
        found,
        null,
        `${sequence.id}[${i}] states a price — link to /pricing instead`,
      )
    })
  })
})
