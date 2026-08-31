/**
 * <BillingCreditBalance> — a credit balance that says when it expires.
 *
 * Every product that sells consumable credits eventually sells them from
 * two buckets: an allowance that comes with the plan and resets, and packs
 * that were bought and do not. The catalog's usage meter shows a bar
 * against a limit, which is the wrong shape for this — a bar cannot express
 * "2,000 of these disappear on 1 September and the other 500 do not".
 *
 * SPEND ORDER IS THE FACT PEOPLE ASK FOR
 *
 * If purchased credits are consumed before the monthly allowance, the
 * customer loses the allowance at reset and paid for nothing. The order is
 * therefore a stated policy on the component, not an implementation detail,
 * and it is rendered in the order it is spent — top to bottom — so the list
 * itself carries the answer.
 *
 * THE EXPIRY WARNING IS PROPORTIONAL
 *
 * A balance expiring in three days with most of it unspent gets a sentence;
 * one expiring in three weeks does not. A permanent banner reading "credits
 * expire" is ignored within a week, which makes it worse than nothing on
 * the day it matters.
 *
 * A SERVER COMPONENT — a balance is a reading, not a form.
 *
 * ACCESSIBILITY: the meters are `role="meter"` with real `aria-valuenow`
 * and `aria-valuetext` giving the number in words, so the bar is not the
 * only way to know the value. Expiry dates are `<time datetime>`.
 */

import * as React from 'react'
import { Clock, Coins, Info, Plus } from 'lucide-react'

export interface CreditBucket {
  id: string
  label: string
  /** What the bucket is and where it came from. */
  note: string
  remaining: number
  total: number
  /** ISO date it expires, or null when it never does. */
  expiresAt: string | null
}

export interface BillingCreditBalanceProps {
  buckets?: CreditBucket[]
  /** Anchor for "days until expiry". Fixed so screenshots are stable. */
  today?: Date
  /** Days before expiry at which the warning appears. */
  warnWithinDays?: number
  className?: string
}

const DEFAULT_BUCKETS: CreditBucket[] = [
  {
    id: 'allowance',
    label: 'Monthly allowance',
    note: 'Included with Pro+. Resets on the 1st and does not roll over.',
    remaining: 320,
    total: 500,
    expiresAt: '2026-09-01',
  },
  {
    id: 'pack-1',
    label: 'Credit pack — 2,000',
    note: 'Purchased 12 August 2026.',
    remaining: 1_640,
    total: 2_000,
    expiresAt: null,
  },
  {
    id: 'promo',
    label: 'Launch bonus',
    note: 'Granted with your first purchase.',
    remaining: 150,
    total: 250,
    expiresAt: '2026-09-03',
  },
]

function daysUntil(iso: string, today: Date): number {
  const target = new Date(`${iso}T00:00:00Z`)
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000)
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function BillingCreditBalance({
  buckets = DEFAULT_BUCKETS,
  today = new Date(Date.UTC(2026, 7, 31)),
  warnWithinDays = 7,
  className = '',
}: BillingCreditBalanceProps) {
  const total = buckets.reduce((sum, bucket) => sum + bucket.remaining, 0)

  /*
   * Only the buckets that are both expiring soon and worth warning about.
   * A bucket with four credits left does not deserve a sentence, however
   * soon it expires.
   */
  const expiring = buckets.filter(
    (bucket) =>
      bucket.expiresAt !== null &&
      daysUntil(bucket.expiresAt, today) <= warnWithinDays &&
      bucket.remaining > bucket.total * 0.1,
  )

  return (
    <section
      className={`rounded-2xl border border-border bg-card text-card-foreground ${className}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5 sm:p-6">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Coins aria-hidden className="h-4 w-4 text-muted-foreground" />
            Credit balance
          </h2>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {total.toLocaleString('en-US')}
            <span className="ml-1.5 text-sm font-normal text-muted-foreground">
              credits available
            </span>
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus aria-hidden className="h-4 w-4" />
          Buy credits
        </button>
      </header>

      {/*
        Proportional, not permanent — see the header. Rendered above the
        buckets because it is the only thing on this card that is time
        sensitive.
      */}
      {expiring.length > 0 ? (
        <p className="flex items-start gap-2 border-b border-border bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300 sm:px-6">
          <Clock aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {expiring
              .map(
                (bucket) =>
                  `${bucket.remaining.toLocaleString('en-US')} credits from ${bucket.label.toLowerCase()} expire in ${daysUntil(bucket.expiresAt as string, today)} days`,
              )
              .join('; ')}
            . They are spent last, so use them before buying more.
          </span>
        </p>
      ) : null}

      {/* Rendered in spend order — the list is the answer to "which first". */}
      <ol className="divide-y divide-border">
        {buckets.map((bucket, index) => {
          const percent = Math.round((bucket.remaining / bucket.total) * 100)
          return (
            <li key={bucket.id} className="p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold">
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                  {bucket.label}
                </h3>
                <p className="text-sm tabular-nums">
                  <span className="font-semibold">{bucket.remaining.toLocaleString('en-US')}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    / {bucket.total.toLocaleString('en-US')}
                  </span>
                </p>
              </div>

              <div
                role="meter"
                aria-valuenow={bucket.remaining}
                aria-valuemin={0}
                aria-valuemax={bucket.total}
                aria-valuetext={`${bucket.remaining.toLocaleString('en-US')} of ${bucket.total.toLocaleString('en-US')} credits remaining`}
                aria-label={bucket.label}
                className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                {bucket.note}{' '}
                {bucket.expiresAt ? (
                  <>
                    Expires <time dateTime={bucket.expiresAt}>{formatDate(bucket.expiresAt)}</time>.
                  </>
                ) : (
                  'Never expires.'
                )}
              </p>
            </li>
          )
        })}
      </ol>

      <p className="flex items-start gap-2 border-t border-border p-5 text-xs text-muted-foreground sm:px-6">
        <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Credits are spent from the top of this list down, so the allowance included
        with your plan is used before anything you paid for.
      </p>
    </section>
  )
}
