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
import { Copy, Eye, Heart } from 'lucide-react'

import { useUsageCount, useUsageEntry } from '@/hooks/use-usage-counts'
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

/**
 * Views and saves, as one quiet pair beside the copy count.
 *
 * ── WHY THESE TWO ARE ONE COMPONENT AND THE COPY COUNT IS NOT ───────────
 *
 * The copy count is a claim about this week and reads as a sentence
 * ("412 copies this week"). Views and saves are running totals and read as
 * a tally — a number and a glyph, the shape every catalog on the internet
 * puts in this position. Rendering them through `<UsageCount>` would have
 * meant a prop that switched between two different typographic ideas.
 *
 * ── WHY VIEWS ARE SHOWN AT ALL, GIVEN THEY DO NOT RANK ──────────────────
 *
 * `lib/usage.ts` refuses to sort by views, and that has not changed: a
 * ranking built on traffic promotes whatever already ranks. But a number
 * on a tile is not a ranking. It answers "has anyone been here", which is
 * the question a visitor has in front of a grid of 290 blocks, and it is
 * the one signal that exists for an artifact nobody has copied yet. Shown,
 * not sorted, is the whole position.
 *
 * Each half is independently absent. A block with 2,000 views and no saves
 * renders the views alone — the alternative is "0 saves", which is a
 * verdict rather than a measurement, for all the reasons above.
 */
export function CardStats({ id, className }: { id: string; className?: string }) {
  const entry = useUsageEntry(id)
  if (!entry) return null

  const views = entry.views > 0 ? entry.views : null
  const saves = entry.saves > 0 ? entry.saves : null
  if (views === null && saves === null) return null

  return (
    <>
      {views !== null ? (
        <span className={cn('inline-flex items-center gap-1 tabular-nums', className)}>
          <Eye aria-hidden className="h-3.5 w-3.5" />
          {compact(views)}
          <span className="sr-only"> {views === 1 ? 'view' : 'views'}</span>
        </span>
      ) : null}

      {saves !== null ? (
        <span className={cn('inline-flex items-center gap-1 tabular-nums', className)}>
          <Heart aria-hidden className="h-3.5 w-3.5" />
          {compact(saves)}
          <span className="sr-only"> {saves === 1 ? 'save' : 'saves'}</span>
        </span>
      ) : null}
    </>
  )
}

/**
 * 1,240 → "1.2k".
 *
 * These sit in a metadata row that already wraps, next to "9 blocks" and
 * "214 lines", and a five-digit view count would be the widest thing on the
 * card by some margin. Nobody reading a tile needs the last two digits of a
 * view count; they need to know whether it is hundreds or thousands.
 *
 * Under a thousand the number is printed in full, because at that size the
 * exact figure is both short and meaningful. The screen-reader text beside
 * it says the unit either way, so "1.2k" is never read as a bare token.
 */
function compact(n: number): string {
  if (n < 1000) return n.toLocaleString('en-US')
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
}
