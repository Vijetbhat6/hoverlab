import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  AUDIT_RULES,
  CONFORMANCE_CLAIM_APPROVED,
  CRITERIA_COVERED,
  UNCHECKED_CRITERIA,
  artifactsWithFindings,
  evidenceSummary,
} from './a11y-evidence'

/**
 * These guard a document, not a component.
 *
 * The failure mode this file exists for is not a crash — it is a page that
 * still renders beautifully while quietly having become a claim we are not
 * entitled to make. Every assertion below is a sentence someone could
 * delete in a tidy-up without anything else noticing.
 */

const PAGE = readFileSync(
  join(process.cwd(), 'src', 'app', 'accessibility', 'page.tsx'),
  'utf8',
)

test('the summary is derived from the report, not typed out', () => {
  const summary = evidenceSummary()
  assert.ok(summary.artifacts > 100, `expected the whole catalog, got ${summary.artifacts}`)
  assert.equal(summary.artifacts, summary.blocks + summary.pages)
  assert.equal(summary.rules, AUDIT_RULES.length)
  assert.equal(summary.criteria, CRITERIA_COVERED.length)
  assert.equal(summary.unchecked, UNCHECKED_CRITERIA.length)
  // Rules outnumber criteria — several rules test one criterion — and a
  // page printing the rule count as a criterion count would overstate
  // coverage by exactly that difference.
  assert.ok(summary.rules >= summary.criteria)
})

test('the blind spots are never empty, and every one carries its reason', () => {
  // An empty list here would render as a page claiming total coverage.
  assert.ok(UNCHECKED_CRITERIA.length > 0, 'the audit must state what it cannot decide')
  for (const criterion of UNCHECKED_CRITERIA) {
    assert.ok(criterion.sc.length > 0)
    assert.ok(criterion.name.length > 0)
    assert.ok(
      criterion.why.length > 20,
      `"${criterion.sc}" needs a real reason, not a label: ${criterion.why}`,
    )
  }
})

test('contrast is declared unchecked', () => {
  // The single most load-bearing admission on the page: artifacts are
  // styled through tokens the consuming project supplies, so we cannot
  // decide 1.4.3 for anybody. If a future rule claims to check contrast
  // statically, this test should fail and be argued with.
  assert.ok(
    UNCHECKED_CRITERIA.some((c) => c.sc.includes('1.4.3')),
    'contrast must remain listed as not evaluated',
  )
})

test('the page cannot silently become a conformance statement', () => {
  // The disclaimer renders only under `!CONFORMANCE_CLAIM_APPROVED`, and
  // the blind-spot list is what makes the numbers honest. Removing either
  // is the edit that turns evidence into a claim.
  assert.match(PAGE, /CONFORMANCE_CLAIM_APPROVED/)
  assert.match(PAGE, /UNCHECKED_CRITERIA/)
  assert.match(
    PAGE,
    /evidence, not a conformance statement/i,
    'the disclaimer sentence has been removed or reworded',
  )
})

test('the claim stays gated until it is signed off', () => {
  // Not an assertion that it must be false forever — an assertion that it
  // is a real switch. If this fails, someone flipped it, and the review in
  // `scripts/audit-a11y.mts` should be attached to that commit.
  assert.equal(
    CONFORMANCE_CLAIM_APPROVED,
    false,
    'PUBLISHABLE flipped — a WCAG conformance claim now renders publicly. Confirm legal sign-off, then update this test.',
  )
})

test('the findings list has a shape to render even when it is empty', () => {
  const findings = artifactsWithFindings()
  assert.ok(Array.isArray(findings))
  for (const artifact of findings) {
    assert.ok(artifact.id.length > 0)
    assert.ok(artifact.findings.length > 0)
  }
})
