/**
 * <StatsTimeline> — the same measurement, taken repeatedly.
 *
 * The other stats blocks are all snapshots. <StatsBand> says how big,
 * <StatsCards> says which way, <StatsComparison> says better than what — and
 * none of them can say "for six years running", which is the claim that
 * separates a company still here from a company that had a good quarter.
 * Trajectory is a different argument from magnitude, and on an about page,
 * an investor update or a Series B announcement it is the only argument
 * anyone is reading for.
 *
 * An <ol>, because the order is the content. A definition list would say
 * these are labelled values; an ordered list says the sequence matters and
 * that reading them out of order loses the point. It also means a screen
 * reader announces "3 of 6", so a listener knows where in the arc they are
 * — which is the whole reason a sighted reader can follow the rule down
 * the page.
 *
 * The rule is drawn with a border on the list and dots positioned over it,
 * rather than a segment per item. Per-item segments leave a stub hanging
 * below the final entry, and the usual fix — hiding the last one — breaks
 * the moment someone renders a single milestone.
 *
 * `note` exists so a year can carry the thing that actually happened. A
 * column of numbers with no events is a chart drawn badly; the number is
 * the evidence and the note is the claim it supports.
 */

import * as React from 'react'

export interface Milestone {
  /** Year, quarter, or any period label. Rendered as authored. */
  period: string
  value: string
  label: string
  /** What happened that year. The number alone is not a story. */
  note?: string
}

export interface StatsTimelineProps {
  eyebrow?: string
  heading?: string
  milestones?: Milestone[]
  className?: string
}

const DEFAULT_MILESTONES: Milestone[] = [
  {
    period: '2021',
    value: '12',
    label: 'customers',
    note: 'Two founders, one region, and a product that only did ticket routing.',
  },
  {
    period: '2022',
    value: '190',
    label: 'customers',
    note: 'The API shipped. Half of that year’s signups came through it.',
  },
  {
    period: '2023',
    value: '1,100',
    label: 'customers',
    note: 'First enterprise contract, and the audit tooling it forced us to build.',
  },
  {
    period: '2024',
    value: '2,400',
    label: 'customers',
    note: 'Broke even in Q3 and have not raised since.',
  },
  {
    period: '2025',
    value: '3,300',
    label: 'customers',
    note: 'Opened Frankfurt and Sydney. Data residency stopped being a blocker.',
  },
  {
    period: '2026',
    value: '4,180',
    label: 'customers',
    note: '94% of them renewed at twelve months.',
  },
]

export function StatsTimeline({
  eyebrow = 'Six years',
  heading = 'Growth is a line, not a number',
  milestones = DEFAULT_MILESTONES,
  className = '',
}: StatsTimelineProps) {
  return (
    <section
      aria-labelledby="stats-timeline-heading"
      className={`mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">{eyebrow}</p>
        <h2
          id="stats-timeline-heading"
          className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        >
          {heading}
        </h2>
      </div>

      {/* The rule is this list's left border, so it starts at the first dot
          and ends at the last one however many there are. */}
      <ol className="mt-12 space-y-10 border-s border-border/60 ps-8 sm:ps-10">
        {milestones.map((milestone) => (
          <li key={milestone.period} className="relative">
            <span
              aria-hidden
              className="absolute -left-8 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-primary ring-4 ring-background sm:-left-10"
            />

            <p className="text-sm font-medium tabular-nums text-muted-foreground">
              {milestone.period}
            </p>

            <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
              <span className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {milestone.value}
              </span>
              <span className="text-base text-muted-foreground">{milestone.label}</span>
            </p>

            {milestone.note ? (
              <p className="mt-2 max-w-prose text-pretty text-sm leading-relaxed text-muted-foreground">
                {milestone.note}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  )
}
