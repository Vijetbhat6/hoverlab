'use client'

/**
 * <OrderSummaryPanel> — subtotal, shipping, tax, promo code, total.
 *
 * Every figure is derived from the line items and the applied discount.
 * Nothing here is passed in pre-computed, which is what stops a summary
 * disagreeing with the basket beside it — the classic version of that bug
 * is a promo code that updates the total but not the discount row.
 *
 * The "free delivery in £X more" nudge is computed from the same threshold
 * that decides whether shipping is charged, so the two can never contradict
 * each other. Quoting a threshold from a separate constant is how shops end
 * up promising free delivery at £50 and charging it at £50.
 *
 * Tax is shown as a line even when it is included in the price, because a
 * total that silently contains VAT and never says so is the single most
 * common complaint about European checkouts.
 */

import * as React from 'react'
import { Tag, Check, Truck } from 'lucide-react'

export interface SummaryLine {
  price: number
  quantity: number
}

export interface Promo {
  code: string
  /** Fraction off the subtotal, e.g. 0.1 for 10%. */
  rate: number
  label: string
}

export interface OrderSummaryPanelProps {
  lines?: SummaryLine[]
  currency?: string
  locale?: string
  /** Spend at or above this, in minor units, and delivery is free. */
  freeShippingThreshold?: number
  shippingCost?: number
  /** Included in the displayed prices, shown for transparency. */
  taxRate?: number
  promos?: Promo[]
  ctaLabel?: string
  onCheckout?: () => void
  className?: string
}

const DEFAULT_LINES: SummaryLine[] = [
  { price: 8900, quantity: 1 },
  { price: 6500, quantity: 2 },
  { price: 4800, quantity: 1 },
]

const DEFAULT_PROMOS: Promo[] = [
  { code: 'WELCOME10', rate: 0.1, label: '10% off your first order' },
]

function formatPrice(minor: number, currency = 'GBP', locale = 'en-GB'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minor / 100)
}

export function OrderSummaryPanel({
  lines = DEFAULT_LINES,
  currency = 'GBP',
  locale = 'en-GB',
  freeShippingThreshold = 5000,
  shippingCost = 495,
  taxRate = 0.2,
  promos = DEFAULT_PROMOS,
  ctaLabel = 'Checkout',
  onCheckout,
  className = '',
}: OrderSummaryPanelProps) {
  // Per-instance ids. A literal id in a reusable component is a
  // collision waiting for the second copy on the page — and a <label>
  // then resolves to whichever input rendered first.
  const uid = React.useId()
  const [entered, setEntered] = React.useState('')
  const [applied, setApplied] = React.useState<Promo | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const subtotal = lines.reduce((n, l) => n + l.price * l.quantity, 0)
  const discount = applied ? Math.round(subtotal * applied.rate) : 0
  const afterDiscount = subtotal - discount

  // One threshold drives both the charge and the nudge below.
  const shippingFree = afterDiscount >= freeShippingThreshold
  const shipping = shippingFree ? 0 : shippingCost
  const remainingForFree = Math.max(0, freeShippingThreshold - afterDiscount)

  const total = afterDiscount + shipping
  // Prices include tax, so this is the portion of the total, not an addition.
  const taxIncluded = Math.round(total - total / (1 + taxRate))

  function apply(event: React.FormEvent) {
    event.preventDefault()
    const match = promos.find((p) => p.code.toLowerCase() === entered.trim().toLowerCase())

    if (!match) {
      setError('That code is not valid or has expired.')
      return
    }

    setApplied(match)
    setError(null)
    setEntered('')
  }

  return (
    <aside
      className={`rounded-2xl border border-border/60 bg-card/60 p-6 ${className}`}
    >
      <h2 className="text-lg font-bold tracking-tight">Order summary</h2>

      {/* Promo */}
      {applied ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-emerald-500/10 px-3 py-2.5 text-sm">
          <span className="inline-flex min-w-0 items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <Check aria-hidden className="h-4 w-4 shrink-0" />
            <span className="truncate font-medium">{applied.code}</span>
          </span>
          <button
            type="button"
            onClick={() => setApplied(null)}
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
          >
            Remove
          </button>
        </div>
      ) : (
        <form onSubmit={apply} className="mt-4">
          <label htmlFor={`${uid}-promo-code`} className="sr-only">
            Promo code
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id={`${uid}-promo-code`}
                value={entered}
                onChange={(e) => {
                  setEntered(e.target.value)
                  setError(null)
                }}
                placeholder="Promo code"
                aria-invalid={Boolean(error)}
                aria-describedby={`${uid}-promo-error`}
                className="w-full rounded-xl border border-border/60 bg-background py-2 ps-9 pe-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-xl border border-border/60 bg-background px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Apply
            </button>
          </div>
          <p id={`${uid}-promo-error`} aria-live="polite" className="mt-1.5 min-h-4 text-xs text-destructive">
            {error}
          </p>
        </form>
      )}

      {/* Figures */}
      <dl className="mt-5 space-y-2.5 border-t border-border/60 pt-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="tabular-nums">{formatPrice(subtotal, currency, locale)}</dd>
        </div>

        {applied ? (
          <div className="flex justify-between gap-4 text-emerald-600 dark:text-emerald-400">
            <dt>{applied.label}</dt>
            <dd className="tabular-nums">−{formatPrice(discount, currency, locale)}</dd>
          </div>
        ) : null}

        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Delivery</dt>
          <dd className="tabular-nums">
            {shippingFree ? (
              <span className="font-medium text-emerald-600 dark:text-emerald-400">Free</span>
            ) : (
              formatPrice(shipping, currency, locale)
            )}
          </dd>
        </div>

        <div className="flex justify-between gap-4 text-xs text-muted-foreground">
          <dt>Includes VAT ({Math.round(taxRate * 100)}%)</dt>
          <dd className="tabular-nums">{formatPrice(taxIncluded, currency, locale)}</dd>
        </div>

        <div className="flex justify-between gap-4 border-t border-border/60 pt-3 text-base font-bold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatPrice(total, currency, locale)}</dd>
        </div>
      </dl>

      {/* Same threshold as the charge above. */}
      {!shippingFree ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
          <Truck aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Spend {formatPrice(remainingForFree, currency, locale)} more for free delivery.
        </p>
      ) : null}

      <button
        type="button"
        onClick={onCheckout}
        className="mt-5 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {ctaLabel}
      </button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Taxes and delivery calculated at checkout for your region.
      </p>
    </aside>
  )
}
