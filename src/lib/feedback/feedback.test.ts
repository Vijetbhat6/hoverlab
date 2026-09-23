/**
 * Tests for feedback validation.
 *
 * `/api/feedback` is a public endpoint that writes a document per call, so
 * what these pin is the shape of the door: nothing gets in that is not on an
 * allow-list, a bot that fills the honeypot is told it succeeded and stored
 * nowhere, and the two free-text fields cannot be abused for length or
 * control characters.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { ARTIFACT_LEVELS } from '@/lib/artifact-types'
import {
  FEEDBACK_KINDS,
  FEEDBACK_LIMITS,
  PROBLEM_KINDS,
  PROBLEM_LABEL,
  VOTE_KINDS,
  cleanText,
  validateFeedback,
} from './validate'

/** A catalog with exactly one artifact per level. */
const exists = (level: string, id: string) => id === `known-${level}`

function ok(body: unknown) {
  const verdict = validateFeedback(body, exists)
  assert.ok(verdict.ok, `expected ok, got ${JSON.stringify(verdict)}`)
  return verdict.value
}

function rejected(body: unknown) {
  const verdict = validateFeedback(body, exists)
  assert.equal(verdict.ok, false)
  return verdict as Exclude<typeof verdict, { ok: true }>
}

describe('level allow-list', () => {
  it('accepts every real level', () => {
    for (const level of ARTIFACT_LEVELS) {
      const value = ok({ level, id: `known-${level}`, kind: 'thumbs-up' })
      assert.equal(value.level, level)
    }
  })

  it('rejects anything else, including near misses', () => {
    for (const level of ['', 'Effect', 'effects', 'template ', '__proto__', 7, null, undefined]) {
      const verdict = rejected({ level, id: 'known-effect', kind: 'thumbs-up' })
      assert.ok('status' in verdict && verdict.status === 400, String(level))
    }
  })
})

describe('kind allow-list', () => {
  it('accepts every declared kind', () => {
    for (const kind of FEEDBACK_KINDS) {
      const value = ok({ level: 'block', id: 'known-block', kind, message: 'it broke' })
      assert.equal(value.kind, kind)
    }
  })

  it('rejects an unknown kind', () => {
    for (const kind of ['', 'spam', 'THUMBS-UP', 'bug', null, 3]) {
      rejected({ level: 'block', id: 'known-block', kind, message: 'x'.repeat(10) })
    }
  })

  it('the two lists partition the kinds, and every problem kind has a label', () => {
    assert.equal(FEEDBACK_KINDS.length, VOTE_KINDS.length + PROBLEM_KINDS.length)
    for (const kind of PROBLEM_KINDS) assert.ok(PROBLEM_LABEL[kind], kind)
  })
})

describe('artifact id', () => {
  it('must exist in the catalog for that level', () => {
    const verdict = rejected({ level: 'effect', id: 'no-such-effect', kind: 'thumbs-up' })
    assert.ok('status' in verdict && verdict.status === 404)
  })

  it('an id that exists at another level does not count', () => {
    const verdict = rejected({ level: 'effect', id: 'known-block', kind: 'thumbs-up' })
    assert.ok('status' in verdict && verdict.status === 404)
  })

  it('is required, trimmed and length-capped', () => {
    rejected({ level: 'effect', kind: 'thumbs-up' })
    rejected({ level: 'effect', id: '   ', kind: 'thumbs-up' })
    rejected({ level: 'effect', id: 'a'.repeat(FEEDBACK_LIMITS.id + 1), kind: 'thumbs-up' })
    assert.equal(ok({ level: 'effect', id: '  known-effect ', kind: 'thumbs-up' }).id, 'known-effect')
  })
})

describe('message', () => {
  const report = { level: 'page', id: 'known-page', kind: 'wrong-code' }

  it('is required for a problem report', () => {
    rejected({ ...report })
    rejected({ ...report, message: '' })
    rejected({ ...report, message: '  ' })
    rejected({ ...report, message: 'ab' })
  })

  it('is capped at 1000 characters, and exactly 1000 is fine', () => {
    assert.equal(ok({ ...report, message: 'a'.repeat(1000) }).message.length, 1000)
    const over = rejected({ ...report, message: 'a'.repeat(1001) })
    assert.ok('status' in over && over.status === 400)
  })

  it('is discarded from a thumb, which carries no text', () => {
    const value = ok({
      level: 'page',
      id: 'known-page',
      kind: 'thumbs-down',
      message: 'this should not be stored',
    })
    assert.equal(value.message, '')
  })

  it('strips control characters but keeps line breaks', () => {
    // Built from code points, so this file holds no control characters itself.
    const NUL = String.fromCharCode(0)
    const ESC = String.fromCharCode(27)
    const DEL = String.fromCharCode(127)
    assert.equal(cleanText(`a${NUL}b${ESC}[31mc${DEL}d`), 'ab[31mcd')
    assert.equal(cleanText('  line one\nline two\ttabbed  '), 'line one\nline two\ttabbed')
    const BEL = String.fromCharCode(7)
    assert.equal(ok({ ...report, message: `broken${BEL} again` }).message, 'broken again')
  })
})

describe('email', () => {
  const report = { level: 'template', id: 'known-template', kind: 'other', message: 'please look' }

  it('is optional', () => {
    assert.equal('email' in ok(report), false)
    assert.equal('email' in ok({ ...report, email: '' }), false)
    assert.equal('email' in ok({ ...report, email: '   ' }), false)
  })

  it('is kept, lower-cased, when given on a report', () => {
    assert.equal(ok({ ...report, email: ' Jane@Example.COM ' }).email, 'jane@example.com')
  })

  it('is rejected when it does not look like an address, or is too long', () => {
    for (const email of ['nope', 'a@b', '@x.com', 'a b@c.de', `${'a'.repeat(250)}@x.io`]) {
      rejected({ ...report, email })
    }
  })

  it('is never stored against a thumb', () => {
    const value = ok({
      level: 'template',
      id: 'known-template',
      kind: 'thumbs-up',
      email: 'jane@example.com',
    })
    assert.equal('email' in value, false)
  })
})

describe('honeypot', () => {
  it('a filled honeypot is flagged so the route can answer ok and store nothing', () => {
    const verdict = validateFeedback(
      { level: 'effect', id: 'known-effect', kind: 'thumbs-up', website: 'http://spam.example' },
      exists,
    )
    assert.deepEqual(verdict, { ok: false, honeypot: true })
  })

  it('wins over every other rule, so a bot learns nothing from a validation error', () => {
    const verdict = validateFeedback({ level: 'nonsense', kind: 'nonsense', website: 'x' }, exists)
    assert.deepEqual(verdict, { ok: false, honeypot: true })
  })

  it('an empty or whitespace honeypot is a human', () => {
    ok({ level: 'effect', id: 'known-effect', kind: 'thumbs-up', website: '' })
    ok({ level: 'effect', id: 'known-effect', kind: 'thumbs-up', website: '   ' })
  })
})

describe('body shape', () => {
  it('rejects non-objects', () => {
    for (const body of [null, undefined, 'string', 42, [], true]) {
      const verdict = validateFeedback(body, exists)
      assert.equal(verdict.ok, false)
    }
  })

  it('never carries an unknown key through', () => {
    const value = ok({
      level: 'effect',
      id: 'known-effect',
      kind: 'thumbs-up',
      isAdmin: true,
      uid: 'someone',
      createdAt: '1999-01-01',
    })
    assert.deepEqual(Object.keys(value).sort(), ['id', 'kind', 'level', 'message'])
  })
})
