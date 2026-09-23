import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { scrubSharedLinks } from './analytics-scrub'

const token = randomBytes(24).toString('base64url') // 32 chars, like the real ones

describe('scrubSharedLinks', () => {
  test('removes the token from every URL-bearing property', () => {
    const out = scrubSharedLinks({
      properties: {
        $current_url: `https://example.test/c/${token}`,
        $pathname: `/c/${token}`,
        $referrer: `https://example.test/c/${token}?x=1`,
        $initial_current_url: `https://example.test/c/${token}`,
      },
    })
    const dump = JSON.stringify(out)
    assert.ok(!dump.includes(token), 'token survived')
    assert.equal(out.properties?.$pathname, '/c/[shared]')
    assert.equal(out.properties?.$referrer, 'https://example.test/c/[shared]?x=1')
  })

  test('reaches nested autocapture element chains', () => {
    const out = scrubSharedLinks({
      properties: {
        $elements: [{ tag_name: 'a', attr__href: `/c/${token}`, nth_child: 1 }],
      },
    })
    assert.ok(!JSON.stringify(out).includes(token))
    const first = (out.properties?.$elements as Array<Record<string, unknown>>)[0]
    assert.equal(first.attr__href, '/c/[shared]')
    assert.equal(first.nth_child, 1, 'non-string values are left alone')
  })

  test('leaves ordinary pages and short /c/ paths untouched', () => {
    const props = {
      $pathname: '/effect/solid-blue-md-button-0040',
      $current_url: 'https://example.test/collections/',
      short: '/c/abc',
    }
    assert.deepEqual(scrubSharedLinks({ properties: props }).properties, props)
  })

  test('scrubs $set and $set_once too', () => {
    const out = scrubSharedLinks({
      properties: {},
      $set: { $current_url: `/c/${token}` },
      $set_once: { $initial_current_url: `/c/${token}` },
    })
    assert.ok(!JSON.stringify(out).includes(token))
  })

  test('passes null through, never drops an event, never mutates its input', () => {
    assert.equal(scrubSharedLinks(null), null)
    const input = { properties: { $pathname: `/c/${token}` } }
    const out = scrubSharedLinks(input)
    assert.notEqual(out, undefined)
    assert.equal(input.properties.$pathname, `/c/${token}`, 'input was mutated')
  })

  test('survives a payload nested deeper than it will walk', () => {
    let deep: Record<string, unknown> = { leaf: `/c/${token}` }
    for (let i = 0; i < 20; i++) deep = { next: deep }
    assert.doesNotThrow(() => scrubSharedLinks({ properties: deep }))
  })
})
