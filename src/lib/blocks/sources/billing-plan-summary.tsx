/**
 * <BillingPlanSummary> — current plan, next charge, payment method.
 *
 * The three questions a billing page exists to answer, in the order people
 * ask them: what am I on, what will I be charged and when, and what card is
 * it going to.
 *
 * The next-charge amount is stated as a figure with a date, never as "your
 * plan renews automatically". Vagueness here is what generates the "I did
 * not know I would be billed" support ticket.
 *
 * A pending cancellation is surfaced prominently, because the state where a
 * user thinks they have cancelled but has not — or has, and forgets — is
 * the most expensive misunderstanding on the page.
 *
 * Server component.
 */

import * as React from 'react'
import { CreditCard, CalendarClock, TriangleAlert, ArrowRight } from 'lucide-react'

export interface BillingPlanSummaryProps {
  planName?: string
  planPrice?: string
  planInterval?: string
  features?: string[]
  nextChargeAmount?: string
  nextChargeDate?: string
  card?: { brand: string; last4: string; expiry: string }
  /** Set when the plan is scheduled to end rather than renew. */
  cancelsOn?: string
  manageHref?: string
  className?: string
}

export function BillingPlanSummary({
  planName = 'Team',
  planPrice = '$490',
  planInterval = 'month',
  features = ['Up to 10 seats', 'SSO and audit log', 'Priority support', 'Invoice billing'],
  nextChargeAmount = '$490.00',
  nextChargeDate = '1 September 2026',
  card = { brand: 'Visa', last4: '4242', expiry: '09/28' },
  cancelsOn,
  manageHref = '#',
  className = '',
}: BillingPlanSummaryProps) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur ${className}`}
    >
      <div className="border-b border-border/60 px-6 py-4">
        <h2 className="font-semibold tracking-tight">Billing</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Your plan, your next charge and how it is paid.
        </p>
      </div>

      {cancelsOn ? (
        <p className="flex items-start gap-2 border-b border-border/60 bg-amber-500/5 px-6 py-3 text-sm text-amber-600 dark:text-amber-400">
          <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Your plan ends on <span className="font-semibold">{cancelsOn}</span>. You keep
            full access until then, and you will not be charged again.
          </span>
        </p>
      ) : null}

      <div className="grid gap-px bg-border/60 sm:grid-cols-3">
        {/* Current plan */}
        <div className="bg-card p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Current plan
          </p>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold tracking-tight">{planName}</span>
            <span className="text-sm text-muted-foreground">
              {planPrice}/{planInterval}
            </span>
          </p>

          <ul className="mt-4 space-y-1.5">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Next charge */}
        <div className="bg-card p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Next charge
          </p>

          {cancelsOn ? (
            <>
              <p className="mt-2 text-2xl font-extrabold tracking-tight">None</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cancelled — nothing further will be billed.
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-2xl font-extrabold tracking-tight">{nextChargeAmount}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarClock aria-hidden className="h-3.5 w-3.5" />
                on {nextChargeDate}
              </p>
            </>
          )}
        </div>

        {/* Payment method */}
        <div className="bg-card p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Payment method
          </p>

          <p className="mt-2 flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex h-8 w-11 items-center justify-center rounded-md border border-border/60 bg-muted"
            >
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </span>
            <span>
              <span className="block text-sm font-medium">
                {card.brand} ending {card.last4}
              </span>
              <span className="block text-xs text-muted-foreground">
                Expires {card.expiry}
              </span>
            </span>
          </p>

          <a
            href={manageHref}
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold transition-all hover:gap-2"
          >
            Manage billing
            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </section>
  )
}
