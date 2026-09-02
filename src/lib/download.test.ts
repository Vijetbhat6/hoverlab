import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { fileSlug } from './download'

/**
 * Only `fileSlug` is testable here — everything else in the module drives
 * the DOM (anchors, canvases, `Image`) and the test runner has no document.
 * The DOM half is exercised in the browser instead; this covers the one
 * piece that is pure and the one piece whose output ends up in a filename a
 * user sees.
 */
describe('fileSlug', () => {
  test('lowercases and hyphenates', () => {
    assert.equal(fileSlug('Sunset Warm'), 'sunset-warm')
  })

  test('collapses runs of punctuation into a single hyphen', () => {
    assert.equal(fileSlug('a  --  b!!!c'), 'a-b-c')
  })

  test('trims leading and trailing hyphens rather than shipping "-name-.png"', () => {
    assert.equal(fileSlug('  #hero#  '), 'hero')
  })

  test('falls back when the input has nothing usable in it', () => {
    assert.equal(fileSlug('###'), 'hoverlab')
    assert.equal(fileSlug(''), 'hoverlab')
    assert.equal(fileSlug('!!!', 'palette'), 'palette')
  })

  test('caps the length, because a pasted paragraph is a legal input', () => {
    assert.equal(fileSlug('x'.repeat(200)).length, 48)
  })

  test('keeps digits, which is most of what a hex name is', () => {
    assert.equal(fileSlug('#10b981'), '10b981')
  })
})
