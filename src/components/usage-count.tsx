'use client'

/**
 * "412 copies this week" — the one navigation aid a catalog this size has.
 *
 * In a grid of 1,047 effects or 250 blocks, category and curation only get
 * a visitor to a shelf; what separates the items on that shelf is what
 * other people took. The counters have existed server-side since
 * `lib/usage.ts` shipped and nothing rendered them, so the signal was
 * collected and then thrown away.
 *
 * ── WHY IT CAN RENDER NOTHING ───────────────────────────────────────────
 *
 * An uncounted artifact renders no element at all, not a zero and not a
 * placeholder. Three reasons, in order of how much they matter:
 *
 *  1. "0 copies" is a claim about the artifact. "No number yet" is a fact
 *     about the counter, which started counting in August and covers a
 *     seven-day window. Printing the first as if it meant the second would
 *     libel every good effect nobody happened to copy last week.
 *  2. The map is the top slice (see `usageSnapshot`), so absence genuinely
 *     does not distinguish "unused" from "below the cut".
 *  3. On a fresh deployment nothing is counted, and a grid of 250 zeroes is
 *     worse than a grid of none.
 *
 * That is also why there is no skeleton: the number arrives after the HTML,
 * and reserving space for something that may never come would put a hole in
 * every card in the catalog.
 *
 * ── WHY "COPIES" AND NOT "INSTALLS" ─────────────────────────────────────
 *
 * The counter records copies and installs together and this says copies,
 * because copying is what nearly all of it is — the CLI is real but young.
 * "Installs" would be the flattering word and the wrong one.
 */

import * as React from 'react'
import { Copy } from 'lucide-react'

import { useUsageCount } from '@/hooks/use-usage-counts'
import { cn } from '@/lib/utils'

export function UsageCount({
  id,
  className,
  withIcon = true,
}: {
  id: string
  className?: string
  /** Off in rows that already carry icons on every other item. */
  withIcon?: boolean
}) {
  const count = useUsageCount(id)
  if (count === null) return null

  return (
    <span className={cn('inline-flex items-center gap-1 tabular-nums', className)}>
      {withIcon ? <Copy aria-hidden className="h-3.5 w-3.5" /> : null}
      {/*
        The number and its unit are one phrase to a screen reader. Split
        across two elements with the unit abbreviated, it would be read as
        a bare integer next to the line count and the dependency count,
        which are also bare integers.
      */}
      {count.toLocaleString('en-US')}
      <span className="sr-only"> copies in the last seven days</span>
      <span aria-hidden>{count === 1 ? 'copy' : 'copies'} this week</span>
    </span>
  )
}
