import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { flagFor, countryNameFor } from './country-display'

/**
 * The PPP bar opens with a flag and a country name, and both are built from
 * a two-letter code that arrives over the wire. Neither decides a price, so
 * the failure these guard against is not a wrong charge — it is a bar that
 * opens with a mojibake box or the literal word "undefined" beside a real
 * discount, which is worse for trust than showing no bar at all.
 */

describe('flagFor', () => {
  test('builds the regional indicator pair for a country', () => {
    // 🇮🇳 — U+1F1EE U+1F1F3, the two letters of "IN" as indicator symbols.
    assert.equal(flagFor('IN'), '\u{1F1EE}\u{1F1F3}')
    assert.equal(flagFor('BR'), '\u{1F1E7}\u{1F1F7}')
    assert.equal(flagFor('NG'), '\u{1F1F3}\u{1F1EC}')
  })

  test('accepts the lowercase and padded forms a header might carry', () => {
    assert.equal(flagFor('in'), flagFor('IN'))
    assert.equal(flagFor(' br '), flagFor('BR'))
  })

  test('returns null rather than a glyph for anything that is not a code', () => {
    for (const input of [null, undefined, '', 'I', 'IND', '1N', 'in-IN', '  ']) {
      assert.equal(flagFor(input), null, `${JSON.stringify(input)} produced a flag`)
    }
  })

  test('every priced country produces a two-codepoint flag', async () => {
    // Imported here rather than at the top so this file stays usable if the
    // pricing table is ever moved: the assertion is about shape, not about
    // which countries are in the table today.
    const { pricedCountries } = await import('./billing/region')
    for (const code of [...pricedCountries(), 'IN']) {
      const flag = flagFor(code)
      assert.ok(flag, `${code} produced no flag`)
      assert.equal([...(flag as string)].length, 2, `${code} is not two codepoints`)
    }
  })
})

describe('countryNameFor', () => {
  test('names a country in English', () => {
    assert.equal(countryNameFor('IN', 'en'), 'India')
    assert.equal(countryNameFor('BR', 'en'), 'Brazil')
  })

  test('falls back to the bare code rather than to undefined', () => {
    // 'ZZ' is a well-formed code with no country behind it — the shape this
    // has to survive, since the value comes from a header we do not own.
    assert.equal(countryNameFor('ZZ', 'en'), 'ZZ')
  })

  test('returns null for anything that is not a code', () => {
    for (const input of [null, undefined, '', 'IND', '1N']) {
      assert.equal(countryNameFor(input), null)
    }
  })
})
