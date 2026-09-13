'use client'

/**
 * <ReturnExchangePicker> — refund, exchange, or credit, decided per line.
 *
 * The fork every returns flow has to offer and most of them get wrong by
 * asking too early: a single radio at the top — "Refund or exchange?" — before
 * the customer has said what they are sending back. Then the exchange path
 * discovers the replacement is out of stock and the whole flow restarts.
 *
 * THE ORDER OF THE QUESTIONS IS THE DESIGN
 *
 *   1. Which line, and how many.
 *   2. What is the outcome for *that* line.
 *   3. If exchange: what for — with live stock, in this step, not at checkout.
 *
 * Doing it per line matters because the answer genuinely differs: the chair
 * that arrived scratched is a refund, the shirt in the wrong size is an
 * exchange, and forcing one answer onto both is what makes people give up and
 * email.
 *
 * EXCHANGE IS PRICED HONESTLY AND IMMEDIATELY
 *
 * Swapping for a more expensive variant shows the difference to pay before the
 * customer commits, and a cheaper one shows the amount coming back. A flow
 * that reveals "£40 to pay" after the goods have been posted is a flow with a
 * complaint at the end of it.
 *
 * STORE CREDIT IS OFFERED, NOT PRE-SELECTED. It is usually the retailer's
 * preferred outcome and often carries a bonus, so it gets a badge saying what
 * the bonus is — but the default stays refund, because a pre-ticked option
 * that favours the seller is a dark pattern with a business case.
 *
 * OUT-OF-STOCK VARIANTS ARE SHOWN DISABLED, NOT HIDDEN. Same argument as
 * `search-facet-panel` makes about zero counts: a list that reshapes itself is
 * disorienting, and "my size is not there" is a different feeling from "my
 * size is out of stock until the 30th".
 *
 * ACCESSIBILITY: the outcome is a real radio group per line, named by the
 * product; variant buttons carry `aria-pressed` and their stock state in text;
 * the running summary is a polite live region.
 */

import * as React from 'react'
import { ArrowLeftRight, BadgePercent, Banknote, Check } from 'lucide-react'

export type Outcome = 'refund' | 'exchange' | 'credit'

export interface ExchangeVariant {
  id: string
  label: string
  priceDelta: number
  /** Zero renders the variant disabled with the restock note. */
  stock: number
  restock?: string
}

export interface ReturnLine {
  id: string
  name: string
  variant: string
  price: number
  quantity: number
  variants: ExchangeVariant[]
}

export interface ReturnExchangePickerProps {
  orderRef?: string
  lines?: ReturnLine[]
  /** Percentage bonus added when store credit is chosen. */
  creditBonusPct?: number
  currency?: string
  className?: string
}

const DEFAULT_LINES: ReturnLine[] = [
  {
    id: 'l1',
    name: 'Meridian task chair',
    variant: 'Graphite mesh, standard height',
    price: 420,
    quantity: 1,
    variants: [
      { id: 'v1', label: 'Graphite mesh, tall', priceDelta: 0, stock: 6 },
      { id: 'v2', label: 'Slate mesh, standard', priceDelta: 0, stock: 0, restock: 'back on 30 September' },
      { id: 'v3', label: 'Graphite mesh, headrest', priceDelta: 65, stock: 3 },
      { id: 'v4', label: 'Graphite fabric, standard', priceDelta: -40, stock: 11 },
    ],
  },
  {
    id: 'l2',
    name: 'Halo task lamp',
    variant: 'Brushed steel',
    price: 145,
    quantity: 2,
    variants: [
      { id: 'v5', label: 'Matte black', priceDelta: 0, stock: 14 },
      { id: 'v6', label: 'Brass', priceDelta: 25, stock: 0, restock: 'back on 12 October' },
    ],
  },
]

const OUTCOMES: { id: Outcome; label: string; note: string; icon: typeof Banknote }[] = [
  { id: 'refund', label: 'Refund', note: 'Back to the original payment method', icon: Banknote },
  { id: 'exchange', label: 'Exchange', note: 'Swap for another variant', icon: ArrowLeftRight },
  { id: 'credit', label: 'Store credit', note: 'Issued instantly, never expires', icon: BadgePercent },
]

interface LineChoice {
  on: boolean
  quantity: number
  outcome: Outcome
  variantId: string
}

export function ReturnExchangePicker({
  orderRef = 'ORD-88410',
  lines = DEFAULT_LINES,
  creditBonusPct = 10,
  currency = '£',
  className = '',
}: ReturnExchangePickerProps) {
  const uid = React.useId()
  const [choices, setChoices] = React.useState<Record<string, LineChoice>>(() =>
    Object.fromEntries(
      lines.map((line, i) => [
        line.id,
        { on: i === 0, quantity: 1, outcome: i === 0 ? 'exchange' : 'refund', variantId: '' },
      ]),
    ),
  )

  function money(value: number) {
    const sign = value < 0 ? '−' : ''
    return `${sign}${currency}${Math.abs(value).toFixed(2)}`
  }

  const active = lines.filter((line) => choices[line.id]?.on)

  const refundTotal = active.reduce((sum, line) => {
    const c = choices[line.id]!
    if (c.outcome === 'refund') return sum + line.price * c.quantity
    if (c.outcome === 'credit') {
      return sum + line.price * c.quantity * (1 + creditBonusPct / 100)
    }
    return sum
  }, 0)

  const exchangeDelta = active.reduce((sum, line) => {
    const c = choices[line.id]!
    if (c.outcome !== 'exchange') return sum
    const variant = line.variants.find((v) => v.id === c.variantId)
    return sum + (variant?.priceDelta ?? 0) * c.quantity
  }, 0)

  function update(lineId: string, patch: Partial<LineChoice>) {
    setChoices((c) => ({ ...c, [lineId]: { ...c[lineId]!, ...patch } }))
  }

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-3xl">
        <h2 className="text-xl font-bold tracking-tight">Return or exchange</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Order {orderRef}. Each line is decided on its own — one can be
          refunded while another is swapped.
        </p>

        <div className="mt-6 space-y-4">
          {lines.map((line) => {
            const c = choices[line.id]!
            const chosenVariant = line.variants.find((v) => v.id === c.variantId)
            return (
              <div
                key={line.id}
                className={`rounded-xl border p-4 transition-colors ${
                  c.on ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`${uid}-${line.id}`}
                    checked={c.on}
                    onChange={(e) => update(line.id, { on: e.target.checked })}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-primary"
                  />
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`${uid}-${line.id}`} className="text-sm font-medium">
                      {line.name}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {line.variant} · {money(line.price)} · {line.quantity} in the order
                    </p>

                    {c.on ? (
                      <>
                        <fieldset className="mt-3 border-0 p-0">
                          <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Outcome for {line.name}
                          </legend>
                          <div className="mt-2 grid gap-2 sm:grid-cols-3">
                            {OUTCOMES.map((outcome) => {
                              const Icon = outcome.icon
                              const id = `${uid}-${line.id}-${outcome.id}`
                              const on = c.outcome === outcome.id
                              return (
                                <div key={outcome.id}>
                                  <input
                                    type="radio"
                                    id={id}
                                    name={`${uid}-${line.id}-outcome`}
                                    checked={on}
                                    onChange={() => update(line.id, { outcome: outcome.id })}
                                    className="peer sr-only"
                                  />
                                  <label
                                    htmlFor={id}
                                    className={`block cursor-pointer rounded-lg border p-2.5 text-xs transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${
                                      on ? 'border-primary bg-card' : 'border-border hover:bg-muted/60'
                                    }`}
                                  >
                                    <span className="flex items-center gap-1.5 font-semibold">
                                      <Icon aria-hidden className="h-3.5 w-3.5" />
                                      {outcome.label}
                                      {outcome.id === 'credit' ? (
                                        <span className="rounded bg-emerald-500/10 px-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                          +{creditBonusPct}%
                                        </span>
                                      ) : null}
                                    </span>
                                    <span className="mt-0.5 block text-muted-foreground">
                                      {outcome.note}
                                    </span>
                                  </label>
                                </div>
                              )
                            })}
                          </div>
                        </fieldset>

                        {c.outcome === 'exchange' ? (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Swap for
                            </p>
                            <ul className="mt-2 flex flex-wrap gap-2">
                              {line.variants.map((variant) => {
                                const out = variant.stock === 0
                                const on = c.variantId === variant.id
                                return (
                                  <li key={variant.id}>
                                    <button
                                      type="button"
                                      disabled={out}
                                      aria-pressed={on}
                                      onClick={() => update(line.id, { variantId: variant.id })}
                                      className={`rounded-lg border px-2.5 py-1.5 text-start text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                        on ? 'border-primary bg-card font-semibold' : 'border-border hover:bg-muted/60'
                                      }`}
                                    >
                                      <span className="flex items-center gap-1.5">
                                        {on ? <Check aria-hidden className="h-3 w-3" /> : null}
                                        {variant.label}
                                      </span>
                                      <span className="mt-0.5 block text-muted-foreground">
                                        {out
                                          ? `Out of stock — ${variant.restock}`
                                          : variant.priceDelta === 0
                                            ? 'Same price'
                                            : `${money(variant.priceDelta)} difference`}
                                      </span>
                                    </button>
                                  </li>
                                )
                              })}
                            </ul>
                            {chosenVariant && chosenVariant.priceDelta !== 0 ? (
                              <p className="mt-2 text-xs font-medium">
                                {chosenVariant.priceDelta > 0
                                  ? `${money(chosenVariant.priceDelta * c.quantity)} to pay before it ships.`
                                  : `${money(Math.abs(chosenVariant.priceDelta) * c.quantity)} comes back to you.`}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div
          aria-live="polite"
          className="mt-6 rounded-xl border border-border bg-card p-4"
        >
          <h3 className="text-sm font-semibold">Summary</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Lines selected</dt>
              <dd>{active.length}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Coming back to you</dt>
              <dd className="font-medium">{money(refundTotal)}</dd>
            </div>
            {exchangeDelta !== 0 ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">
                  {exchangeDelta > 0 ? 'To pay for the exchange' : 'Exchange credit'}
                </dt>
                <dd className="font-medium">{money(Math.abs(exchangeDelta))}</dd>
              </div>
            ) : null}
          </dl>
          <button
            type="button"
            disabled={active.length === 0}
            className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            Confirm and get a return label
          </button>
        </div>
      </div>
    </section>
  )
}
