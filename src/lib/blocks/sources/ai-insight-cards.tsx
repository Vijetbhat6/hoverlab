/**
 * <AiInsightCards> — paged findings an agent surfaced on its own, each with
 * a sparkline, a magnitude and a way to disagree with it.
 *
 * Unprompted insight is the highest-risk surface in an AI product: nobody
 * asked for it, so it has to earn its place on screen every time. The design
 * rules that follow from that:
 *
 *  - Every card states the *size* of the finding, not just its direction.
 *    "Churn up" is noise; "churn up 4.7 points, worth $412k" is a decision.
 *  - Every card can be dismissed with a reason, and the reasons are the
 *    training signal. An insight feed with no "not useful" is a feed nobody
 *    trusts.
 *  - The sparkline is drawn as an inline SVG with `role="img"` and a real
 *    label, so the trend is available as a sentence to anyone who cannot see
 *    the line. A chart with no text alternative is decoration.
 *  - Paging is a `tablist`-free carousel: previous/next buttons with a
 *    `role="status"` position readout, which is simpler and more robust than
 *    tabs for a set that changes daily.
 *
 * The SVG path is computed from the data rather than hand-drawn, so a real
 * series drops in without redrawing anything.
 */

'use client'

import * as React from 'react'
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react'

export interface Insight {
  id: string
  title: string
  body: string
  /** Headline magnitude, e.g. "+4.7 pts". */
  delta: string
  direction: 'up' | 'down'
  /** True when up is bad — churn rising, latency rising. */
  inverted?: boolean
  metric: string
  series: number[]
  action?: string
}

export interface AiInsightCardsProps {
  heading?: string
  insights?: Insight[]
  className?: string
}

const DEFAULT_INSIGHTS: Insight[] = [
  {
    id: 'churn',
    title: 'Churn in the under-20-seat band is accelerating',
    body: 'Up 4.7 points over three months, against 0.3 in every other band. Concentrated in accounts that never connected a second data source.',
    delta: '+4.7 pts',
    direction: 'up',
    inverted: true,
    metric: 'Monthly churn, <20 seats',
    series: [1.4, 1.5, 1.9, 2.6, 3.4, 4.8, 6.1],
    action: 'Show the 38 highest-risk accounts',
  },
  {
    id: 'expansion',
    title: 'Second-integration accounts are expanding faster',
    body: 'Accounts that connect a second source within 30 days expand 2.4× more in year one. 61% of new accounts never do.',
    delta: '2.4×',
    direction: 'up',
    metric: 'Net expansion, 2+ sources',
    series: [100, 104, 112, 121, 134, 149, 168],
    action: 'Draft an activation nudge',
  },
  {
    id: 'latency',
    title: 'Query latency fell after the index change',
    body: 'p95 down 38% since Tuesday’s migration, with no change in error rate. Worth confirming before the next batch.',
    delta: '−38%',
    direction: 'down',
    metric: 'p95 query latency',
    series: [820, 810, 795, 640, 520, 505, 508],
    action: 'Open the latency dashboard',
  },
]

export function AiInsightCards({
  heading = 'Noticed while working',
  insights = DEFAULT_INSIGHTS,
  className = '',
}: AiInsightCardsProps) {
  const [index, setIndex] = React.useState(0)
  const [dismissed, setDismissed] = React.useState<string[]>([])

  const live = insights.filter((i) => !dismissed.includes(i.id))
  // The index can outrun a shrinking list, so it is clamped on read rather
  // than corrected in an effect — one source of truth, no flash of nothing.
  const at = Math.min(index, Math.max(live.length - 1, 0))
  const insight = live[at]

  if (!insight) {
    return (
      <div className={`mx-auto w-full max-w-xl p-6 ${className}`}>
        <p
          role="status"
          className="rounded-2xl border border-dashed border-border/60 px-5 py-10 text-center text-sm text-muted-foreground"
        >
          Nothing left to review. New findings appear as the agent works.
        </p>
      </div>
    )
  }

  // "Up" is good by default, bad when inverted — a rising churn line must
  // not be green.
  const good = insight.inverted ? insight.direction === 'down' : insight.direction === 'up'
  const tone = good ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
  const Arrow = insight.direction === 'up' ? ArrowUpRight : ArrowDownRight

  return (
    <div className={`mx-auto w-full max-w-xl p-6 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles aria-hidden className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {heading}
        </h3>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {live.length} {live.length === 1 ? 'finding' : 'findings'}
        </span>
      </div>

      <article className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            <h4 className="min-w-0 flex-1 text-sm font-semibold leading-snug">{insight.title}</h4>

            <button
              type="button"
              onClick={() => setDismissed((list) => [...list, insight.id])}
              className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden className="h-4 w-4" />
              <span className="sr-only">Dismiss: {insight.title}</span>
            </button>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{insight.body}</p>

          {/* -- Magnitude and trend ---------------------------------- */}
          <div className="mt-4 flex items-end gap-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                {insight.metric}
              </p>
              <p className={`mt-0.5 flex items-center gap-1 text-xl font-bold ${tone}`}>
                <Arrow aria-hidden className="h-4 w-4" />
                {insight.delta}
              </p>
            </div>

            <Sparkline
              values={insight.series}
              label={`${insight.metric}: ${describe(insight.series)}`}
              good={good}
            />
          </div>

          {insight.action ? (
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-border/60 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {insight.action}
              <ChevronRight aria-hidden className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {/* -- Paging ------------------------------------------------- */}
        <div className="flex items-center gap-2 border-t border-border/60 bg-muted/30 px-5 py-2.5">
          <p role="status" className="text-xs text-muted-foreground">
            {at + 1} of {live.length}
          </p>

          <div className="ml-auto flex gap-1">
            <button
              type="button"
              disabled={at === 0}
              onClick={() => setIndex(at - 1)}
              className="rounded-lg border border-border/60 p-1.5 transition-colors hover:bg-muted disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft aria-hidden className="h-3.5 w-3.5" />
              <span className="sr-only">Previous finding</span>
            </button>
            <button
              type="button"
              disabled={at >= live.length - 1}
              onClick={() => setIndex(at + 1)}
              className="rounded-lg border border-border/60 p-1.5 transition-colors hover:bg-muted disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight aria-hidden className="h-3.5 w-3.5" />
              <span className="sr-only">Next finding</span>
            </button>
          </div>
        </div>
      </article>
    </div>
  )
}

/** "rose steadily from 1.4 to 6.1" — the chart, as a sentence. */
function describe(values: number[]): string {
  const first = values[0] ?? 0
  const last = values[values.length - 1] ?? 0
  const verb = last > first ? 'rose' : last < first ? 'fell' : 'held flat'
  return `${verb} from ${first} to ${last} over ${values.length} periods`
}

/**
 * An inline sparkline.
 *
 * `role="img"` with a `<title>` and an `aria-label`, because a bare `<svg>`
 * is announced inconsistently across readers and a trend line with no text
 * alternative conveys nothing to anyone who cannot see it.
 */
function Sparkline({
  values,
  label,
  good,
}: {
  values: number[]
  label: string
  good: boolean
}) {
  const width = 96
  const height = 32

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  // Inset by the end-cap radius on both axes, so the final dot sits inside
  // the box instead of half-hanging off its right edge.
  const pad = 3

  const points = values.map((value, i) => {
    const x = pad + (i / (values.length - 1 || 1)) * (width - pad * 2)
    // SVG y grows downward, so the value is inverted into the box.
    const y = height - ((value - min) / span) * (height - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${width} ${height}`}
      className="ml-auto h-8 w-24 shrink-0 overflow-visible"
    >
      <title>{label}</title>
      <polyline
        points={points.join(' ')}
        fill="none"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={good ? 'stroke-emerald-500' : 'stroke-rose-500'}
      />
      <circle
        cx={width - pad}
        cy={points[points.length - 1]?.split(',')[1]}
        r={2.5}
        className={good ? 'fill-emerald-500' : 'fill-rose-500'}
      />
    </svg>
  )
}
