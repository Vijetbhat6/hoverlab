import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { isAiConfigured, AiNotConfiguredError, AI_MODEL } from './claude'

/**
 * What is worth testing here is the gate, not the model call.
 *
 * `complete()` cannot be exercised without spending real money, so these
 * cover the thing that decides whether it is reached at all — and that
 * decision is the one that went wrong before: the previous SDK had no
 * configuration check, so three routes charged, called, failed and
 * refunded on every request while reporting a temporary outage.
 */
describe('isAiConfigured', () => {
  function withKey<T>(value: string | undefined, run: () => T): T {
    const before = process.env.ANTHROPIC_API_KEY
    if (value === undefined) delete process.env.ANTHROPIC_API_KEY
    else process.env.ANTHROPIC_API_KEY = value
    try {
      return run()
    } finally {
      if (before === undefined) delete process.env.ANTHROPIC_API_KEY
      else process.env.ANTHROPIC_API_KEY = before
    }
  }

  test('unset is not configured', () => {
    assert.equal(
      withKey(undefined, isAiConfigured),
      false,
    )
  })

  test('a real key is configured', () => {
    assert.equal(withKey('sk-ant-example', isAiConfigured), true)
  })

  test('empty is not configured', () => {
    assert.equal(withKey('', isAiConfigured), false)
  })

  /**
   * The trap. A dashboard variable cleared with the space bar, or a key
   * pasted with a trailing newline stripped down to nothing, both leave
   * whitespace — which a truthiness check reads as a configured key and
   * then fails on at request time, after metering.
   */
  test('whitespace-only is not configured', () => {
    assert.equal(withKey('   \n', isAiConfigured), false)
  })

  /**
   * Read live, not captured at import. A server whose environment changes
   * — or a test that sets the variable after this module loaded — must see
   * the current value.
   */
  test('reads the environment on every call, not once at import', () => {
    assert.equal(withKey(undefined, isAiConfigured), false)
    assert.equal(withKey('sk-ant-example', isAiConfigured), true)
    assert.equal(withKey(undefined, isAiConfigured), false)
  })
})

describe('AiNotConfiguredError', () => {
  test('is distinguishable from an ordinary failure', () => {
    const err = new AiNotConfiguredError()
    assert.ok(err instanceof Error)
    assert.equal(err.name, 'AiNotConfiguredError')
    assert.match(err.message, /ANTHROPIC_API_KEY/)
  })
})

describe('AI_MODEL', () => {
  /**
   * Pinned rather than free-form. The routes tune `effort` per call site
   * and all three assume the same model underneath; a stray edit to one
   * route's model would make those effort choices meaningless.
   */
  test('is a single pinned model id', () => {
    assert.equal(AI_MODEL, 'claude-opus-5')
  })
})
