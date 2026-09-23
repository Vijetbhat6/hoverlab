import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PRICING_FAQ } from './pricing-faq'

/**
 * The pricing FAQ restates commitments made on the legal pages. If the
 * refund window changes there and not here, /pricing (and the FAQPage data a
 * search engine quotes) promises something the terms no longer do.
 */

const read = (rel: string) =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')

describe('PRICING_FAQ', () => {
  test('has no duplicate or empty entries', () => {
    const questions = PRICING_FAQ.map((e) => e.q)
    assert.equal(new Set(questions).size, questions.length)
    for (const entry of PRICING_FAQ) {
      assert.ok(entry.q.trim().endsWith('?'), `"${entry.q}" is not a question`)
      assert.ok(entry.a.trim().length > 40, `"${entry.q}" has no real answer`)
    }
  })

  test('the refund answer names the same window as /refunds', () => {
    const refunds = read('../app/(legal)/refunds/page.tsx')
    assert.match(refunds, /14 days/, 'refund policy no longer says 14 days')

    const answer = PRICING_FAQ.find((e) => /refund/i.test(e.q))?.a ?? ''
    assert.match(answer, /14-day|14 days/)
  })

  test('the tax answer matches the terms (Polar is merchant of record)', () => {
    const terms = read('../app/(legal)/terms/page.tsx')
    assert.match(terms, /merchant of record/i)

    const answer = PRICING_FAQ.find((e) => /tax|invoice/i.test(e.q))?.a ?? ''
    assert.match(answer, /merchant of record/i)
  })

  test('makes no regional or student pricing promise', () => {
    // Whether a visitor sees a discount depends on the deployment and the
    // Polar dashboard, so a static FAQ must not claim one.
    for (const entry of PRICING_FAQ) {
      assert.doesNotMatch(entry.a, /\b(PPP|regional|student|discount)\b/i, entry.q)
    }
  })
})
