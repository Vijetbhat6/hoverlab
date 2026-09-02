/**
 * When each artifact arrived — the catalog's sense of time.
 *
 * Nothing in the catalog records carried a date, so the site had no way to
 * say what changed. No "recently added", no "updated this week", no
 * changelog of the catalog itself — only a hand-written release timeline
 * describing the app. A catalog that never visibly changes reads as
 * abandoned, and return visitors had nothing to return for.
 *
 * The dates come from git, via `scripts/build-catalog-recency.mts`, and are
 * committed as JSON. That matters more than it looks: they are a record of
 * what actually happened rather than a field someone remembers to set, so
 * they cannot drift from the truth and cannot be inflated.
 *
 * Data-only and tiny (~40 KB of ids and ISO dates), so client components
 * can import it without dragging a catalog behind them.
 *
 * Every lookup tolerates a missing id. An artifact added between ledger
 * rebuilds has no date, and the callers here render nothing rather than
 * guessing one — an invented "added today" on a two-month-old effect is
 * exactly the kind of claim this project has been careful not to make.
 */

import LEDGER from '@/lib/generated-catalog-recency.json'
import type { ArtifactLevel } from '@/lib/artifact-types'

type Ledger = Record<string, string>

const BY_LEVEL: Record<ArtifactLevel, Ledger> = {
  effect: LEDGER.effects as Ledger,
  block: LEDGER.blocks as Ledger,
  page: LEDGER.pages as Ledger,
  template: LEDGER.templates as Ledger,
}

const UPDATED_BY_LEVEL: Record<ArtifactLevel, Ledger> = {
  effect: LEDGER.updated.effects as Ledger,
  block: LEDGER.updated.blocks as Ledger,
  page: LEDGER.updated.pages as Ledger,
  template: LEDGER.updated.templates as Ledger,
}

/** ISO date (YYYY-MM-DD) this artifact first appeared, or undefined. */
export function addedAt(level: ArtifactLevel, id: string): string | undefined {
  return BY_LEVEL[level][id]
}

/**
 * ISO date this artifact last changed, or undefined.
 *
 * Undefined has two meanings that the caller does not need to separate:
 * the artifact has never been touched since it landed, and the artifact is
 * one whose change history cannot be read precisely (the hand-written
 * effects share a file — see the ledger builder). Both cases render the
 * same way, which is: nothing. An "updated" date is a maintenance claim,
 * and a guessed one is worse than none.
 */
export function updatedAt(level: ArtifactLevel, id: string): string | undefined {
  const updated = UPDATED_BY_LEVEL[level][id]
  if (!updated) return undefined

  // A change recorded on the day it was added is not an update, it is the
  // artifact arriving over more than one commit. Showing "Added 3 Aug ·
  // Updated 3 Aug" reads as a bug, and it is not what a buyer is asking.
  const added = BY_LEVEL[level][id]
  return added && updated <= added ? undefined : updated
}

/** Ids of one rung that have changed since they landed, newest first. */
export function recentlyUpdated(level: ArtifactLevel, limit = 12): string[] {
  return Object.entries(UPDATED_BY_LEVEL[level])
    .filter(([id]) => updatedAt(level, id) !== undefined)
    .sort(([, a], [, b]) => b.localeCompare(a))
    .slice(0, limit)
    .map(([id]) => id)
}

/** The newest date anywhere in the catalog — "last updated", site-wide. */
export const CATALOG_UPDATED_AT: string = Object.values(BY_LEVEL)
  .flatMap((ledger) => Object.values(ledger))
  .reduce((newest, date) => (date > newest ? date : newest), '')

/** One day's additions to one rung. */
export interface CatalogWave {
  /** ISO date. */
  date: string
  level: ArtifactLevel
  /** Ids added that day, in catalog order. */
  ids: string[]
}

/**
 * Every batch of additions, newest first.
 *
 * Grouped by (date, level) rather than by date alone: a wave that added 256
 * effects and 45 blocks is two different pieces of news, and flattening
 * them loses which rung grew.
 */
export function catalogWaves(): CatalogWave[] {
  const grouped = new Map<string, CatalogWave>()

  for (const level of Object.keys(BY_LEVEL) as ArtifactLevel[]) {
    for (const [id, date] of Object.entries(BY_LEVEL[level])) {
      const key = `${date}:${level}`
      const wave = grouped.get(key)
      if (wave) wave.ids.push(id)
      else grouped.set(key, { date, level, ids: [id] })
    }
  }

  return [...grouped.values()].sort((a, b) =>
    a.date === b.date ? a.level.localeCompare(b.level) : b.date.localeCompare(a.date),
  )
}

/** The `limit` most recently added ids on one rung, newest first. */
export function recentlyAdded(level: ArtifactLevel, limit = 12): string[] {
  return Object.entries(BY_LEVEL[level])
    .sort(([, a], [, b]) => b.localeCompare(a))
    .slice(0, limit)
    .map(([id]) => id)
}

/**
 * Format a ledger date for display: "17 Aug 2026".
 *
 * Fixed to en-GB and UTC on purpose. These pages are statically rendered,
 * so a locale-dependent format would bake whatever the build machine
 * happened to be set to into HTML served to everyone — and a date parsed as
 * local time can land on the previous day west of UTC.
 */
export function formatAdded(date: string | undefined): string | null {
  if (!date) return null
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
