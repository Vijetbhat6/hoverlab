'use client'

/**
 * <PaymentMethodCard> — the card on file, and the two things that go wrong
 * with it.
 *
 * Both failure modes this block is built around are silent, and both cost
 * the business the subscription rather than the support ticket:
 *
 *  - An expired card. The renewal fails, the dunning email lands in
 *    promotions, and the account lapses. So expiry is not a passive field
 *    here: a card expiring within two cycles is called out in place, before
 *    it fails, where the customer is already looking at their billing page.
 *
 *  - A second card added and never made default. Every provider's API lets
 *    you have five cards and charge the wrong one. The default is stated on
 *    the row rather than implied by ordering, and promoting a card is one
 *    click from the row itself.
 *
 * The card number is masked to the last four and the brand is a word, not a
 * logo. Shipping brand SVGs means shipping trademarks, and the last four is
 * the only part a customer actually recognises — it is what their bank app
 * shows them too.
 *
 * Nothing here touches a real payment API on purpose. A card form that
 * collects a PAN into React state is a PCI scope disaster, and every
 * processor worth using hands you an iframe or an element for exactly that
 * reason. This block is the management screen around that element.
 */

import * as React from 'react'
import { CreditCard, Check, TriangleAlert, Plus, Trash2 } from 'lucide-react'

export interface PaymentMethod {
  id: string
  /** "Visa", "Mastercard" — a word, not a logo. See the note above. */
  brand: string
  last4: string
  expMonth: number
  /** Four digits. */
  expYear: number
  isDefault?: boolean
}

export interface PaymentMethodCardProps {
  methods?: PaymentMethod[]
  /** Billing e-mail, shown because a failed charge is mailed to it. */
  billingEmail?: string
  onAdd?: () => void
  onMakeDefault?: (id: string) => void
  onRemove?: (id: string) => void
  className?: string
}

const DEFAULT_METHODS: PaymentMethod[] = [
  { id: 'pm_1', brand: 'Visa', last4: '4242', expMonth: 11, expYear: 2026, isDefault: true },
  { id: 'pm_2', brand: 'Mastercard', last4: '5100', expMonth: 3, expYear: 2029 },
]

/**
 * How a card's expiry stands relative to a given month.
 *
 * Takes "now" as arguments rather than reading the clock, so the state is a
 * pure function of its inputs — a component that calls `new Date()` during
 * render produces different markup on the server and the client, which is
 * the hydration mismatch this exact kind of block usually ships with.
 */
type Expiry = 'ok' | 'soon' | 'expired'

export function expiryState(
  expMonth: number,
  expYear: number,
  nowMonth: number,
  nowYear: number,
): Expiry {
  const months = (expYear - nowYear) * 12 + (expMonth - nowMonth)
  if (months < 0) return 'expired'
  return months <= 2 ? 'soon' : 'ok'
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function PaymentMethodCard({
  methods = DEFAULT_METHODS,
  billingEmail = 'billing@acme.com',
  onAdd,
  onMakeDefault,
  onRemove,
  className,
}: PaymentMethodCardProps) {
  /*
    "Now" is read once, after mount, and the rows render as `ok` until it
    arrives. The alternative — `new Date()` during render — makes the
    server's month and the client's month two different strings whenever a
    request straddles midnight on the 1st, and React throws the server
    markup away for the whole subtree.
  */
  const [now, setNow] = React.useState<{ month: number; year: number } | null>(null)
  React.useEffect(() => {
    const d = new Date()
    setNow({ month: d.getMonth() + 1, year: d.getFullYear() })
  }, [])

  return (
    <section
      className={`w-full rounded-2xl border border-border/60 bg-card ${className ?? ''}`}
      aria-labelledby="payment-heading"
    >
      <header className="border-b border-border/60 px-6 py-4">
        <h2 id="payment-heading" className="text-base font-semibold tracking-tight">
          Payment methods
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Receipts and failed-payment notices go to {billingEmail}.
        </p>
      </header>

      <ul className="divide-y divide-border/60">
        {methods.map((method) => {
          const state = now
            ? expiryState(method.expMonth, method.expYear, now.month, now.year)
            : 'ok'
          const canRemove = !method.isDefault || methods.length === 1

          return (
            <li key={method.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-6 py-4">
              <span
                aria-hidden
                className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/50"
              >
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {/*
                    A bullet, not asterisks: the mask is decoration, and a
                    screen reader announcing twelve asterisks before four
                    digits is worse than "Visa ending 4242".
                  */}
                  <span aria-hidden>
                    {method.brand} •••• {method.last4}
                  </span>
                  <span className="sr-only">
                    {method.brand} ending {method.last4}
                  </span>

                  {method.isDefault ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      <Check aria-hidden className="h-3 w-3" />
                      Default
                    </span>
                  ) : null}
                </p>

                <p
                  className={`mt-0.5 text-xs ${
                    state === 'expired'
                      ? 'text-destructive'
                      : state === 'soon'
                        ? 'text-amber-600 dark:text-amber-500'
                        : 'text-muted-foreground'
                  }`}
                >
                  {state === 'expired' ? (
                    <span className="inline-flex items-center gap-1">
                      <TriangleAlert aria-hidden className="h-3 w-3" />
                      Expired {pad(method.expMonth)}/{method.expYear} — renewals on this
                      card will fail
                    </span>
                  ) : state === 'soon' ? (
                    <span className="inline-flex items-center gap-1">
                      <TriangleAlert aria-hidden className="h-3 w-3" />
                      Expires {pad(method.expMonth)}/{method.expYear} — update it before
                      your next renewal
                    </span>
                  ) : (
                    <>
                      Expires {pad(method.expMonth)}/{method.expYear}
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!method.isDefault ? (
                  <button
                    type="button"
                    onClick={() => onMakeDefault?.(method.id)}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    Make default
                  </button>
                ) : null}
                {/*
                  Removing the only card is allowed; removing the default
                  while another exists is not, because the result would be
                  an account with cards and no card to charge. Disabled with
                  a `title` rather than hidden — a control that vanishes
                  teaches nothing about why.
                */}
                <button
                  type="button"
                  disabled={!canRemove}
                  onClick={() => onRemove?.(method.id)}
                  title={
                    canRemove
                      ? `Remove ${method.brand} ending ${method.last4}`
                      : 'Make another card the default before removing this one'
                  }
                  aria-label={`Remove ${method.brand} ending ${method.last4}`}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                >
                  <Trash2 aria-hidden className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <footer className="border-t border-border/60 px-6 py-4">
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          <Plus aria-hidden className="h-4 w-4" />
          Add payment method
        </button>
      </footer>
    </section>
  )
}
