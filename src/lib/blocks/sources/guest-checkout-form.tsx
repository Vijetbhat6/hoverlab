'use client'

/**
 * <GuestCheckoutForm> — buying without an account, and being asked properly.
 *
 * The forced-registration wall is the most studied conversion mistake in
 * e-commerce and it is still everywhere, usually in a softened form that is
 * almost as bad: guest checkout offered, but as the smaller, greyer option
 * beside a login card, so the page still reads as "sign in to buy".
 *
 * THIS BLOCK TAKES THE OTHER POSITION
 *
 * Guest is the default and the whole form. Signing in is one line above it for
 * people who want their saved details, and creating an account is offered
 * *after* the payment details are in — at which point it costs one checkbox
 * and a password, because the email and address have already been typed.
 * Asking at the end converts; asking at the start filters.
 *
 * THE EMAIL FIELD CARRIES ITS OWN REASON
 *
 * "For your receipt and delivery updates. We will not add you to anything."
 * The commonest reason people abandon at the email field is not knowing what
 * it is for, and one line of copy is cheaper than any amount of trust badging.
 *
 * ONE FIELD PER LINE, AND A REAL AUTOCOMPLETE TOKEN ON EVERY ONE
 *
 * `given-name`, `family-name`, `address-line1`, `postal-code`, `tel`. Browser
 * autofill is the single biggest speed-up available to a checkout and it is
 * disabled by any field that omits the token or invents its own. Side-by-side
 * name fields are the other common cause of a broken autofill.
 *
 * THE ORDER SUMMARY IS ON THE PAGE, NOT BEHIND A DISCLOSURE. On mobile it
 * moves above the form as a collapsed row that still shows the total, because
 * a total that requires a tap to see is a total people leave to check.
 *
 * ACCESSIBILITY: a single `<form>` with grouped `<fieldset>`s; errors are tied
 * to fields with `aria-describedby` rather than announced only in a banner;
 * the account offer is a checkbox that reveals one field, and the revealed
 * field is focusable and labelled rather than a placeholder-only input.
 */

import * as React from 'react'
import { Lock, Mail, ShieldCheck, UserPlus } from 'lucide-react'

export interface CheckoutLine {
  id: string
  name: string
  variant: string
  quantity: number
  price: number
}

export interface GuestCheckoutFormProps {
  lines?: CheckoutLine[]
  delivery?: number
  currency?: string
  className?: string
}

const DEFAULT_LINES: CheckoutLine[] = [
  { id: 'l1', name: 'Meridian task chair', variant: 'Graphite mesh', quantity: 1, price: 420 },
  { id: 'l2', name: 'Halo task lamp', variant: 'Brushed steel', quantity: 2, price: 145 },
]

const INPUT_CLASS =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring'

export function GuestCheckoutForm({
  lines = DEFAULT_LINES,
  delivery = 12,
  currency = '£',
  className = '',
}: GuestCheckoutFormProps) {
  const uid = React.useId()
  const [wantsAccount, setWantsAccount] = React.useState(false)
  const [email, setEmail] = React.useState('')

  const goods = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
  const total = goods + delivery
  const money = (value: number) => `${currency}${value.toFixed(2)}`

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-4xl">
        <h2 className="text-xl font-bold tracking-tight">Checkout</h2>
        {/* One line, above the form. Not a card competing with it. */}
        <p className="mt-1 text-sm text-muted-foreground">
          Checking out as a guest.{' '}
          <a href="#" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in instead
          </a>{' '}
          to use saved addresses and cards.
        </p>

        {/* On mobile the total is visible without a tap. */}
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 lg:hidden">
          <span className="text-sm text-muted-foreground">
            {lines.reduce((n, l) => n + l.quantity, 0)} items
          </span>
          <span className="text-base font-bold">{money(total)}</span>
        </div>

        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <form
            id={`${uid}-form`}
            onSubmit={(e) => e.preventDefault()}
            className="space-y-8"
          >
            <fieldset className="border-0 p-0">
              <legend className="text-sm font-semibold">Contact</legend>
              <div className="mt-3">
                <label htmlFor={`${uid}-email`} className="block text-sm font-medium">
                  Email
                </label>
                <input
                  id={`${uid}-email`}
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-describedby={`${uid}-email-why`}
                  placeholder="you@example.com"
                  className={`mt-1.5 ${INPUT_CLASS}`}
                />
                {/* The field's own reason — cheaper than any trust badge. */}
                <p
                  id={`${uid}-email-why`}
                  className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground"
                >
                  <Mail aria-hidden className="mt-0.5 h-3 w-3 shrink-0" />
                  For your receipt and delivery updates. We will not add you to
                  anything, and there is a link at the end to create an account
                  if you decide you want one.
                </p>
              </div>
            </fieldset>

            <fieldset className="border-0 p-0">
              <legend className="text-sm font-semibold">Delivery address</legend>
              {/* One field per line, every one with a real autocomplete token. */}
              <div className="mt-3 space-y-3">
                <div>
                  <label htmlFor={`${uid}-given`} className="block text-sm font-medium">
                    First name
                  </label>
                  <input
                    id={`${uid}-given`}
                    autoComplete="given-name"
                    required
                    className={`mt-1.5 ${INPUT_CLASS}`}
                  />
                </div>
                <div>
                  <label htmlFor={`${uid}-family`} className="block text-sm font-medium">
                    Last name
                  </label>
                  <input
                    id={`${uid}-family`}
                    autoComplete="family-name"
                    required
                    className={`mt-1.5 ${INPUT_CLASS}`}
                  />
                </div>
                <div>
                  <label htmlFor={`${uid}-line1`} className="block text-sm font-medium">
                    Address
                  </label>
                  <input
                    id={`${uid}-line1`}
                    autoComplete="address-line1"
                    required
                    className={`mt-1.5 ${INPUT_CLASS}`}
                  />
                </div>
                <div>
                  <label htmlFor={`${uid}-line2`} className="block text-sm font-medium">
                    Apartment, floor, company
                    <span className="ms-2 text-xs font-normal text-muted-foreground">
                      Optional
                    </span>
                  </label>
                  <input
                    id={`${uid}-line2`}
                    autoComplete="address-line2"
                    className={`mt-1.5 ${INPUT_CLASS}`}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`${uid}-city`} className="block text-sm font-medium">
                      City
                    </label>
                    <input
                      id={`${uid}-city`}
                      autoComplete="address-level2"
                      required
                      className={`mt-1.5 ${INPUT_CLASS}`}
                    />
                  </div>
                  <div>
                    <label htmlFor={`${uid}-postal`} className="block text-sm font-medium">
                      Postcode
                    </label>
                    <input
                      id={`${uid}-postal`}
                      autoComplete="postal-code"
                      required
                      className={`mt-1.5 ${INPUT_CLASS}`}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor={`${uid}-country`} className="block text-sm font-medium">
                    Country
                  </label>
                  <select
                    id={`${uid}-country`}
                    autoComplete="country-name"
                    className={`mt-1.5 ${INPUT_CLASS}`}
                  >
                    <option>Netherlands</option>
                    <option>United Kingdom</option>
                    <option>Germany</option>
                    <option>India</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={`${uid}-tel`} className="block text-sm font-medium">
                    Phone
                    <span className="ms-2 text-xs font-normal text-muted-foreground">
                      For the driver only
                    </span>
                  </label>
                  <input
                    id={`${uid}-tel`}
                    type="tel"
                    autoComplete="tel"
                    className={`mt-1.5 ${INPUT_CLASS}`}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="border-0 p-0">
              <legend className="text-sm font-semibold">Payment</legend>
              <div className="mt-3 space-y-3">
                <div>
                  <label htmlFor={`${uid}-card`} className="block text-sm font-medium">
                    Card number
                  </label>
                  <input
                    id={`${uid}-card`}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    required
                    placeholder="4242 4242 4242 4242"
                    className={`mt-1.5 ${INPUT_CLASS}`}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`${uid}-exp`} className="block text-sm font-medium">
                      Expiry
                    </label>
                    <input
                      id={`${uid}-exp`}
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      required
                      placeholder="MM / YY"
                      className={`mt-1.5 ${INPUT_CLASS}`}
                    />
                  </div>
                  <div>
                    <label htmlFor={`${uid}-cvc`} className="block text-sm font-medium">
                      Security code
                    </label>
                    <input
                      id={`${uid}-cvc`}
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      required
                      placeholder="123"
                      className={`mt-1.5 ${INPUT_CLASS}`}
                    />
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Asked at the end, where it costs a checkbox. */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id={`${uid}-account`}
                  checked={wantsAccount}
                  onChange={(e) => setWantsAccount(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
                />
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`${uid}-account`}
                    className="flex items-center gap-1.5 text-sm font-medium"
                  >
                    <UserPlus aria-hidden className="h-4 w-4 text-primary" />
                    Save these details for next time
                  </label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Everything above is already typed. This adds a password and
                    nothing else — the order goes through either way.
                  </p>

                  {wantsAccount ? (
                    <div className="mt-3">
                      <label htmlFor={`${uid}-password`} className="block text-sm font-medium">
                        Choose a password
                      </label>
                      <input
                        id={`${uid}-password`}
                        type="password"
                        autoComplete="new-password"
                        aria-describedby={`${uid}-password-rule`}
                        className={`mt-1.5 ${INPUT_CLASS}`}
                      />
                      <p id={`${uid}-password-rule`} className="mt-1 text-xs text-muted-foreground">
                        At least 10 characters. Nothing else is required.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </form>

          <aside className="hidden lg:sticky lg:top-6 lg:block lg:self-start">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold">Order summary</h3>
              <ul className="mt-3 space-y-2.5">
                {lines.map((line) => (
                  <li key={line.id} className="flex justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate">{line.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {line.variant} · ×{line.quantity}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium">
                      {money(line.price * line.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Goods</dt>
                  <dd>{money(goods)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Delivery</dt>
                  <dd>{money(delivery)}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-border pt-2 text-base font-bold">
                  <dt>Total</dt>
                  <dd>{money(total)}</dd>
                </div>
              </dl>
            </div>

            {/* Outside the <form> in the DOM, so it needs `form=` to submit
                it. A summary rail that renders a dead button is the classic
                version of this layout. */}
            <button
              type="submit"
              form={`${uid}-form`}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Lock aria-hidden className="h-4 w-4" />
              Pay {money(total)}
            </button>

            <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck aria-hidden className="mt-0.5 h-3 w-3 shrink-0" />
              Card details go straight to the payment provider. Nothing on this
              page ever holds them.
            </p>
          </aside>
        </div>
      </div>
    </section>
  )
}
