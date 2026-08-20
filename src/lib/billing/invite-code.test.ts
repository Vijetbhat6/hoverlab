/**
 * Unit tests for workspace invite codes.
 *
 * These guard the two ends of a seat claim: a code nobody can guess, and a
 * parser forgiving enough that a person who pastes one out of Slack gets
 * their seat instead of an error.
 *
 * Runner: Node's built-in `node:test` via the tsx loader (no test deps).
 *   npm test
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { CODE_ALPHABET, generateInviteCode, normalizeInviteCode } from './invite-code'

describe('generateInviteCode', () => {
  it('produces the documented shape', () => {
    for (let i = 0; i < 50; i++) {
      assert.match(generateInviteCode(), /^HL-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
    }
  })

  it('only uses the unambiguous alphabet', () => {
    for (let i = 0; i < 200; i++) {
      for (const ch of generateInviteCode().replace(/-/g, '').slice(2)) {
        assert.ok(CODE_ALPHABET.includes(ch), `unexpected character ${ch}`)
      }
    }
  })

  it('excludes the glyphs people mistype', () => {
    for (const ch of ['O', '0', 'I', '1', 'U']) {
      assert.ok(!CODE_ALPHABET.includes(ch), `${ch} should not be in the alphabet`)
    }
  })

  it('does not repeat itself', () => {
    // 40 bits of entropy: a collision in 500 draws would mean the generator
    // is not actually random, not that we got unlucky.
    const seen = new Set(Array.from({ length: 500 }, generateInviteCode))
    assert.equal(seen.size, 500)
  })
})

describe('normalizeInviteCode', () => {
  it('round-trips a generated code', () => {
    const code = generateInviteCode()
    assert.equal(normalizeInviteCode(code), code)
  })

  it('accepts what people actually paste', () => {
    const code = 'HL-7K2M-9QPX'
    for (const variant of [
      'hl-7k2m-9qpx',
      'HL7K2M9QPX',
      '  HL-7K2M-9QPX  ',
      'HL 7K2M 9QPX',
      'hl_7k2m_9qpx',
      'HL-7K2M-\n9QPX',
    ]) {
      assert.equal(normalizeInviteCode(variant), code, `failed on ${JSON.stringify(variant)}`)
    }
  })

  it('rejects anything that is not a code', () => {
    for (const bad of [
      '',
      'nope',
      'HL-7K2M',           // too short
      'HL-7K2M-9QPXX',     // too long
      'XX-7K2M-9QPX',      // wrong prefix
      'HL-OOOO-IIII',      // characters the generator never emits
      'HL-7K2M-9QP1',      // one excluded character
    ]) {
      assert.equal(normalizeInviteCode(bad), null, `should have rejected ${JSON.stringify(bad)}`)
    }
  })
})
