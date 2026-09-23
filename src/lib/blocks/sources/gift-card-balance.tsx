'use client'

/**
 * <GiftCardBalance> — checking a card, and the two ways that goes wrong.
 *
 * A balance checker is four lines of markup and is almost always shipped
 * broken, because it is treated as a lookup rather than as a screen someone
 * reaches while holding a card that is not working. The two failures it has to
 * handle are both real and both common:
 *
 *   the card is empty     spent, and the customer wants to know on what
 *   the card is expired   which in some jurisdictions is not the end of it
 *
 * SO THE RESULT IS A HISTORY, NOT A NUMBER
 *
 * "£0.00" is technically an answer and practically an accusation. The
 * transaction list — where it was spent, when, against which order — is what
 * turns a disputed balance into a resolved one, and it costs one table.
 *
 * THE PIN FIELD EXISTS AND IS EXPLAINED
 *
 * Balance lookups are scraped: a card number alone is guessable at scale, and
 * a checker with no second factor is a free oracle for anyone brute-forcing
 * them. The PIN is why, and saying so is better than an unexplained extra
 * field people assume is optional.
 *
 * THE CARD NUMBER IS FORMATTED AS IT IS TYPED, AND STORED UNFORMATTED. Spaces
 * in the input, none in the value. Rejecting a number because someone typed
 * the spaces printed on the card is the pettiest possible validation failure.
 *
 * ACCESSIBILITY: the result is a `role="status"` region so it is announced
 * without moving focus; the failure is `role="alert"`; the input has
 * `inputMode="numeric"` and an `autoComplete` value of `off`, because a gift
 * card is not a payment card and offering saved cards here is wrong.
 */

import * as React from 'react'
import { CreditCard, Gift, Info, TriangleAlert } from 'lucide-react'

export interface CardTransaction {
  id: string
  what: string
  when: string
  amount: number
}

export interface KnownCard {
  /** Unformatted digits. */
  number: string
  pin: string
  balance: number
  issued: string
  expires: string
  expired?: boolean
  transactions: CardTransaction[]
}

export interface GiftCardBalanceProps {
  cards?: KnownCard[]
  currency?: string
  className?: string
}

const DEFAULT_CARDS: KnownCard[] = [
  {
    number: '4471908220145566',
    pin: '8841',
    balance: 62.5,
    issued: '4 December 2025',
    expires: '4 December 2027',
    transactions: [
      { id: 't1', what: 'Order ORD-88410 — Halo task lamp', when: '2 Sep 2026', amount: -145 },
      { id: 't2', what: 'Top-up at checkout', when: '12 Aug 2026', amount: 100 },
      { id: 't3', what: 'Order ORD-87204 — Cable spine ×4', when: '3 Jun 2026', amount: -42.5 },
      { id: 't4', what: 'Issued', when: '4 Dec 2025', amount: 150 },
    ],
  },
  {
    number: '4471908220149999',
    pin: '1020',
    balance: 0,
    issued: '1 February 2023',
    expires: '1 February 2025',
    expired: true,
    transactions: [
      { id: 't5', what: 'Expired — unspent balance written off', when: '1 Feb 2025', amount: -18 },
      { id: 't6', what: 'Issued', when: '1 Feb 2023', amount: 18 },
    ],
  },
]

function formatNumber(digits: string) {
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

export function GiftCardBalance({
  cards = DEFAULT_CARDS,
  currency = '£',
  className = '',
}: GiftCardBalanceProps) {
  const uid = React.useId()
  const [digits, setDigits] = React.useState('4471908220145566')
  const [pin, setPin] = React.useState('8841')
  const [result, setResult] = React.useState<KnownCard | 'unknown' | null>(cards[0] ?? null)

  function money(value: number) {
    const sign = value < 0 ? '−' : ''
    return `${sign}${currency}${Math.abs(value).toFixed(2)}`
  }

  function check(event: React.FormEvent) {
    event.preventDefault()
    const match = cards.find((card) => card.number === digits && card.pin === pin)
    setResult(match ?? 'unknown')
  }

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-xl">
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <Gift aria-hidden className="h-5 w-5 text-primary" />
          Check a gift card
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The number and PIN are on the back of the card, or in the email if it
          was sent digitally.
        </p>

        <form onSubmit={check} className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_7rem]">
            <div>
              <label htmlFor={`${uid}-number`} className="block text-sm font-medium">
                Card number
              </label>
              <input
                id={`${uid}-number`}
                inputMode="numeric"
                // Not a payment card: offering saved cards here is wrong.
                autoComplete="off"
                // Formatted for the eye, stored bare — see the docblock.
                value={formatNumber(digits)}
                onChange={(e) => setDigits(e.target.value.replace(/\D/g, '').slice(0, 16))}
                placeholder="4471 9082 2014 5566"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm tracking-wide outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label htmlFor={`${uid}-pin`} className="block text-sm font-medium">
                PIN
              </label>
              <input
                id={`${uid}-pin`}
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                aria-describedby={`${uid}-pin-why`}
                placeholder="8841"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Explained, not left as an unexplained extra field. */}
          <p id={`${uid}-pin-why`} className="mt-2 flex gap-1.5 text-xs text-muted-foreground">
            <Info aria-hidden className="mt-0.5 h-3 w-3 shrink-0" />
            The PIN is asked for because a card number on its own is guessable
            at scale, and a checker without it is a free oracle for anyone
            trying.
          </p>

          <button
            type="submit"
            disabled={digits.length < 16 || pin.length < 4}
            className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            Check the balance
          </button>
        </form>

        {result === 'unknown' ? (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-destructive/40 bg-destructive/5 p-4"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <TriangleAlert aria-hidden className="h-4 w-4" />
              No card matches that number and PIN
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Check the PIN — it is the four digits under the scratch panel, not
              the last four of the card number. Three wrong attempts locks the
              card for an hour.
            </p>
          </div>
        ) : null}

        {result && result !== 'unknown' ? (
          <div role="status" className="mt-5 rounded-2xl border border-border bg-card p-5">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <CreditCard aria-hidden className="h-3.5 w-3.5" />
              Card ending {result.number.slice(-4)}
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight">
              {money(result.balance)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Issued {result.issued} ·{' '}
              {result.expired ? (
                <span className="font-medium text-destructive">
                  expired {result.expires}
                </span>
              ) : (
                `valid until ${result.expires}`
              )}
            </p>

            {result.expired ? (
              <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                An expired card is not always a lost balance — in several
                jurisdictions gift-card funds must be honoured for longer than
                the printed date. Contact us with the number before writing it
                off.
              </p>
            ) : null}

            {/* A number alone is an accusation; the history is the answer. */}
            <h3 data-stress-ignore className="mt-5 text-sm font-semibold">
              Where it went
            </h3>
            <ul className="mt-2 divide-y divide-border/70">
              {result.transactions.map((tx) => (
                <li key={tx.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{tx.what}</span>
                    <span className="block text-xs text-muted-foreground">{tx.when}</span>
                  </span>
                  <span
                    className={`shrink-0 font-medium ${
                      tx.amount < 0 ? 'text-muted-foreground' : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {money(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}
