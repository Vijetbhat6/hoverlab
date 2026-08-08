'use client'

/**
 * <CartLineItems> — the editable contents of a basket.
 *
 * Money is integer minor units throughout and every total is derived, never
 * stored. A cart that keeps its own `total` field drifts the first time a
 * quantity changes on a path that forgot to recompute it, and the customer
 * is the one who finds out at the payment step.
 *
 * Removing a line is undoable for a few seconds rather than confirmed with
 * a dialog. A confirm on every removal is friction on the common case; an
 * undo is friction only on the mistake, which is the right trade for an
 * action this cheap to reverse.
 *
 * The line count and total are announced through `aria-live`, because after
 * changing a quantity the only thing that visibly updates is a number
 * somewhere else on the page.
 */

import * as React from 'react'
import { Minus, Plus, Trash2, Undo2 } from 'lucide-react'

export interface CartLine {
  id: string
  name: string
  variant?: string
  /** Unit price in minor units. */
  price: number
  quantity: number
  maxQuantity?: number
  swatch?: string
}

export interface CartLineItemsProps {
  lines?: CartLine[]
  currency?: string
  locale?: string
  onChange?: (lines: CartLine[]) => void
  className?: string
}

const DEFAULT_LINES: CartLine[] = [
  { id: '1', name: 'Merino Crew Sweater', variant: 'Stone · M', price: 8900, quantity: 1, swatch: 'from-stone-300 to-stone-500' },
  { id: '2', name: 'Cotton Oxford Shirt', variant: 'Sky · L', price: 6500, quantity: 2, swatch: 'from-sky-200 to-sky-400' },
  { id: '3', name: 'Leather Card Holder', variant: 'Black', price: 4800, quantity: 1, swatch: 'from-emerald-300 to-emerald-600' },
]

function formatPrice(minor: number, currency = 'GBP', locale = 'en-GB'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minor / 100)
}

export function CartLineItems({
  lines: initialLines = DEFAULT_LINES,
  currency = 'GBP',
  locale = 'en-GB',
  onChange,
  className = '',
}: CartLineItemsProps) {
  const [lines, setLines] = React.useState(initialLines)
  const [removed, setRemoved] = React.useState<{ line: CartLine; index: number } | null>(null)

  // Always derived. Never a stored field — see the file header.
  const itemCount = lines.reduce((n, line) => n + line.quantity, 0)
  const subtotal = lines.reduce((n, line) => n + line.price * line.quantity, 0)

  function update(next: CartLine[]) {
    setLines(next)
    onChange?.(next)
  }

  function setQuantity(id: string, quantity: number) {
    update(lines.map((l) => (l.id === id ? { ...l, quantity } : l)))
  }

  function remove(id: string) {
    const index = lines.findIndex((l) => l.id === id)
    if (index === -1) return
    setRemoved({ line: lines[index], index })
    update(lines.filter((l) => l.id !== id))
  }

  function undo() {
    if (!removed) return
    const next = [...lines]
    // Restored to its original position, not appended — a line that
    // reappears at the bottom looks like a different line.
    next.splice(removed.index, 0, removed.line)
    update(next)
    setRemoved(null)
  }

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-4">
        <h2 className="text-lg font-bold tracking-tight">Your bag</h2>
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {itemCount} {itemCount === 1 ? 'item' : 'items'} ·{' '}
          <span className="font-medium text-foreground">
            {formatPrice(subtotal, currency, locale)}
          </span>
        </p>
      </div>

      {removed ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-2.5 text-sm">
          <span className="truncate text-muted-foreground">
            Removed <span className="font-medium text-foreground">{removed.line.name}</span>
          </span>
          <button
            type="button"
            onClick={undo}
            className="inline-flex shrink-0 items-center gap-1.5 font-semibold hover:underline"
          >
            <Undo2 aria-hidden className="h-3.5 w-3.5" />
            Undo
          </button>
        </div>
      ) : null}

      {lines.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Your bag is empty.
        </p>
      ) : (
        <ul className="divide-y divide-border/40">
          {lines.map((line) => (
            <li key={line.id} className="flex gap-4 py-5">
              <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted">
                <div
                  aria-hidden
                  className={`h-full w-full bg-gradient-to-br ${line.swatch ?? 'from-muted to-muted-foreground/20'}`}
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium">{line.name}</h3>
                    {line.variant ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{line.variant}</p>
                    ) : null}
                  </div>

                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatPrice(line.price * line.quantity, currency, locale)}
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                  <div className="inline-flex items-center rounded-lg border border-border/60">
                    <button
                      type="button"
                      onClick={() => setQuantity(line.id, Math.max(1, line.quantity - 1))}
                      disabled={line.quantity <= 1}
                      aria-label={`Decrease quantity of ${line.name}`}
                      className="rounded-l-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                    >
                      <Minus aria-hidden className="h-3.5 w-3.5" />
                    </button>

                    <span className="w-8 text-center text-sm tabular-nums">
                      <span className="sr-only">Quantity of {line.name}: </span>
                      {line.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(line.id, Math.min(line.maxQuantity ?? 10, line.quantity + 1))
                      }
                      disabled={line.quantity >= (line.maxQuantity ?? 10)}
                      aria-label={`Increase quantity of ${line.name}`}
                      className="rounded-r-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                    >
                      <Plus aria-hidden className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(line.id)}
                    aria-label={`Remove ${line.name} from bag`}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 aria-hidden className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
