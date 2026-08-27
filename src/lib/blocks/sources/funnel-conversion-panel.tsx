/**
 * <FunnelConversionPanel> — the step chart, with the number that matters.
 *
 * Charts & Metrics had sparklines, a bar chart, usage meters, a line
 * chart, a donut and a heatmap: six ways to show a quantity over time or
 * across a category. A funnel is neither. It is the only chart in a
 * product analytics screen that answers "where do people stop", and it
 * was missing.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * Almost every funnel widget labels each bar with its share of the *top*
 * of the funnel — 100%, 61%, 44%, 41% — which is the number that makes a
 * slide look tidy and the number nobody can act on. What decides where
 * the next week of work goes is the step-to-step rate and the absolute
 * count that fell out of it: "1,102 people got to checkout and 88 of them
 * did not finish" is a task. Both are shown, with the step-to-step rate
 * given the larger type, and the drop stated as people rather than as a
 * percentage of a percentage.
 *
 * THE WORST STEP IS NAMED
 *
 * A funnel where every bar looks similar hides its own point. The largest
 * relative drop is marked, once, in words — not by colouring one bar red
 * and hoping the eye lands there.
 *
 * IT SAYS WHAT KIND OF FUNNEL IT IS
 *
 * A funnel over "everyone who did each step in the window" and a funnel
 * over "one cohort followed through in order" produce different numbers
 * from the same data, and the difference routinely gets lost between the
 * query and the dashboard. The footnote states which one this is, because
 * a reader cannot tell by looking and will assume the flattering one.
 *
 * NO CANVAS, NO CHART LIBRARY: the bars are divs with a width, so the
 * whole thing prints, survives text zoom, and adds nothing to the bundle.
 *
 * ACCESSIBILITY: an ordered list, because a funnel is a sequence; each
 * step's numbers are real text rather than a title attribute, so the
 * chart is fully readable without ever resolving the visual widths. No
 * `'use client'` — nothing here has state.
 */

import { TrendingDown } from 'lucide-react'

export interface FunnelStep {
  label: string
  /** People who reached this step. */
  count: number
  /** Optional note about the step itself, not its number. */
  note?: string
}

export interface FunnelConversionPanelProps {
  title?: string
  window?: string
  steps?: FunnelStep[]
  className?: string
}

const DEFAULT_STEPS: FunnelStep[] = [
  { label: 'Visited pricing', count: 18420 },
  { label: 'Started signup', count: 6215 },
  { label: 'Verified email', count: 4988, note: 'Link expires after 24 hours' },
  { label: 'Reached checkout', count: 1102 },
  { label: 'Paid', count: 1014 },
]

/** `0.61` → `"61.0%"`. Fixed to one place: funnels invite false precision. */
function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function FunnelConversionPanel({
  title = 'Signup funnel',
  window: period = 'Last 30 days',
  steps = DEFAULT_STEPS,
  className = '',
}: FunnelConversionPanelProps) {
  const top = steps[0]?.count ?? 0
  if (top <= 0) return null

  /* Both rates, computed once. `fromPrevious` is the actionable one. */
  const rows = steps.map((step, index) => {
    const previous = index === 0 ? step.count : steps[index - 1]!.count
    return {
      ...step,
      index,
      fromTop: step.count / top,
      fromPrevious: previous === 0 ? 0 : step.count / previous,
      dropped: previous - step.count,
    }
  })

  /* The single worst step-to-step rate, ignoring the first (which has no
     previous step and is always 100%). */
  const worst = rows
    .slice(1)
    .reduce((lowest, row) => (row.fromPrevious < lowest.fromPrevious ? row : lowest), rows[1]!)

  return (
    <section className={`mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 ${className}`}>
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{period}</p>
          <p className="ml-auto text-xs text-muted-foreground">
            End to end{' '}
            <strong className="font-semibold tabular-nums text-foreground">
              {pct((steps[steps.length - 1]?.count ?? 0) / top)}
            </strong>
          </p>
        </header>

        {/* Ordered, because the sequence is the meaning. */}
        <ol className="mt-5 space-y-4">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-medium text-foreground">{row.label}</span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {row.count.toLocaleString('en-US')}
                </span>
                {row.index > 0 ? (
                  <span className="ml-auto text-sm font-semibold tabular-nums text-foreground">
                    {pct(row.fromPrevious)}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      from previous step
                    </span>
                  </span>
                ) : (
                  <span className="ml-auto text-xs text-muted-foreground">
                    Top of the funnel
                  </span>
                )}
              </div>

              {/*
                Two widths on one track: the pale bar is the share of the
                top, the solid bar is this step. The track is decorative —
                every number it encodes is in the text above it.
              */}
              <div
                aria-hidden
                className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${Math.max(row.fromTop * 100, 1)}%` }}
                />
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {row.index === 0 ? (
                  <>{pct(1)} of the funnel</>
                ) : (
                  <>
                    {/* People, not a percentage of a percentage. */}
                    <strong className="font-medium text-foreground tabular-nums">
                      {row.dropped.toLocaleString('en-US')}
                    </strong>{' '}
                    did not continue · {pct(row.fromTop)} of everyone who started
                  </>
                )}
                {row.note ? <> · {row.note}</> : null}
              </p>

              {/* Named once, in words. */}
              {row.index === worst.index ? (
                <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-400">
                  <TrendingDown aria-hidden className="h-3 w-3" />
                  Biggest drop in the funnel — {pct(1 - worst.fromPrevious)} of the
                  previous step stops here
                </p>
              ) : null}
            </li>
          ))}
        </ol>

        {/*
          Which funnel this is. A reader cannot tell by looking, and will
          assume whichever definition flatters the number.
        */}
        <p className="mt-5 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
          Counted as a cohort: every person here entered at the first step inside the
          window and is followed through in order. Someone who signed up last month
          and paid this month is not in these numbers, so this reads lower than a
          per-step total over the same period — and it is the one that answers
          &ldquo;what happens to the people we get&rdquo;.
        </p>
      </div>
    </section>
  )
}
