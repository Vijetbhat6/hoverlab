/**
 * <OrderHistoryList> — a customer's past orders.
 *
 * Status is a word and an icon, never a coloured dot alone. "Delivered",
 * "Out for delivery" and "Refunded" are different enough that a customer
 * scanning for the one that has gone wrong needs to read, not decode.
 *
 * Each order shows its item thumbnails stacked rather than a count. People
 * remember what they bought by sight long before they remember the order
 * number, and a row reading "3 items" makes them open all three.
 *
 * Server component.
 */

import * as React from 'react'
import { Package, Truck, CircleCheck, RotateCcw, ChevronRight } from 'lucide-react'

export type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'refunded'

export interface PastOrder {
  id: string
  number: string
  /** ISO date. */
  placed: string
  status: OrderStatus
  total: number
  /** One swatch per item, for the stacked thumbnails. */
  swatches: string[]
  /** Shown for shipped orders. */
  trackingEta?: string
}

export interface OrderHistoryListProps {
  orders?: PastOrder[]
  currency?: string
  locale?: string
  className?: string
}

const STATUS: Record<
  OrderStatus,
  { label: string; icon: React.ReactNode; tone: string }
> = {
  processing: {
    label: 'Processing',
    icon: <Package className="h-3.5 w-3.5" />,
    tone: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  },
  shipped: {
    label: 'On its way',
    icon: <Truck className="h-3.5 w-3.5" />,
    tone: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
  delivered: {
    label: 'Delivered',
    icon: <CircleCheck className="h-3.5 w-3.5" />,
    tone: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
  refunded: {
    label: 'Refunded',
    icon: <RotateCcw className="h-3.5 w-3.5" />,
    tone: 'bg-muted text-muted-foreground',
  },
}

const DEFAULT_ORDERS: PastOrder[] = [
  {
    id: '1',
    number: 'ORD-4821-9930',
    placed: '2026-08-08',
    status: 'shipped',
    total: 19710,
    trackingEta: 'Arriving Friday',
    swatches: ['from-stone-300 to-stone-500', 'from-sky-200 to-sky-400'],
  },
  {
    id: '2',
    number: 'ORD-4712-1184',
    placed: '2026-07-02',
    status: 'delivered',
    total: 8900,
    swatches: ['from-emerald-300 to-emerald-600'],
  },
  {
    id: '3',
    number: 'ORD-4655-3027',
    placed: '2026-06-19',
    status: 'refunded',
    total: 3200,
    swatches: ['from-rose-300 to-rose-500'],
  },
  {
    id: '4',
    number: 'ORD-4590-7741',
    placed: '2026-05-30',
    status: 'delivered',
    total: 24400,
    swatches: [
      'from-indigo-300 to-indigo-600',
      'from-amber-300 to-amber-600',
      'from-zinc-300 to-zinc-500',
    ],
  },
]

function formatPrice(minor: number, currency = 'GBP', locale = 'en-GB'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minor / 100)
}

function formatDate(iso: string, locale = 'en-GB'): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function OrderHistoryList({
  orders = DEFAULT_ORDERS,
  currency = 'GBP',
  locale = 'en-GB',
  className = '',
}: OrderHistoryListProps) {
  return (
    <section className={`w-full ${className}`}>
      <h2 className="text-lg font-bold tracking-tight">Order history</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Everything you have ordered, newest first.
      </p>

      <ul className="mt-5 space-y-3">
        {orders.map((order) => {
          const status = STATUS[order.status]

          return (
            <li key={order.id}>
              <a
                href={`/orders/${order.id}`}
                className="group flex flex-wrap items-center gap-4 rounded-2xl border border-border/60 bg-card/60 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                {/* Stacked thumbnails — people recognise what they bought. */}
                <div aria-hidden className="flex shrink-0 -space-x-3">
                  {order.swatches.slice(0, 3).map((swatch, i) => (
                    <span
                      key={i}
                      className={`h-12 w-10 overflow-hidden rounded-lg border-2 border-background bg-gradient-to-br ${swatch}`}
                    />
                  ))}
                  {order.swatches.length > 3 ? (
                    <span className="flex h-12 w-10 items-center justify-center rounded-lg border-2 border-background bg-muted text-xs font-medium text-muted-foreground">
                      +{order.swatches.length - 3}
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-medium">{order.number}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Placed <time dateTime={order.placed}>{formatDate(order.placed, locale)}</time>
                    {' · '}
                    {order.swatches.length} {order.swatches.length === 1 ? 'item' : 'items'}
                  </p>
                  {order.trackingEta ? (
                    <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                      {order.trackingEta}
                    </p>
                  ) : null}
                </div>

                {/* Icon and word, never colour alone. */}
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.tone}`}
                >
                  {status.icon}
                  {status.label}
                </span>

                <p className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums">
                  {formatPrice(order.total, currency, locale)}
                </p>

                <ChevronRight
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
