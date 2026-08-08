/**
 * <OrderConfirmation> — the thank-you screen.
 *
 * The job of this page is to stop the two support emails it would otherwise
 * generate: "did my order go through" and "when will it arrive". So the
 * order number is large and copyable, the delivery estimate is a date range
 * rather than "soon", and the confirmation-email address is shown so a typo
 * is caught here rather than after three days of silence.
 *
 * No confetti, no animation. This screen is often reached by someone
 * checking a purchase they are anxious about, and it should read as a
 * receipt rather than a celebration.
 *
 * Server component.
 */

import * as React from 'react'
import { CircleCheck, Package, Truck, Mail } from 'lucide-react'

export interface ConfirmationLine {
  id: string
  name: string
  variant?: string
  price: number
  quantity: number
  swatch?: string
}

export interface OrderConfirmationProps {
  orderNumber?: string
  email?: string
  lines?: ConfirmationLine[]
  shipping?: number
  discount?: number
  currency?: string
  locale?: string
  /** ISO dates bounding the delivery estimate. */
  deliveryFrom?: string
  deliveryTo?: string
  address?: string[]
  className?: string
}

const DEFAULT_LINES: ConfirmationLine[] = [
  { id: '1', name: 'Merino Crew Sweater', variant: 'Stone · M', price: 8900, quantity: 1, swatch: 'from-stone-300 to-stone-500' },
  { id: '2', name: 'Cotton Oxford Shirt', variant: 'Sky · L', price: 6500, quantity: 2, swatch: 'from-sky-200 to-sky-400' },
]

function formatPrice(minor: number, currency = 'GBP', locale = 'en-GB'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minor / 100)
}

/** Pinned to UTC — a bare `new Date('2026-08-14')` renders as the 13th west of Greenwich. */
function formatDate(iso: string, locale = 'en-GB'): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

export function OrderConfirmation({
  orderNumber = 'ORD-4821-9930',
  email = 'you@example.com',
  lines = DEFAULT_LINES,
  shipping = 0,
  discount = 2190,
  currency = 'GBP',
  locale = 'en-GB',
  deliveryFrom = '2026-08-14',
  deliveryTo = '2026-08-18',
  address = ['Ada Lovelace', '12 Marchmont Street', 'London', 'WC1N 1AG', 'United Kingdom'],
  className = '',
}: OrderConfirmationProps) {
  const subtotal = lines.reduce((n, l) => n + l.price * l.quantity, 0)
  const total = subtotal - discount + shipping

  return (
    <div className={`mx-auto w-full max-w-2xl px-6 py-12 ${className}`}>
      <div className="text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <CircleCheck className="h-7 w-7" />
        </span>

        <h1 className="mt-5 text-balance text-3xl font-extrabold tracking-tight">
          Thanks — your order is confirmed
        </h1>

        <p className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <Mail aria-hidden className="h-4 w-4" />
          A confirmation is on its way to{' '}
          <span className="font-medium text-foreground">{email}</span>
        </p>

        {/* Selectable, so it can be pasted into a support email. */}
        <p className="mt-5 inline-block rounded-xl border border-border/60 bg-card/60 px-4 py-2.5">
          <span className="block text-xs text-muted-foreground">Order number</span>
          <span className="select-all font-mono text-lg font-semibold tracking-tight">
            {orderNumber}
          </span>
        </p>
      </div>

      {/* A date range, not "soon". */}
      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-border/60 bg-card/60 p-5">
        <Truck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="font-medium">Estimated delivery</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            <time dateTime={deliveryFrom}>{formatDate(deliveryFrom, locale)}</time>
            {' – '}
            <time dateTime={deliveryTo}>{formatDate(deliveryTo, locale)}</time>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            We will email a tracking link as soon as it ships.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section className="rounded-2xl border border-border/60 bg-card/60 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Package aria-hidden className="h-4 w-4" />
            Delivering to
          </h2>
          <address className="mt-2 text-sm not-italic leading-relaxed text-muted-foreground">
            {address.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card/60 p-5">
          <h2 className="text-sm font-semibold">Payment</h2>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(subtotal, currency, locale)}</dd>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between gap-3 text-emerald-600 dark:text-emerald-400">
                <dt>Discount</dt>
                <dd className="tabular-nums">−{formatPrice(discount, currency, locale)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="tabular-nums">
                {shipping === 0 ? 'Free' : formatPrice(shipping, currency, locale)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-border/60 pt-1.5 font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(total, currency, locale)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-5">
        <h2 className="text-sm font-semibold">
          {lines.length} {lines.length === 1 ? 'item' : 'items'}
        </h2>

        <ul className="mt-3 divide-y divide-border/40">
          {lines.map((line) => (
            <li key={line.id} className="flex items-center gap-3 py-3">
              <div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted">
                <div
                  aria-hidden
                  className={`h-full w-full bg-gradient-to-br ${line.swatch ?? 'from-muted to-muted-foreground/20'}`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{line.name}</p>
                {line.variant ? (
                  <p className="text-xs text-muted-foreground">{line.variant}</p>
                ) : null}
              </div>
              <p className="shrink-0 text-sm text-muted-foreground">×{line.quantity}</p>
              <p className="w-20 shrink-0 text-right text-sm font-medium tabular-nums">
                {formatPrice(line.price * line.quantity, currency, locale)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href="/orders"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Track this order
        </a>
        <a
          href="/"
          className="rounded-xl border border-border/60 bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          Continue shopping
        </a>
      </div>
    </div>
  )
}
