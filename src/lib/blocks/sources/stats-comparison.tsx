/**
 * <StatsComparison> — the same measurements, before and after.
 *
 * <StatsCards> shows a figure and a delta, which answers "is this getting
 * better". It cannot answer "better than what we were doing instead",
 * because a delta compares a metric to its own past and a buyer is
 * comparing it to their present. Someone reading a results section already
 * has a status quo — a spreadsheet, an incumbent, four people doing it by
 * hand — and the number they need is the one next to theirs.
 *
 * So this is a real two-column comparison, and the left column is deliberately
 * unflattering: it is the reader's current situation described in their own
 * terms. A comparison where the "before" is a strawman is one the reader
 * spots immediately and stops trusting, so `before` values should be
 * defensible enough to survive being quoted back.
 *
 * A <table>, not a <dl>. There are two dimensions here — metric by scenario
 * — and that is precisely what a table is for. Every other stats block in
 * this catalog is a definition list because it has one dimension; using a
 * table there would be as wrong as using a <dl> here. The column headers are
 * real <th scope="col">, so a screen reader reading a cell says which
 * scenario it belongs to rather than reading twelve loose numbers.
 *
 * The improvement column is derived from nothing — it is authored per row.
 * Computing "58% faster" from two strings would mean parsing "3.2 hrs" and
 * "11 min", getting units wrong somewhere, and shipping a rounding bug into
 * a section whose entire job is being believable.
 *
 * Direction is never carried by colour alone: each improvement pairs its
 * tint with an arrow and a `sr-only` word, matching <StatsCards>.
 */

import * as React from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'

export interface ComparisonRow {
  metric: string
  before: string
  after: string
  /** Authored, not computed. See the note above. */
  improvement?: string
  /** Which way is good. 'up' for throughput, 'down' for latency and cost. */
  direction?: 'up' | 'down'
}

export interface StatsComparisonProps {
  eyebrow?: string
  heading?: string
  beforeLabel?: string
  afterLabel?: string
  rows?: ComparisonRow[]
  footnote?: string
  className?: string
}

const DEFAULT_ROWS: ComparisonRow[] = [
  {
    metric: 'Median first response',
    before: '3.2 hrs',
    after: '11 min',
    improvement: '94% faster',
    direction: 'down',
  },
  {
    metric: 'Tickets escalated to engineering',
    before: '1 in 6',
    after: '1 in 12',
    improvement: '48% fewer',
    direction: 'down',
  },
  {
    metric: 'Resolved without a second reply',
    before: '41%',
    after: '73%',
    improvement: '+32 pts',
    direction: 'up',
  },
  {
    metric: 'Cost per resolved ticket',
    before: '$4.90',
    after: '$3.38',
    improvement: '31% lower',
    direction: 'down',
  },
  {
    metric: 'Hours a week spent on triage',
    before: '22',
    after: '6',
    improvement: '16 hrs back',
    direction: 'down',
  },
]

export function StatsComparison({
  eyebrow = 'Before and after',
  heading = 'Measured against what you are doing now, not against last quarter',
  beforeLabel = 'Shared inbox and a rota',
  afterLabel = 'On the platform',
  rows = DEFAULT_ROWS,
  footnote = 'Medians across 412 accounts over twelve months. “Before” figures are the ones those teams reported at the start of their pilot.',
  className = '',
}: StatsComparisonProps) {
  return (
    <section
      aria-labelledby="stats-comparison-heading"
      className={`mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">{eyebrow}</p>
        <h2
          id="stats-comparison-heading"
          className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        >
          {heading}
        </h2>
      </div>

      {/* Scrolls rather than compressing: five columns of numbers squeezed
          into 320px is unreadable, and a horizontal scroll on a table is a
          pattern phone users already understand. */}
      <div className="mt-12 overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left">
          <caption className="sr-only">
            Support metrics {beforeLabel} compared with {afterLabel}
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-4 pr-6 text-sm font-semibold text-foreground">
                Metric
              </th>
              <th scope="col" className="px-6 py-4 text-sm font-medium text-muted-foreground">
                {beforeLabel}
              </th>
              <th scope="col" className="px-6 py-4 text-sm font-semibold text-foreground">
                {afterLabel}
              </th>
              <th scope="col" className="py-4 pl-6 text-right text-sm font-medium text-muted-foreground">
                Change
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((row) => (
              <tr key={row.metric}>
                <th
                  scope="row"
                  className="py-5 pr-6 text-sm font-medium leading-snug text-foreground"
                >
                  {row.metric}
                </th>
                <td className="px-6 py-5 text-lg tabular-nums text-muted-foreground line-through decoration-muted-foreground/40">
                  {row.before}
                </td>
                <td className="px-6 py-5 text-lg font-bold tabular-nums text-foreground">
                  {row.after}
                </td>
                <td className="py-5 pl-6 text-right">
                  {row.improvement ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {row.direction === 'up' ? (
                        <ArrowUp aria-hidden className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown aria-hidden className="h-3.5 w-3.5" />
                      )}
                      <span className="sr-only">Improved: </span>
                      {row.improvement}
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {footnote ? (
        <p className="mt-8 text-pretty text-center text-xs leading-relaxed text-muted-foreground">
          {footnote}
        </p>
      ) : null}
    </section>
  )
}
