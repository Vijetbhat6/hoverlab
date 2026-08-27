'use client'

/**
 * <BillingSeatManager> — changing the seat count, with the bill first.
 *
 * Billing & Usage had the plan summary, invoice history, payment methods,
 * the cancel flow and the overage notice. Four of those describe money
 * that has already been decided. The one moment a customer *changes* what
 * they owe — adding or removing seats — had no surface, and it is the one
 * where a surprise costs the most trust.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * The prorated amount is computed and shown *before* the button is
 * pressed, broken into the two numbers it is made of: the part-period
 * charge for the days remaining, and the new recurring amount from the
 * next renewal. Almost every seat picker shows one blended figure, or
 * nothing at all until the receipt arrives — and a customer who expected
 * £120 and was charged £47.35 assumes an error rather than proration.
 *
 * REMOVING A SEAT IS NOT A REFUND, AND SAYS SO
 *
 * The asymmetry is the single most misunderstood thing in per-seat
 * billing. Adding charges immediately; removing takes effect at renewal
 * and returns nothing now. Almost every product buries this in a help
 * article. It is stated here, at the moment the number goes down, because
 * that is when it is worth knowing.
 *
 * YOU CANNOT GO BELOW THE PEOPLE YOU HAVE
 *
 * The minimum is the number of occupied seats, and the control says whose
 * they are rather than just refusing to decrement. A stepper that stops
 * with no explanation reads as broken.
 *
 * ACCESSIBILITY: the stepper is two buttons around a real number input,
 * so it is typeable and not only clickable; the cost preview is
 * `aria-live="polite"` because it changes as a result of pressing a
 * control somewhere else; every currency figure is text.
 */

import * as React from 'react'
import { AlertCircle, Minus, Plus, Users } from 'lucide-react'

export interface BillingSeatManagerProps {
  /** Seats currently paid for. */
  purchased?: number
  /** Seats with a person in them — the floor for any decrease. */
  occupied?: number
  /** Price per seat per period, in the smallest currency unit. */
  pricePerSeat?: number
  currency?: string
  /** Days left in the current billing period, for the proration maths. */
  daysRemaining?: number
  periodDays?: number
  renewsOn?: string
  className?: string
}

/** Pence/cents → "£12.00". Formatting money by hand is how rounding drifts. */
function money(minorUnits: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(minorUnits / 100)
}

export function BillingSeatManager({
  purchased = 12,
  occupied = 9,
  pricePerSeat = 1200,
  currency = 'GBP',
  daysRemaining = 18,
  periodDays = 30,
  renewsOn = '14 September',
  className = '',
}: BillingSeatManagerProps) {
  /*
   * Opens two seats above what is paid for.
   *
   * At parity the card says "nothing has changed", which is true and
   * useless: the proration breakdown is the component, and it does not
   * exist until the number moves. Press Cancel to see the resting state.
   */
  const [seats, setSeats] = React.useState(purchased + 2)

  const delta = seats - purchased
  const adding = delta > 0
  const removing = delta < 0

  /*
    Proration, in the open. A part-period charge is the per-seat price
    scaled by the fraction of the period left — which is exactly the
    number a customer cannot reconstruct from a receipt, and exactly the
    one they try to.
  */
  const fraction = periodDays === 0 ? 0 : daysRemaining / periodDays
  const dueNow = adding ? Math.round(delta * pricePerSeat * fraction) : 0
  const nextRecurring = seats * pricePerSeat

  return (
    <section className={`mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 ${className}`}>
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-base font-semibold text-foreground">Seats</h2>
          <p className="text-xs text-muted-foreground">
            {money(pricePerSeat, currency)} per seat per month · renews {renewsOn}
          </p>
        </header>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSeats((s) => Math.max(occupied, s - 1))}
              disabled={seats <= occupied}
              aria-label="Remove a seat"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Minus aria-hidden className="h-4 w-4" />
            </button>

            {/* A real input: seat counts get typed, not clicked, past ten. */}
            <label htmlFor="seat-count" className="sr-only">
              Number of seats
            </label>
            <input
              id="seat-count"
              type="number"
              inputMode="numeric"
              min={occupied}
              max={999}
              value={seats}
              onChange={(e) => {
                const next = Number.parseInt(e.target.value, 10)
                setSeats(Number.isNaN(next) ? occupied : Math.max(occupied, Math.min(999, next)))
              }}
              className="h-9 w-20 rounded-lg border border-field bg-background px-3 text-center text-sm font-semibold tabular-nums text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            />

            <button
              type="button"
              onClick={() => setSeats((s) => Math.min(999, s + 1))}
              aria-label="Add a seat"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Plus aria-hidden className="h-4 w-4" />
            </button>
          </div>

          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users aria-hidden className="h-3.5 w-3.5" />
            {occupied} of {purchased} seats are in use
          </p>
        </div>

        {/* Why the minus button stops, said rather than implied. */}
        {seats <= occupied ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {occupied} seats are occupied. Remove someone from the team to go below{' '}
            {occupied}.
          </p>
        ) : null}

        {/*
          The preview. Live, because it is the consequence of a control
          elsewhere on the card and it is the whole reason this screen
          exists.
        */}
        <div
          aria-live="polite"
          className="mt-5 rounded-xl border border-border bg-muted/40 p-4"
        >
          {delta === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing has changed. You keep {purchased} seats at{' '}
              {money(nextRecurring, currency)} a month.
            </p>
          ) : adding ? (
            <dl className="space-y-2 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">
                  {delta} extra {delta === 1 ? 'seat' : 'seats'} for the {daysRemaining} days
                  left in this period
                </dt>
                <dd className="shrink-0 font-semibold tabular-nums text-foreground">
                  {money(dueNow, currency)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-t border-border pt-2">
                <dt className="text-muted-foreground">
                  From {renewsOn}, every month
                </dt>
                <dd className="shrink-0 font-semibold tabular-nums text-foreground">
                  {money(nextRecurring, currency)}
                </dd>
              </div>
              <p className="pt-1 text-xs text-muted-foreground">
                The part-period charge is {money(pricePerSeat, currency)} × {delta} ×{' '}
                {daysRemaining}/{periodDays} days. It goes on the card ending 4242 today.
              </p>
            </dl>
          ) : (
            <div className="space-y-2 text-sm">
              <p className="text-foreground">
                Removing {Math.abs(delta)} {Math.abs(delta) === 1 ? 'seat' : 'seats'} takes
                effect on {renewsOn}.
              </p>
              {/* The asymmetry, at the moment it matters. */}
              <p className="inline-flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2 py-1 text-xs text-amber-700 dark:text-amber-400">
                <AlertCircle aria-hidden className="mt-0.5 h-3 w-3 shrink-0" />
                Nothing is refunded now. The seats stay usable until {renewsOn}, and the
                bill drops to {money(nextRecurring, currency)} from then on.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={delta === 0}
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {adding
              ? `Add ${delta} and pay ${money(dueNow, currency)}`
              : removing
                ? `Remove ${Math.abs(delta)} at renewal`
                : 'Update seats'}
          </button>
          <button
            type="button"
            disabled={delta === 0}
            onClick={() => setSeats(purchased)}
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cancel
          </button>
        </div>
      </div>
    </section>
  )
}
