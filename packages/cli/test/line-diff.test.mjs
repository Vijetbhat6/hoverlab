import { test } from 'node:test'
import assert from 'node:assert/strict'

import { lineDiff } from '../src/commands.mjs'

/**
 * The bug this file exists for shipped and was caught by hand.
 *
 * The catalog serves LF. A file touched on Windows comes back CRLF, so
 * every line differs by a trailing carriage return and the diff called a
 * two-line edit "376 changed lines". That failure is silent, plausible, and
 * makes the command useless — which is the exact profile of a bug that
 * survives if nothing asserts against it.
 */

test('identical text produces no diff', () => {
  const text = 'const a = 1\nconst b = 2\n'
  assert.deepEqual(lineDiff(text, text), [])
})

test('CRLF against LF is not a difference', () => {
  const lf = 'one\ntwo\nthree'
  const crlf = 'one\r\ntwo\r\nthree'
  assert.deepEqual(lineDiff(crlf, lf), [])
  assert.deepEqual(lineDiff(lf, crlf), [])
})

test('one inserted line is one added line', () => {
  const before = 'a\nb\nc'
  const after = 'a\nb\nnew\nc'
  assert.deepEqual(lineDiff(before, after), ['+ new'])
})

test('one deleted line is one removed line', () => {
  const before = 'a\nb\nc'
  const after = 'a\nc'
  assert.deepEqual(lineDiff(before, after), ['- b'])
})

test('an edit is a removal and an addition, not a whole-file rewrite', () => {
  const before = 'a\nb\nc\nd\ne'
  const after = 'a\nb\nCHANGED\nd\ne'
  const result = lineDiff(before, after)

  assert.equal(result.length, 2)
  assert.ok(result.includes('- c'))
  assert.ok(result.includes('+ CHANGED'))
})

test('a CRLF file with a real edit reports only the real edit', () => {
  // The regression, exactly: same content, different endings, one change.
  const local = 'alpha\r\nbeta\r\n// mine\r\ndelta'
  const catalog = 'alpha\nbeta\ndelta'

  assert.deepEqual(lineDiff(local, catalog), ['- // mine'])
})

test('an empty file against content is all additions', () => {
  assert.deepEqual(lineDiff('', 'a\nb'), ['- ', '+ a', '+ b'])
})
