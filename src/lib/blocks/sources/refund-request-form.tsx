'use client'

/**
 * <RefundRequestForm> — asking for money back, line by line.
 *
 * The mistake almost every refund form makes is treating the order as the
 * unit. Customers refund *items*, and usually not all of them: two of the
 * four arrived damaged, the third was the wrong size, the fourth is fine. A
 * form with one reason box and one Submit forces that into a paragraph
 * someone in support then has to parse by hand.
 *
 * SO THE UNIT IS THE LINE ITEM
 *
 * Each line has its own checkbox, its own quantity, and its own reason,
 * because the reason drives the outcome: "arrived damaged" is refunded with
 * no return, "changed my mind" needs the item back, and the two cannot share
 * a code path. Selecting a reason therefore changes what the form asks for
 * next — a photo for damage, nothing for a change of mind.
 *
 * THE TOTAL IS COMPUTED IN FRONT OF THE CUSTOMER
 *
 * Refundable amount, delivery, and the restocking fee where one applies, all
 * itemised and updating as lines are ticked. A refund form that submits into
 * silence and mails a figure four days later generates a second contact every
 * time the figure surprises anyone.
 *
 * DELIVERY IS REFUNDED ONLY WHEN THE WHOLE ORDER GOES BACK. That is the rule
 * in most jurisdictions and every retailer, and it is the single most common
 * source of "you refunded me the wrong amount". It is stated in the summary as
 * a line, not in a footnote.
 *
 * ACCESSIBILITY: each line is a `<fieldset>` whose `<legend>` is the product
 * name, so a screen reader hears which item each reason select belongs to
 * rather than four identical "Reason" comboboxes. The running total is a
 * polite live region. The photo requirement is announced when it appears,
 * because a required field that materialises silently is a submit failure
 * waiting to happen.
 */

import * as React from 'react'
import { Camera, Info, ShieldQuestion } from 'lucide-react'

export interface RefundLine {
  id: string
  name: string
  variant: string
  unitPrice: number
  quantity: number
  /** Restocking fee percentage applied to a change-of-mind return. */
  restockPct?: number
}

export interface RefundRequestFormProps {
  orderRef?: string
  lines?: RefundLine[]
  deliveryPaid?: number
  currency?: string
  className?: string
}

const REASONS = [
  { id: 'damaged', label: 'Arrived damaged', needsPhoto: true, needsReturn: false },
  { id: 'faulty', label: 'Faulty in use', needsPhoto: true, needsReturn: true },
  { id: 'wrong', label: 'Wrong item sent', needsPhoto: false, needsReturn: true },
  { id: 'mind', label: 'Changed my mind', needsPhoto: false, needsReturn: true },
  { id: 'late', label: 'Arrived too late to be useful', needsPhoto: false, needsReturn: true },
] as const

type ReasonId = (typeof REASONS)[number]['id']

const DEFAULT_LINES: RefundLine[] = [
  { id: 'l1', name: 'Meridian task chair', variant: 'Graphite mesh', unitPrice: 420, quantity: 2 },
  { id: 'l2', name: 'Halo task lamp', variant: 'Brushed steel', unitPrice: 145, quantity: 1, restockPct: 10 },
  { id: 'l3', name: 'Cable spine', variant: 'Black, 1.2 m', unitPrice: 38, quantity: 4, restockPct: 10 },
]

const INPUT_CLASS =
  'rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring'

interface LineState {
  on: boolean
  quantity: number
  reason: ReasonId | ''
}

export function RefundRequestForm({
  orderRef = 'ORD-88410',
  lines = DEFAULT_LINES,
  deliveryPaid = 12,
  currency = '£',
  className = '',
}: RefundRequestFormProps) {
  const uid = React.useId()
  const [state, setState] = React.useState<Record<string, LineState>>(() =>
    Object.fromEntries(
      lines.map((line, i) => [
        line.id,
        { on: i === 0, quantity: i === 0 ? 1 : line.quantity, reason: i === 0 ? 'damaged' : '' },
      ]),
    ),
  )

  const chosen = lines.filter((line) => state[line.id]?.on)
  const goods = chosen.reduce(
    (sum, line) => sum + line.unitPrice * (state[line.id]?.quantity ?? 0),
    0,
  )
  const restocking = chosen.reduce((sum, line) => {
    const s = state[line.id]
    if (!s || s.reason !== 'mind' || !line.restockPct) return sum
    return sum + (line.unitPrice * s.quantity * line.restockPct) / 100
  }, 0)
  // Delivery comes back only when nothing is kept — the single most common
  // source of "you refunded me the wrong amount".
  const everythingReturned =
    chosen.length === lines.length &&
    lines.every((line) => (state[line.id]?.quantity ?? 0) === line.quantity)
  const delivery = everythingReturned ? deliveryPaid : 0
  const total = goods - restocking + delivery

  const needsPhoto = chosen.some(
    (line) => REASONS.find((r) => r.id === state[line.id]?.reason)?.needsPhoto,
  )
  const needsReturn = chosen.some(
    (line) => REASONS.find((r) => r.id === state[line.id]?.reason)?.needsReturn,
  )

  function money(value: number) {
    return `${currency}${value.toFixed(2)}`
  }

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <form className="mx-auto max-w-3xl" onSubmit={(e) => e.preventDefault()}>
        <h2 className="text-xl font-bold tracking-tight">Request a refund</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Order {orderRef} · delivered 2 September 2026. Pick the lines you want
          back — you do not have to return the whole order.
        </p>

        <div className="mt-6 space-y-3">
          {lines.map((line) => {
            const s = state[line.id] ?? { on: false, quantity: line.quantity, reason: '' as const }
            const reason = REASONS.find((r) => r.id === s.reason)
            return (
              <fieldset
                key={line.id}
                className={`rounded-xl border p-4 transition-colors ${
                  s.on ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <legend className="sr-only">{line.name}</legend>
                <div className="flex flex-wrap items-start gap-3">
                  <input
                    type="checkbox"
                    id={`${uid}-${line.id}-on`}
                    checked={s.on}
                    onChange={(e) =>
                      setState((v) => ({ ...v, [line.id]: { ...s, on: e.target.checked } }))
                    }
                    className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-primary"
                  />
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`${uid}-${line.id}-on`} className="text-sm font-medium">
                      {line.name}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {line.variant} · {money(line.unitPrice)} each · {line.quantity} ordered
                    </p>

                    {s.on ? (
                      <div className="mt-3 flex flex-wrap items-end gap-3">
                        <div>
                          <label
                            htmlFor={`${uid}-${line.id}-qty`}
                            className="block text-xs font-medium"
                          >
                            Quantity
                          </label>
                          <select
                            id={`${uid}-${line.id}-qty`}
                            value={s.quantity}
                            onChange={(e) =>
                              setState((v) => ({
                                ...v,
                                [line.id]: { ...s, quantity: Number(e.target.value) },
                              }))
                            }
                            className={`mt-1 ${INPUT_CLASS}`}
                          >
                            {Array.from({ length: line.quantity }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="min-w-[12rem] flex-1">
                          <label
                            htmlFor={`${uid}-${line.id}-reason`}
                            className="block text-xs font-medium"
                          >
                            Reason for {line.name}
                          </label>
                          <select
                            id={`${uid}-${line.id}-reason`}
                            required
                            value={s.reason}
                            onChange={(e) =>
                              setState((v) => ({
                                ...v,
                                [line.id]: { ...s, reason: e.target.value as ReasonId },
                              }))
                            }
                            className={`mt-1 w-full ${INPUT_CLASS}`}
                          >
                            <option value="">Choose a reason…</option>
                            {REASONS.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : null}

                    {s.on && reason?.needsReturn && line.restockPct && s.reason === 'mind' ? (
                      <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                        A {line.restockPct}% restocking fee applies to a change of
                        mind on this line.
                      </p>
                    ) : null}
                  </div>
                </div>
              </fieldset>
            )
          })}
        </div>

        {/* Announced when it appears — a required field that materialises
            silently is a submit failure waiting to happen. */}
        {needsPhoto ? (
          <div
            role="status"
            className="mt-4 rounded-xl border border-border bg-card p-4"
          >
            <label
              htmlFor={`${uid}-photos`}
              className="flex items-center gap-2 text-sm font-medium"
            >
              <Camera aria-hidden className="h-4 w-4 text-primary" />
              Photos of the damage — required
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              One clear shot of the fault and one of the packaging. Claims
              without them are held until we ask for them, which adds days.
            </p>
            <input
              id={`${uid}-photos`}
              type="file"
              multiple
              accept="image/*"
              required
              className="mt-2 block w-full text-xs file:me-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium"
            />
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_16rem]">
          <div>
            <label htmlFor={`${uid}-notes`} className="block text-sm font-medium">
              Anything else we should know
              <span className="ms-2 text-xs font-normal text-muted-foreground">
                Optional
              </span>
            </label>
            <textarea
              id={`${uid}-notes`}
              rows={4}
              placeholder="The second chair had a cracked base plate out of the box."
              className={`mt-1.5 w-full ${INPUT_CLASS}`}
            />
          </div>

          <aside
            aria-live="polite"
            className="rounded-xl border border-border bg-card p-4 text-sm"
          >
            <h3 className="text-sm font-semibold">Estimated refund</h3>
            <dl className="mt-3 space-y-2">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Goods</dt>
                <dd>{money(goods)}</dd>
              </div>
              {restocking > 0 ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Restocking fee</dt>
                  <dd className="text-destructive">−{money(restocking)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd>
                  {delivery > 0 ? (
                    money(delivery)
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Not refunded — part of the order is kept
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-border pt-2 font-semibold">
                <dt>Total</dt>
                <dd>{money(total)}</dd>
              </div>
            </dl>

            <p className="mt-3 flex gap-1.5 text-xs text-muted-foreground">
              <Info aria-hidden className="mt-0.5 h-3 w-3 shrink-0" />
              {needsReturn
                ? 'Some lines must come back before the refund is released. A prepaid label follows by email.'
                : 'Nothing needs returning. The refund is released once the photos are checked.'}
            </p>
          </aside>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldQuestion aria-hidden className="h-3.5 w-3.5" />
            Refunds reach the original payment method in 3–5 working days once
            approved.
          </p>
          <button
            type="submit"
            disabled={chosen.length === 0 || chosen.some((l) => !state[l.id]?.reason)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Request {money(total)} back
          </button>
        </div>
      </form>
    </section>
  )
}
