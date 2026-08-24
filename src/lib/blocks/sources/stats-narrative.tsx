/**
 * <StatsNarrative> — numbers with the argument they belong to.
 *
 * <StatsBand> and <StatsCards> are both strips: four figures across a page,
 * no prose, dropped between two other sections. That works when the numbers
 * are self-evident — "4,000 customers", "99.99% uptime" — and fails the
 * moment they are not. "31% lower cost per ticket" is meaningless without
 * knowing lower than what, measured over how long, across how many teams,
 * and a strip has nowhere to say any of it.
 *
 * This block gives the numbers a paragraph. The copy makes the claim and the
 * figures stand as its evidence, which is the arrangement an investor
 * update, an about page or a results section actually needs. The stats sit
 * in a card beside the prose rather than under it, so on a wide screen the
 * claim and its proof are read together instead of one scrolling past the
 * other.
 *
 * Every stat carries an optional `source`. A number on a vendor's own site
 * with no attribution is a number the vendor made up, and the difference
 * between "31% lower" and "31% lower — 2026 customer survey, n=412" is the
 * difference between marketing and evidence. It is optional because some
 * figures are internal telemetry and saying so is better than inventing a
 * citation, but the field being there is a prompt to fill it in.
 *
 * A <dl> for the figures, and the value comes before the label in the DOM as
 * well as visually — a <dt> read as "31%" followed by "lower cost per
 * ticket" is the order the eye takes them in, and reversing it for the sake
 * of a tidier stylesheet makes the section worse to listen to.
 */

import * as React from 'react'
import { ArrowRight } from 'lucide-react'

export interface NarrativeStat {
  value: string
  label: string
  /** Where the figure comes from. Absent is better than invented. */
  source?: string
}

export interface StatsNarrativeProps {
  eyebrow?: string
  heading?: string
  body?: string
  stats?: NarrativeStat[]
  ctaLabel?: string
  ctaHref?: string
  className?: string
}

const DEFAULT_STATS: NarrativeStat[] = [
  {
    value: '31%',
    label: 'lower cost per resolved ticket',
    source: 'Median across 412 accounts, 12 months',
  },
  {
    value: '11 min',
    label: 'median first response, from 3.2 hrs',
    source: 'Platform telemetry, Q2 2026',
  },
  {
    value: '4 weeks',
    label: 'median pilot to full rollout',
    source: 'Onboarding records, 2025–26',
  },
  {
    value: '94%',
    label: 'of accounts renew at twelve months',
    source: 'Billing, cohort of 2,180',
  },
]

export function StatsNarrative({
  eyebrow = 'Results',
  heading = 'The case for switching, in four numbers we will show our working on',
  body = 'None of these are from a launch week. They are medians across every account that has been on the platform for a full year, including the ones that churned — which is why the figures are lower than the ones on our competitors’ pages and why we are willing to name the sample size.',
  stats = DEFAULT_STATS,
  ctaLabel = 'Read the methodology',
  ctaHref,
  className = '',
}: StatsNarrativeProps) {
  return (
    <section
      aria-labelledby="stats-narrative-heading"
      className={`mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="max-w-xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">{eyebrow}</p>
          <h2
            id="stats-narrative-heading"
            className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {heading}
          </h2>
          <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">{body}</p>

          {ctaHref ? (
            <a
              href={ctaHref}
              className="group mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {ctaLabel}
              <ArrowRight
                aria-hidden
                className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5"
              />
            </a>
          ) : null}
        </div>

        {/* The container paints the ground the 1px gaps expose; each cell
            paints its own background over it, so neighbours share a divider
            instead of each drawing one. */}
        <dl className="grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 sm:grid-cols-2">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card p-6 sm:p-8">
              <dt className="text-4xl font-bold tracking-tight text-primary">{stat.value}</dt>
              <dd className="mt-2 text-sm font-medium leading-snug text-foreground">
                {stat.label}
              </dd>
              {stat.source ? (
                <dd className="mt-3 text-xs leading-snug text-muted-foreground">{stat.source}</dd>
              ) : null}
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
