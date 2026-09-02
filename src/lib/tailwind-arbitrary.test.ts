import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { arbitrary, arbitraryValue, classes, rgbSlash } from './tailwind-arbitrary'

/**
 * The failure this module exists to prevent is silent: a class containing a
 * space is split by Tailwind's scanner into fragments that match nothing, so
 * the copied output compiles to no CSS at all while looking perfect in the
 * code block. Every test here is therefore about separators and escaping
 * rather than about shapes.
 */
describe('arbitraryValue', () => {
  test('turns spaces into underscores — the whole point', () => {
    assert.equal(arbitraryValue('0 1px 2px'), '0_1px_2px')
  })

  test('collapses runs of whitespace, including newlines, to one underscore', () => {
    assert.equal(arbitraryValue('0   1px\n2px'), '0_1px_2px')
  })

  test('escapes a literal underscore so it does not decode back to a space', () => {
    assert.equal(arbitraryValue('var(--my_token)'), 'var(--my\\_token)')
  })

  test('escapes underscores before writing separators, not after', () => {
    // The ordering bug produces `a\_b\_c`: the separator it just wrote gets
    // escaped too, and the value decodes with literal underscores.
    assert.equal(arbitraryValue('a_b c'), 'a\\_b_c')
  })

  test('leaves underscores in a url() alone, where Tailwind does no conversion', () => {
    assert.equal(
      arbitraryValue('url(/img/my_file.png)'),
      'url(/img/my_file.png)',
    )
  })

  test('encodes around a url() without touching inside it', () => {
    assert.equal(
      arbitraryValue('center / cover url(/a_b.png) no-repeat'),
      'center_/_cover_url(/a_b.png)_no-repeat',
    )
  })

  test('handles two url()s without swallowing the gap between them', () => {
    assert.equal(
      arbitraryValue('url(/a_1.png), url(/b_2.png)'),
      'url(/a_1.png),_url(/b_2.png)',
    )
  })

  test('spaces inside a url() become %20, not underscores', () => {
    // An underscore here would be a literal underscore in the URL (Tailwind
    // does no conversion inside url()), so the reference would 404 — and a
    // raw space would split the class. %20 is the only correct answer.
    assert.equal(
      arbitraryValue("url(\"data:image/svg+xml,%3Csvg width='2' height='2'%3E%3C/svg%3E\")"),
      "url(\"data:image/svg+xml,%3Csvg%20width='2'%20height='2'%3E%3C/svg%3E\")",
    )
  })

  test('a url() containing its own parens is not cut short at the inner one', () => {
    // The real payload: an inline SVG whose filter references url(%23n).
    // A `url\([^)]*\)` regex ends the span at that inner bracket and then
    // encodes the rest of the data URI as if it were ordinary CSS.
    const value = "url(\"data:image/svg+xml,%3Crect filter='url(%23n)' x='1 2'/%3E\")"
    const out = arbitraryValue(value)
    assert.equal(out.includes('%23n'), true)
    assert.equal(out.includes("x='1%202'"), true)
    assert.equal(out.includes('_'), false)
  })

  test('a value mixing a spaced url() with ordinary parts encodes each by its own rule', () => {
    assert.equal(
      arbitraryValue("linear-gradient(red, blue), url(\"a b.png\") no-repeat"),
      "linear-gradient(red,_blue),_url(\"a%20b.png\")_no-repeat",
    )
  })

  test('trims, and returns empty for whitespace', () => {
    assert.equal(arbitraryValue('  16px  '), '16px')
    assert.equal(arbitraryValue('   '), '')
  })

  test('leaves commas and slashes alone — neither breaks a class name', () => {
    assert.equal(
      arbitraryValue('rgb(0 0 0 / 0.05), rgb(1 1 1 / 0.1)'),
      'rgb(0_0_0_/_0.05),_rgb(1_1_1_/_0.1)',
    )
  })
})

describe('arbitrary', () => {
  test('wraps a value in the utility', () => {
    assert.equal(arbitrary('rounded', '16px'), 'rounded-[16px]')
  })

  test('produces a shadow a project can actually paste', () => {
    assert.equal(
      arbitrary('shadow', '0 1px 2px 0 rgb(0 0 0 / 0.05)'),
      'shadow-[0_1px_2px_0_rgb(0_0_0_/_0.05)]',
    )
  })

  test('returns empty rather than an empty bracket, so callers can join blind', () => {
    assert.equal(arbitrary('shadow', ''), '')
    assert.equal(arbitrary('shadow', '   '), '')
  })
})

describe('classes', () => {
  test('drops the empties a tool produces for controls left at their default', () => {
    assert.equal(classes('blur-[4px]', '', null, undefined, false, 'grayscale'), 'blur-[4px] grayscale')
  })

  test('is empty when everything is', () => {
    assert.equal(classes('', null, undefined), '')
  })
})

describe('rgbSlash', () => {
  test('uses the space-separated syntax, which carries no commas', () => {
    assert.equal(rgbSlash(0, 0, 0, 0.05), 'rgb(0 0 0 / 0.05)')
  })

  test('drops a fully opaque alpha rather than writing / 1', () => {
    assert.equal(rgbSlash(16, 185, 129, 1), 'rgb(16 185 129)')
  })

  test('rounds a float that would otherwise print fifteen decimals', () => {
    assert.equal(rgbSlash(0, 0, 0, 0.1 + 0.2), 'rgb(0 0 0 / 0.3)')
  })
})
