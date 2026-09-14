/**
 * "Updated 3 Sep" on a catalog tile.
 *
 * ── WHY THIS NEEDS NO CLIENT AND NO FETCH ───────────────────────────────
 *
 * The other two numbers on a card arrive from Firestore after the HTML,
 * because a copy count changes by the minute and the grids are prerendered.
 * A date does not: `lib/recency.ts` is a committed JSON ledger built from
 * git history, so the date an artifact last changed is known at build time
 * and belongs in the HTML. That makes this a plain component with no
 * boundary, no request, and no flash — and it is readable by a crawler,
 * which the counters are not.
 *
 * ── WHY IT IS SO OFTEN ABSENT ───────────────────────────────────────────
 *
 * `updatedAt()` returns nothing for an artifact that has not changed since
 * it landed, and nothing for one whose history cannot be read precisely
 * (the hand-written effects share a file). Both render as no element at
 * all. An "updated" date is a maintenance claim about a specific artifact,
 * and the two available ways to fill the gap — showing the date it was
 * added, or showing the date the catalog as a whole last moved — would both
 * be claims nothing backs. A tile that says nothing about maintenance is
 * honest; a tile that says the wrong thing is not.
 *
 * ── WHY `<time>` ────────────────────────────────────────────────────────
 *
 * The visible text is a short human date without a year, which is the right
 * length for a metadata row and ambiguous on its own once the catalog is
 * more than a year old. The machine-readable `dateTime` carries the full
 * ISO date, so the unambiguous version is always there for anything reading
 * the page rather than looking at it.
 */

import * as React from 'react'
import { History } from 'lucide-react'

import type { ArtifactLevel } from '@/lib/artifact-types'
import { CATALOG_UPDATED_AT, updatedAt } from '@/lib/recency'
import { cn } from '@/lib/utils'

/**
 * "3 Sep", or "3 Sep 2025" once the date is older than the catalog's own
 * current year.
 *
 * The year is dropped against `CATALOG_UPDATED_AT` rather than against
 * today. Both would read the same most of the time, and only one of them
 * is a constant: `new Date()` evaluated inside a card gives the build
 * machine's clock on the server and the reader's on the client, so a grid
 * rendered in December and read in January would hydrate into a mismatch
 * on every tile. The newest date in the ledger is baked into the bundle
 * and is identical on both sides, which is the property this needs.
 */
function formatShort(date: string): string | null {
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return null

  const currentYear = CATALOG_UPDATED_AT.slice(0, 4)
  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(date.slice(0, 4) === currentYear ? {} : { year: 'numeric' }),
    timeZone: 'UTC',
  })
}

export function ArtifactUpdated({
  level,
  id,
  className,
}: {
  level: ArtifactLevel
  id: string
  className?: string
}) {
  const date = updatedAt(level, id)
  if (!date) return null

  const label = formatShort(date)
  if (!label) return null

  return (
    <time
      dateTime={date}
      className={cn('inline-flex items-center gap-1 tabular-nums', className)}
    >
      <History aria-hidden className="h-3.5 w-3.5" />
      <span className="sr-only">Last updated </span>
      <span aria-hidden>Updated </span>
      {label}
    </time>
  )
}
