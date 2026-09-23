/**
 * The stress report: what the harness measured, and the sums over it.
 *
 * `generated-stress-report.json` is written by `scripts/stress-matrix.mts`
 * and read by the /stress pages and by `scripts/check-stress.mts`. This file
 * is the one place that knows its shape and how to add it up, so the pages
 * and the gate cannot disagree about what "passes all six" means.
 *
 * ── WHAT "PASSES A FAMILY" MEANS ────────────────────────────────────────
 *
 * A family passes when every condition in it either passed or was not
 * applicable, and at least one of them actually ran. An artifact with no
 * numbers in it cannot fail the huge-numbers stress, but a family made only
 * of conditions that had nothing to act on has not been verified, and it is
 * counted as such. Counting it as a pass is the easiest way to arrive at an
 * impressive "verified under six stresses" that is partly untested.
 */

import {
  STRESSES,
  STRESS_FAMILIES,
  STRESS_VERSION,
  artifactKey,
  stressesInFamily,
  type StressFamilyId,
  type StressId,
  type StressLevel,
} from './conditions'
import RAW_REPORT from '../generated-stress-report.json'

/** 1 pass, 0 fail, 2 not applicable, 3 the harness could not load it. */
export type StoredOutcome = 0 | 1 | 2 | 3

export interface StoredResult {
  /** Hash of the artifact's shipped source when it was measured. */
  h: string
  /** Date of the run, YYYY-MM-DD. */
  at: string
  s: Partial<Record<StressId, StoredOutcome>>
  /** Findings, for the conditions that failed or errored. */
  f?: Partial<Record<StressId, string[]>>
}

export interface StressReport {
  version: number
  results: Record<string, StoredResult>
}

export const STRESS_REPORT = RAW_REPORT as unknown as StressReport

export function resultFor(level: StressLevel, id: string): StoredResult | undefined {
  return STRESS_REPORT.results[artifactKey(level, id)]
}

export type FamilyState = 'pass' | 'fail' | 'untested'

/** A family's state for one result. */
export function familyState(result: StoredResult | undefined, family: StressFamilyId): FamilyState {
  if (!result) return 'untested'
  const outcomes = stressesInFamily(family).map((stress) => result.s[stress.id])
  if (outcomes.some((o) => o === 0)) return 'fail'
  if (outcomes.some((o) => o === 1)) return 'pass'
  return 'untested'
}

export function familiesPassed(result: StoredResult | undefined): number {
  return STRESS_FAMILIES.filter((family) => familyState(result, family.id) === 'pass').length
}

export interface ReportSummary {
  /** Artifacts with a result at all. */
  measured: number
  /** Artifacts that pass every family. */
  cleanAll: number
  /** Per-family: how many artifacts pass it, out of how many measured. */
  byFamily: Array<{ family: StressFamilyId; pass: number; fail: number; untested: number }>
  /** Per-condition failure counts, worst first. */
  byStress: Array<{ stress: StressId; fail: number }>
}

export function summarize(
  results: Record<string, StoredResult> = STRESS_REPORT.results,
  filter?: (key: string) => boolean,
): ReportSummary {
  const entries = Object.entries(results).filter(([key]) => (filter ? filter(key) : true))
  const byFamily = STRESS_FAMILIES.map((family) => {
    let pass = 0
    let fail = 0
    let untested = 0
    for (const [, result] of entries) {
      const state = familyState(result, family.id)
      if (state === 'pass') pass += 1
      else if (state === 'fail') fail += 1
      else untested += 1
    }
    return { family: family.id, pass, fail, untested }
  })

  const byStress = STRESSES.map((stress) => ({
    stress: stress.id,
    fail: entries.filter(([, r]) => r.s[stress.id] === 0).length,
  })).sort((a, b) => b.fail - a.fail)

  return {
    measured: entries.length,
    cleanAll: entries.filter(([, r]) => familiesPassed(r) === STRESS_FAMILIES.length).length,
    byFamily,
    byStress,
  }
}

/** Is the report written under the definitions this code still has? */
export function reportIsCurrent(report: StressReport = STRESS_REPORT): boolean {
  return report.version === STRESS_VERSION
}
