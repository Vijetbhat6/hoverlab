'use client'

/**
 * <UsageOverageNotice> — the bill is going to be bigger, said before it is.
 *
 * <UsageMeterPanel> shows consumption against a limit. This is the state
 * after that limit is passed, and it is a different component because it
 * has a different job: not reporting a number, but preventing the support
 * ticket that starts "why was I charged $340 this month".
 *
 * The rule this is built on is that a surprise invoice is a product defect.
 * Every metered product eventually learns it, usually from a refund queue.
 *
 * WHAT MAKES IT USEFUL RATHER THAN ALARMING
 *
 *   The projection, not just the overage. "You are 40% over" is a fact
 *   about the past. "At this rate you will finish the month at 1.9M and be
 *   billed about $87 extra" is the thing a person can act on, and it is the
 *   number they would otherwise have to work out with a calculator.
 *
 *   The arithmetic is shown. Included, used, over, rate, total. A charge
 *   nobody can reproduce is a charge somebody disputes, and every one of
 *   these numbers is already on the invoice — hiding them here only delays
 *   the argument.
 *
 *   Both real exits, side by side. Upgrading is usually cheaper than paying
 *   overage, and saying so costs a little margin and buys the thing this
 *   screen exists for. A cap is the other honest answer: some people would
 *   genuinely rather the API start failing than be billed, and a product
 *   that only offers "pay more" is not offering a choice.
 *
 * DEGRADES, DOES NOT DRAMATISE
 *
 * Amber, not red, and no icon that reads as an outage. Nothing is broken —
 * the service is still running, which is precisely why it is costing money.
 * A destructive-red banner here teaches people to ignore destructive-red
 * banners.
 *
 * The projection recomputes from the day of the month rather than being a
 * fixed number, so the same component is honest on the 3rd and on the 28th,
 * when the remaining-days multiplier is the whole story.
 */

import * as React from 'react'
import { ArrowUpRight, Gauge, ShieldCheck, TrendingUp } from 'lucide-react'

export interface UsageOverageNoticeProps {
  metricLabel?: string
  /** What the plan includes, in `unit`s. */
  included?: number
  /** Consumed so far this period. */
  used?: number
  /** Day of the billing period, 1-based. */
  dayOfPeriod?: number
  periodDays?: number
  /** Cost per overage unit, in the currency below. */
  ratePerUnit?: number
  /** Overage units the rate is quoted per — 1,000 requests, 1 GB, and so on. */
  rateUnitSize?: number
  unit?: string
  currencySymbol?: string
  onUpgrade?: () => void
  onCap?: () => void
  className?: string
}

export function UsageOverageNotice({
  metricLabel = 'API requests',
  included = 1_000_000,
  used = 1_402_500,
  dayOfPeriod = 21,
  periodDays = 30,
  ratePerUnit = 0.12,
  rateUnitSize = 10_000,
  unit = 'requests',
  currencySymbol = '$',
  onUpgrade,
  onCap,
  className = '',
}: UsageOverageNoticeProps) {
  const over = Math.max(0, used - included)

  /*
    Straight-line projection from the run rate so far. Deliberately the
    simplest model that is defensible: anything cleverer (weekday
    weighting, trend fitting) produces a number the customer cannot check,
    and a projection nobody can reproduce is worth less than a rough one
    they can.
  */
  const perDay = dayOfPeriod > 0 ? used / dayOfPeriod : 0
  const projected = Math.round(perDay * periodDays)
  const projectedOver = Math.max(0, projected - included)
  const projectedCharge = (projectedOver / rateUnitSize) * ratePerUnit
  const chargeSoFar = (over / rateUnitSize) * ratePerUnit

  const pct = included > 0 ? Math.round((used / included) * 100) : 0
  const money = (value: number) =>
    `${currencySymbol}${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  const count = (value: number) => value.toLocaleString('en-US')

  return (
    <section
      aria-labelledby="overage-heading"
      className={`mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      {/* Amber, not red. Nothing is broken. */}
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-6 sm:p-7">
        <div className="flex items-start gap-3">
          <Gauge aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
          <div className="min-w-0">
            {/* The label is used as written. Lower-casing it to fit the
                sentence turns "API requests" into "api requests", and every
                metric worth metering is an acronym sooner or later. */}
            <h2 id="overage-heading" className="text-base font-semibold text-foreground">
              You are past your included {metricLabel}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything is still running. You are being billed for the
              overage, and this is what it looks like so far.
            </p>
          </div>
        </div>

        {/* The bar goes past 100% and shows it, rather than pinning full and
            hiding the size of the problem. */}
        <div className="mt-5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">
              {count(used)} of {count(included)} {unit}
            </span>
            <span className="font-mono font-medium text-foreground">{pct}%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="flex h-full">
              <div
                className="h-full bg-primary"
                style={{ width: `${(included / Math.max(used, included)) * 100}%` }}
              />
              <div
                className="h-full bg-amber-500"
                style={{ width: `${(over / Math.max(used, included)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Every number on the invoice, reproducible. */}
        <dl className="mt-5 divide-y divide-border/60 rounded-xl border border-border bg-card px-4">
          <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
            <dt className="text-muted-foreground">Over your allowance</dt>
            <dd className="font-mono text-foreground">
              {count(over)} {unit}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
            <dt className="text-muted-foreground">Overage rate</dt>
            <dd className="font-mono text-foreground">
              {money(ratePerUnit)} per {count(rateUnitSize)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
            <dt className="text-muted-foreground">Charged so far</dt>
            <dd className="font-mono font-medium text-foreground">{money(chargeSoFar)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp aria-hidden className="h-3.5 w-3.5" />
              At this rate, by day {periodDays}
            </dt>
            <dd className="text-end">
              <span className="block font-mono font-semibold text-foreground">
                {money(projectedCharge)}
              </span>
              <span className="block font-mono text-xs text-muted-foreground">
                {count(projected)} {unit}
              </span>
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-xs text-muted-foreground">
          Projected from {count(Math.round(perDay))} {unit} a day over {dayOfPeriod}{' '}
          {dayOfPeriod === 1 ? 'day' : 'days'} so far. It is a straight line, not a
          forecast — a quiet week moves it.
        </p>

        {/* Two real exits. The cheaper one is not buried. */}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onUpgrade}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowUpRight aria-hidden className="h-4 w-4" />
            Move to a plan that includes this
          </button>
          <button
            type="button"
            onClick={onCap}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ShieldCheck aria-hidden className="h-4 w-4" />
            Cap usage instead
          </button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Upgrading is usually cheaper than paying overage at this volume.
          Capping stops the charges and starts returning 429s — some teams
          genuinely prefer that, and it is a real option rather than a threat.
        </p>
      </div>
    </section>
  )
}
