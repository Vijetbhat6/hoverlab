'use client'

/**
 * <CheckoutExpressPayment> — the wallet row, and what it does to the form.
 *
 * Cart & Checkout had the drawer, the line items, the summary panel and
 * the checkout form. The wallet buttons are the piece that sits above all
 * of them and is nearly always got wrong, because the mistake is not
 * visual — it is where in the flow they appear and what happens after one
 * is used.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * Paying with a wallet returns an address, and the form shows what it got.
 * Most implementations either jump straight to a confirmation — so the
 * buyer never sees which of their four saved addresses was used — or drop
 * the returned data and ask again, which wastes the whole point. Here the
 * fields fill in, visibly, and stay editable with a line saying where the
 * values came from. Shipping to the wrong address is the most expensive
 * recoverable error in commerce, and it is nearly always this.
 *
 * A BUTTON FOR A WALLET NOBODY HAS IS WORSE THAN NO BUTTON
 *
 * Availability is a runtime question — `ApplePaySession.canMakePayments()`,
 * the Payment Request API's `canMakePayment()`, or whatever the processor
 * exposes — and it must be asked before the row renders. An Apple Pay
 * button on Android is a dead end that makes the whole checkout look
 * broken. The demo below fakes the answer with a toggle so both states are
 * visible; the comment where that toggle lives is where the real check
 * goes, and the row disappears entirely when nothing is available rather
 * than leaving a labelled empty box.
 *
 * ABOVE THE FORM, ALWAYS
 *
 * A wallet button under the card fields saves nobody anything: by then the
 * typing is done. It is the first thing on the page or it is decoration.
 *
 * THE DIVIDER IS A REAL SEPARATOR
 *
 * `role="separator"` with a label, not an `<hr>` with text floated over
 * it. The word "or" alone, read out between two groups of controls, is
 * one of the more confusing things a checkout can say.
 *
 * ACCESSIBILITY: the wallet row is a labelled group; each button says what
 * it will do ("Pay with Apple Pay, £84.00") rather than carrying a
 * wordmark and nothing else; the fill-in is announced through a polite
 * live region, because the form changing under you is otherwise silent.
 */

import * as React from 'react'
import { CreditCard, Info, ShieldCheck, Wallet } from 'lucide-react'

export interface ExpressWallet {
  id: string
  label: string
  /** In production this is a runtime capability check, not a constant. */
  available: boolean
}

export interface CheckoutExpressPaymentProps {
  total?: string
  wallets?: ExpressWallet[]
  className?: string
}

const DEFAULT_WALLETS: ExpressWallet[] = [
  { id: 'apple', label: 'Apple Pay', available: true },
  { id: 'google', label: 'Google Pay', available: true },
  { id: 'paypal', label: 'PayPal', available: true },
]

const RETURNED_BY_WALLET = {
  email: 'sam.keller@icloud.com',
  name: 'Sam Keller',
  line1: 'Flat 4, 18 Bickerton Road',
  city: 'London',
  postcode: 'N19 5JR',
}

export function CheckoutExpressPayment({
  total = '£84.00',
  wallets = DEFAULT_WALLETS,
  className = '',
}: CheckoutExpressPaymentProps) {
  /*
    Stand-in for the real capability check. Replace with
    `ApplePaySession.canMakePayments()`, `PaymentRequest.canMakePayment()`
    or your processor's equivalent — and keep the "render nothing" branch.
  */
  const [walletsSupported, setWalletsSupported] = React.useState(true)
  const [filledBy, setFilledBy] = React.useState<string | null>(null)

  const available = walletsSupported ? wallets.filter((w) => w.available) : []
  const values = filledBy
    ? RETURNED_BY_WALLET
    : { email: '', name: '', line1: '', city: '', postcode: '' }

  return (
    <section className={`mx-auto w-full max-w-md px-4 py-16 sm:px-6 ${className}`}>
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-foreground">Checkout</h2>
          <p className="text-sm text-muted-foreground">
            Total <span className="font-semibold tabular-nums text-foreground">{total}</span>
          </p>
        </div>

        {/* The row is first, or it is decoration. */}
        {available.length > 0 ? (
          <>
            <div
              role="group"
              aria-label="Express payment"
              className="mt-5 grid gap-2 sm:grid-cols-3"
            >
              {available.map((wallet) => (
                <button
                  key={wallet.id}
                  type="button"
                  onClick={() => setFilledBy(wallet.label)}
                  /* Says what it does and for how much, not just a wordmark. */
                  aria-label={`Pay with ${wallet.label}, ${total}`}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Wallet aria-hidden className="h-4 w-4" />
                  {wallet.label}
                </button>
              ))}
            </div>

            {/* A labelled separator, not an hr with a word floated over it. */}
            <div
              role="separator"
              aria-label="Or pay by card instead"
              className="my-5 flex items-center gap-3"
            >
              <span aria-hidden className="h-px flex-1 bg-border" />
              <span aria-hidden className="text-xs text-muted-foreground">
                or pay by card
              </span>
              <span aria-hidden className="h-px flex-1 bg-border" />
            </div>
          </>
        ) : (
          /* Nothing available: no row, no empty labelled box. */
          <p className="mt-4 text-xs text-muted-foreground">
            No wallet is available in this browser, so the card form is the
            whole checkout.
          </p>
        )}

        {/* What the wallet handed back, shown rather than assumed. */}
        <p aria-live="polite" className="min-h-5 text-xs text-muted-foreground">
          {filledBy
            ? `${filledBy} filled these in. Check the address before you place the order — you can still change it.`
            : ''}
        </p>

        {/*
          The fields stay uncontrolled so they remain editable after the
          wallet fills them; the `key` is React's documented way of
          resetting an uncontrolled input when its default changes.
        */}
        <form className="mt-3 space-y-4">
          {[
            { id: 'ep-email', label: 'Email', value: values.email, type: 'email', autoComplete: 'email' },
            { id: 'ep-name', label: 'Full name', value: values.name, type: 'text', autoComplete: 'name' },
            { id: 'ep-line1', label: 'Address', value: values.line1, type: 'text', autoComplete: 'address-line1' },
          ].map((field) => (
            <div key={field.id}>
              <label htmlFor={field.id} className="block text-sm font-medium text-foreground">
                {field.label}
              </label>
              <input
                id={field.id}
                type={field.type}
                autoComplete={field.autoComplete}
                defaultValue={field.value}
                key={`${field.id}-${filledBy ?? 'empty'}`}
                className="mt-1.5 h-10 w-full rounded-lg border border-field bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ep-city" className="block text-sm font-medium text-foreground">
                City
              </label>
              <input
                id="ep-city"
                type="text"
                autoComplete="address-level2"
                defaultValue={values.city}
                key={`ep-city-${filledBy ?? 'empty'}`}
                className="mt-1.5 h-10 w-full rounded-lg border border-field bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
            </div>
            <div>
              <label htmlFor="ep-postcode" className="block text-sm font-medium text-foreground">
                Postcode
              </label>
              <input
                id="ep-postcode"
                type="text"
                autoComplete="postal-code"
                defaultValue={values.postcode}
                key={`ep-postcode-${filledBy ?? 'empty'}`}
                className="mt-1.5 h-10 w-full rounded-lg border border-field bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <CreditCard aria-hidden className="h-4 w-4" />
            Pay {total}
          </button>

          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Card details go straight to the payment provider. They never touch
            this site.
          </p>
        </form>

        {/* Demo control for the capability check described above. */}
        <label className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={!walletsSupported}
            onChange={(event) => setWalletsSupported(!event.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border-field accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <span className="flex items-start gap-1.5">
            <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Pretend no wallet is available — the state a real capability check
            has to produce, and the one nobody designs.
          </span>
        </label>
      </div>
    </section>
  )
}
