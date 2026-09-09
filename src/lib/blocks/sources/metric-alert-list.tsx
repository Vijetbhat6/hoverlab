'use client'

/**
 * <MetricAlertList> — Alert thresholds with their current distance from firing, so a quiet alert is visibly armed rather than possibly broken.
 *
 * An alert that has never fired and an alert that is broken look identical
 * on every dashboard: silent. The layout problem is making armed-ness
 * visible, and the obvious wrong answer is a green tick, which is exactly
 * the thing a broken alert also shows.
 *
 * Distance to the threshold is the fix. "12x under" says the rule is
 * evaluating and the metric is nowhere near it; "2% under" says look now.
 * Both are information, and a tick is neither.
 *
 * The last row is a floor rather than a ceiling — signups below twenty — and
 * it is there because a panel of four ceilings teaches the reader that
 * "under" is always good, which is wrong for exactly this kind of alert.
 * Its badge says healthy rather than a distance for that reason.
 *
 * Tone tracks proximity, not severity of the underlying metric: the queue
 * row is critical because it is 2% away, not because queue depth matters
 * more than error rate.
 *
 * Rows are buttons with `aria-pressed` since opening the chart behind a
 * threshold is the obvious action, and `status` is separate from `tone` so
 * the distance is legible without colour — on a monitoring surface,
 * colour-only severity is a genuine operational risk. The demo selects the
 * first row, the healthiest, so the panel does not open on an alarm.
 */

import * as React from 'react'

type Tone = 'neutral' | 'positive' | 'warning' | 'critical'

export interface MetricAlertListRow {
  id: string
  label: string
  detail?: string
  tone?: Tone
  /** What the badge says. Falls back to the tone name when absent. */
  status?: string
}

export interface MetricAlertListProps {
  heading?: string
  intro?: string
  rows?: MetricAlertListRow[]
  className?: string
}

/*
  Tones as complete utility classes, never assembled from fragments.
  Tailwind scans source text, so `text-${tone}-foreground` produces no
  class at all — the same failure as an undefined token, and just as
  invisible in review.
*/
const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  positive: 'bg-primary/10 text-primary',
  warning: 'bg-accent text-accent-foreground',
  critical: 'bg-destructive/10 text-destructive',
}

const ROWS: MetricAlertListRow[] = [
  { id: "row-1", label: "Error rate above 1%", detail: "Currently 0.08%. Fired twice this quarter, both real.", tone: "positive", status: "12x under" },
  { id: "row-2", label: "p95 latency above 800 ms", detail: "Currently 690 ms and climbing through the week.", tone: "warning", status: "14% under" },
  { id: "row-3", label: "Queue depth above 5,000", detail: "Currently 4,880. This is the one to look at first.", tone: "critical", status: "2% under" },
  { id: "row-4", label: "Daily signups below 20", detail: "Currently 74. A floor alert, so under is the safe side.", tone: "positive", status: "healthy" },
]

export function MetricAlertList({
  heading = "Alerts, and how close they are",
  intro = "An alert that has never fired looks identical to an alert that is broken. Showing the current distance to the threshold is what tells the two apart at a glance.",
  rows = ROWS,
  className,
}: MetricAlertListProps) {
  const [selected, setSelected] = React.useState<string | null>(rows[0]?.id ?? null)

  return (
    <section
      aria-labelledby="metric-alert-list-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="metric-alert-list-heading"
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          {heading}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{intro}</p>

        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {rows.map((row) => {
            const isSelected = row.id === selected
            return (
              <li key={row.id}>
                {/*
                  A button, not a div with onClick. The row is operable, so
                  it has to be reachable by keyboard and announce its
                  selected state — aria-pressed is what carries that.
                */}
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelected(row.id)}
                  className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                    isSelected ? 'bg-muted/40' : ''
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {row.label}
                    </span>
                    {row.detail ? (
                      <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                        {row.detail}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      TONE_CLASS[row.tone ?? 'neutral']
                    }`}
                  >
                    {row.status ?? row.tone ?? 'neutral'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
