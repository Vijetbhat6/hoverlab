/**
 * The accessibility audit, as something a reader can be shown.
 *
 * `scripts/audit-a11y.mts` has been writing `generated-a11y-report.json`
 * on every build for weeks and **nothing read it**. Hundreds of artifacts,
 * zero violations, and the only place any of it appeared was a line of
 * build output nobody outside this repo will ever see. This module is the
 * reader.
 *
 * THE DISTINCTION THIS FILE EXISTS TO HOLD
 *
 * Two different documents can be built from that JSON and only one of them
 * is safe to publish today:
 *
 *   EVIDENCE — "we ran these checks over every artifact and here is what
 *   they found, and here are the criteria the checks cannot see."
 *   That is a statement of fact about a process. It claims no conformance,
 *   it is verifiable by anyone who runs the script, and publishing it
 *   creates no obligation beyond being true.
 *
 *   A CONFORMANCE STATEMENT — "these components conform to WCAG 2.2 AA."
 *   Under the European Accessibility Act that is a legal instrument a buyer
 *   is entitled to rely on. It is not derivable from a regex pass, and
 *   making it would transfer a customer's exposure onto us.
 *
 * The audit script's `PUBLISHABLE` flag gates the second, not the first —
 * and it stays false until a lawyer has read the claim wording. Everything
 * exported here is deliberately the first kind, which is why the evidence
 * can ship now while the claim waits.
 *
 * `UNCHECKED` travels with every export on purpose. A document listing
 * passes and saying nothing about what was never looked at reads as
 * full coverage, and that silence is the actual liability — worse than
 * publishing nothing, because it is misleading rather than merely absent.
 *
 * No timestamp is available and that is also deliberate: see the note in
 * the audit script about why writing one would make the report look
 * freshly checked on every build.
 */

import REPORT from '@/lib/generated-a11y-report.json'

export interface AuditRule {
  id: string
  /** WCAG success criterion, e.g. "1.1.1". */
  sc: string
  level: string
  name: string
  severity: string
}

export interface UncheckedCriterion {
  sc: string
  name: string
  /** Why a static pass cannot decide it. Shown verbatim — never summarised. */
  why: string
}

export interface ArtifactAudit {
  id: string
  kind: string
  passed: string[]
  findings: Array<{ rule?: string; sc?: string; severity?: string; detail?: string }>
}

export interface AuditStandard {
  /** WCAG version, e.g. "2.2". */
  wcag: string
  /** Conformance level targeted, e.g. "AA". */
  level: string
  /** The harmonised European standard that version comes from. */
  en301549: string
}

interface Report {
  publishable: boolean
  standard: AuditStandard
  rules: AuditRule[]
  unchecked: UncheckedCriterion[]
  artifacts: ArtifactAudit[]
}

const report = REPORT as Report

/**
 * Which standard the numbers on this page are about.
 *
 * Exported so no page types a version number. "2.1" was hand-written into
 * the heading paragraph, the disclaimer, the meta description, the keyword
 * list and two later sections — five copies of a fact that changes when
 * EN 301 549 is revised, which it was. Five copies is five chances to
 * update four of them, and a page that says 2.2 in its table and 2.1 in its
 * disclaimer is worse than one that says 2.1 everywhere: it looks like the
 * claim was quietly widened.
 */
export const STANDARD: AuditStandard = report.standard

/**
 * Whether a WCAG conformance statement may be rendered.
 *
 * Read straight from the generated report rather than re-declared here, so
 * there is exactly one place the answer lives. Flipping it is a decision
 * made in `scripts/audit-a11y.mts` alongside legal sign-off — never here,
 * and never from an environment variable.
 */
export const CONFORMANCE_CLAIM_APPROVED: boolean = report.publishable === true

/** The criteria the audit actually decides. */
export const AUDIT_RULES: AuditRule[] = report.rules

/** The criteria it cannot, with the reason. Always shown alongside the above. */
export const UNCHECKED_CRITERIA: UncheckedCriterion[] = report.unchecked

/** Distinct WCAG success criteria covered, which is fewer than the rule count. */
export const CRITERIA_COVERED: string[] = [
  ...new Set(report.rules.map((rule) => rule.sc)),
].sort()

export interface EvidenceSummary {
  artifacts: number
  blocks: number
  pages: number
  /** Rules run, which is not the same as criteria — several rules share one. */
  rules: number
  criteria: number
  violations: number
  advisories: number
  unchecked: number
}

/**
 * The headline numbers, counted from the report rather than typed out.
 *
 * Every number a page could print about this audit is derived here, for the
 * reason `scripts/check-claimed-counts.mts` exists: a hand-written "204
 * artifacts" in a paragraph is a claim that goes stale the next time a
 * block lands, and this is the one document where a stale number is worse
 * than no number.
 */
export function evidenceSummary(): EvidenceSummary {
  const findings = report.artifacts.flatMap((artifact) => artifact.findings)

  return {
    artifacts: report.artifacts.length,
    blocks: report.artifacts.filter((a) => a.kind === 'block').length,
    pages: report.artifacts.filter((a) => a.kind === 'page').length,
    rules: report.rules.length,
    criteria: CRITERIA_COVERED.length,
    violations: findings.filter((f) => f.severity === 'violation').length,
    advisories: findings.filter((f) => f.severity === 'advisory').length,
    unchecked: report.unchecked.length,
  }
}

/**
 * Artifacts with an open finding, worst first.
 *
 * Exported even though it is empty today. A page that only renders when
 * the answer is "nothing wrong" is a page that has never been tested
 * against the case it exists for, and the first violation to land is
 * exactly the wrong moment to discover the template cannot show one.
 */
export function artifactsWithFindings(): ArtifactAudit[] {
  return report.artifacts
    .filter((artifact) => artifact.findings.length > 0)
    .sort((a, b) => b.findings.length - a.findings.length)
}
