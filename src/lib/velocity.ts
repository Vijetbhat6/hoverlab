/**
 * How fast the catalog is actually growing.
 *
 * The recency ledger has known the answer since the day it shipped, and
 * every surface that read it turned the answer into something else — a
 * date on a detail page, a "new this week" strip on one hub, a changelog
 * nobody arrives on first. The one number a visitor forms an opinion from
 * in the first ten seconds — is this thing alive — was computed five times
 * a day and rendered nowhere they would see it.
 *
 * This module is that number, plus the receipts for it.
 *
 * ── WHY IT IS NOT `lib/recency` ─────────────────────────────────────────
 *
 * `generated-catalog-recency.json` is 78 KB of ids and dates. JSON imports
 * do not tree-shake, so a module that reads one field from it ships all of
 * it — fine on `/blocks`, which is a Server Component, and not fine on
 * `/`, which is the highest-traffic page on the site and a Client
 * Component. `build-catalog-recency.mts` therefore emits a second file: one
 * row per (day, rung), about 2 KB, grouped and ordered exactly the way
 * `catalogWaves()` groups and orders the full ledger so the front door and
 * `/changelog` cannot disagree about what happened when.
 *
 * ── WHY THE WINDOW IS ANCHORED TO THE BUILD, NOT TO NOW ─────────────────
 *
 * `addedSince` in `lib/recency` measures its window from `new Date()`,
 * which is correct there: its callers are Server Components rendered once,
 * at build. The same call in a Client Component runs twice — once on the
 * build machine and once in the reader's browser, possibly weeks apart —
 * and the two runs disagree about which waves fall inside seven days. That
 * is a hydration mismatch, and a nasty one, because the markup differs only
 * in a few list rows rather than visibly breaking.
 *
 * So the window ends at `LEDGER_BUILT_AT`: a committed constant, identical
 * on both sides, no clock read at render. It is also the more honest
 * anchor. The strip is reporting on the catalog's most recent week, it
 * prints the date it is reporting for, and a deploy that has been sitting
 * for a month therefore reads as a month-old report rather than as a
 * permanently busy week. Same bargain `new-this-week.tsx` makes, held to on
 * a page that cannot make it the same way.
 *
 * ── WHAT IT REFUSES TO DO ───────────────────────────────────────────────
 *
 * No averages, no "N per week", no trend arrow. Seven of the last eight
 * weeks of this catalog were one enormous wave and six quiet days; a mean
 * over that describes nothing that happened and would be the one number
 * here that is not a fact. A quiet week reports as a quiet week — see
 * `fresh` below — which is the whole reason the dates are derived from git
 * rather than typed in.
 */

import VELOCITY from '@/lib/generated-catalog-velocity.json'
import { ARTIFACT_LEVELS, type ArtifactLevel } from '@/lib/artifact-types'

/** Everything one rung gained on one day. */
export interface VelocityWave {
  /** ISO date, `YYYY-MM-DD`. */
  date: string
  level: ArtifactLevel
  count: number
}

/** Every wave the ledger knows about, newest first. */
export const CATALOG_WAVES = VELOCITY.waves as VelocityWave[]

/** The day the ledger was last rebuilt — the anchor for every window here. */
export const LEDGER_BUILT_AT: string = VELOCITY.generatedAt

/** Days in the reporting window. Seven, because the strip says "week". */
export const SHIPPING_WINDOW_DAYS = 7

/** `date` shifted by whole days, as an ISO date. UTC, like the ledger. */
function shiftDays(date: string, days: number): string {
  const at = new Date(`${date}T00:00:00Z`)
  at.setUTCDate(at.getUTCDate() + days)
  return at.toISOString().slice(0, 10)
}

/** One rung's share of a window. */
export interface LevelTotal {
  level: ArtifactLevel
  count: number
}

/** What the catalog gained over one stretch of days. */
export interface ShippingWindow {
  /**
   * False when nothing landed inside the window, in which case everything
   * below describes the most recent day that *did* ship instead. Callers
   * must say which of the two they are showing: "shipped this week" over a
   * fortnight-old wave is the exact claim this file exists not to make.
   */
  fresh: boolean
  /** Waves being reported, newest first. Never empty unless the ledger is. */
  waves: VelocityWave[]
  /** Per-rung totals in ladder order; rungs that gained nothing are absent. */
  byLevel: LevelTotal[]
  /** Artifacts across every rung. */
  total: number
  /** First and last day covered, inclusive. */
  from: string
  to: string
}

/**
 * The reporting window over an arbitrary set of waves.
 *
 * Pure and parameterised so the quiet-week branch below is reachable from a
 * test — the committed ledger is busy, so `shippingWindow()` alone can only
 * ever exercise the fresh path, and the fallback is the branch that makes
 * the claim on the landing page an honest one.
 *
 * `waves` must be newest-first, which is how the generator emits them.
 */
export function windowOf(
  waves: VelocityWave[],
  anchor: string,
  days = SHIPPING_WINDOW_DAYS,
): ShippingWindow {
  const start = shiftDays(anchor, -(days - 1))
  const inWindow = waves.filter((wave) => wave.date >= start && wave.date <= anchor)
  const fresh = inWindow.length > 0

  // The fallback is the most recent day that shipped anything — one day, not
  // seven, and `from`/`to` collapse onto it so no caller can print a
  // week-long range over a single batch.
  const newest = waves[0]?.date
  const reported = fresh
    ? inWindow
    : newest
      ? waves.filter((wave) => wave.date === newest)
      : []

  const byLevel = ARTIFACT_LEVELS.map((level) => ({
    level,
    count: reported
      .filter((wave) => wave.level === level)
      .reduce((n, wave) => n + wave.count, 0),
  })).filter((entry) => entry.count > 0)

  return {
    fresh,
    waves: reported,
    byLevel,
    total: reported.reduce((n, wave) => n + wave.count, 0),
    from: fresh ? start : (reported[0]?.date ?? anchor),
    to: fresh ? anchor : (reported[0]?.date ?? anchor),
  }
}

/**
 * What shipped in the seven days up to the ledger build, or — on a quiet
 * week — the most recent day that shipped anything.
 */
export function shippingWindow(): ShippingWindow {
  return windowOf(CATALOG_WAVES, LEDGER_BUILT_AT)
}

/** The `limit` most recent waves, newest first — the changelog in brief. */
export function recentWaves(limit: number): VelocityWave[] {
  return CATALOG_WAVES.slice(0, limit)
}
