'use client'

/**
 * <CartDrawer> — a slide-over basket.
 *
 * The dialog mechanics that are usually missing:
 *
 *  - Focus moves into the panel on open and returns to whatever opened it
 *    on close. Without the return, a keyboard user is dumped back at the
 *    top of the document every time they dismiss the drawer.
 *  - Focus is trapped while open — Tab from the last control wraps to the
 *    first rather than walking into the page behind.
 *  - Escape closes it, and the backdrop is a real button so the "click
 *    outside" gesture is reachable without a mouse.
 *  - Background scroll is locked, or the page behind scrolls under the
 *    panel on touch.
 *
 * `role="dialog"` with `aria-modal` tells assistive tech the rest of the
 * page is inert; the focus trap is what makes that claim true.
 */

import * as React from 'react'
import { X, ShoppingBag, ArrowRight } from 'lucide-react'

export interface DrawerLine {
  id: string
  name: string
  variant?: string
  price: number
  quantity: number
  swatch?: string
}

export interface CartDrawerProps {
  lines?: DrawerLine[]
  currency?: string
  locale?: string
  defaultOpen?: boolean
  /**
   * Render as a demo inside a larger page rather than as a real overlay.
   *
   * An open drawer legitimately owns the document: it locks background
   * scroll, traps Tab and listens for Escape. A *preview* of one owns
   * nothing — it is a card in a grid, and a card that sets
   * `body { overflow: hidden }` freezes the page it is sitting on. Since
   * this block previews itself open, that lock would otherwise fire on
   * mount and never be cleaned up.
   */
  embedded?: boolean
  className?: string
}

const DEFAULT_LINES: DrawerLine[] = [
  { id: '1', name: 'Merino Crew Sweater', variant: 'Stone · M', price: 8900, quantity: 1, swatch: 'from-stone-300 to-stone-500' },
  { id: '2', name: 'Cotton Oxford Shirt', variant: 'Sky · L', price: 6500, quantity: 2, swatch: 'from-sky-200 to-sky-400' },
]

function formatPrice(minor: number, currency = 'GBP', locale = 'en-GB'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minor / 100)
}

export function CartDrawer({
  lines = DEFAULT_LINES,
  currency = 'GBP',
  locale = 'en-GB',
  defaultOpen = true,
  embedded = false,
  className = '',
}: CartDrawerProps) {
  const [open, setOpen] = React.useState(defaultOpen)

  const panelRef = React.useRef<HTMLDivElement>(null)
  const openerRef = React.useRef<HTMLButtonElement>(null)

  const itemCount = lines.reduce((n, l) => n + l.quantity, 0)
  const subtotal = lines.reduce((n, l) => n + l.price * l.quantity, 0)

  // Focus in on open, back to the opener on close, Escape to dismiss, and
  // Tab trapped inside the panel.
  React.useEffect(() => {
    // Embedded: no scroll lock, no focus trap, no document key handler.
    // Returning focus to the opener is skipped too — in a grid of previews
    // that would scroll the visitor's page to this card unprompted.
    if (embedded) return

    if (!open) {
      openerRef.current?.focus()
      return
    }

    const panel = panelRef.current
    const previous = document.activeElement as HTMLElement | null

    const focusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      )

    focusables()[0]?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        return
      }
      if (event.key !== 'Tab') return

      const items = focusables()
      if (items.length === 0) return

      const first = items[0]
      const last = items[items.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    // Lock background scroll, restoring whatever was there before rather
    // than assuming it was `visible`.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previous?.focus?.()
    }
  }, [open, embedded])

  return (
    <div className={`relative min-h-96 ${className}`}>
      <div className="flex items-center justify-center p-10">
        <button
          ref={openerRef}
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          <ShoppingBag aria-hidden className="h-4 w-4" />
          Open bag
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground">
            {itemCount}
          </span>
        </button>
      </div>

      {open ? (
        <>
          {/* A real button, so dismissing does not require a pointer. */}
          <button
            type="button"
            aria-label="Close bag"
            onClick={() => setOpen(false)}
            className="absolute inset-0 z-30 cursor-default bg-black/40 backdrop-blur-sm"
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
            className="absolute inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-s border-border/60 bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
              <h2 className="font-semibold tracking-tight">
                Your bag
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({itemCount})
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close bag"
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>

            <ul className="flex-1 divide-y divide-border/40 overflow-y-auto px-5">
              {lines.map((line) => (
                <li key={line.id} className="flex gap-3 py-4">
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted">
                    <div
                      aria-hidden
                      className={`h-full w-full bg-gradient-to-br ${line.swatch ?? 'from-muted to-muted-foreground/20'}`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium">{line.name}</h3>
                    {line.variant ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{line.variant}</p>
                    ) : null}
                    <p className="mt-2 text-sm text-muted-foreground">
                      {line.quantity} × {formatPrice(line.price, currency, locale)}
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatPrice(line.price * line.quantity, currency, locale)}
                  </p>
                </li>
              ))}

              {lines.length === 0 ? (
                <li className="py-16 text-center text-sm text-muted-foreground">
                  Your bag is empty.
                </li>
              ) : null}
            </ul>

            <div className="border-t border-border/60 px-5 py-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-lg font-bold tabular-nums">
                  {formatPrice(subtotal, currency, locale)}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Delivery and taxes calculated at checkout.
              </p>

              <a
                href="/checkout"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Checkout
                <ArrowRight aria-hidden className="h-4 w-4" />
              </a>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Continue shopping
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
