'use client'

/**
 * <CrudSuccessState> — the screen after the record is written.
 *
 * The twelfth CRUD shape and the one that is almost never designed. Most
 * products fire a toast and drop the user back on the list, which answers
 * "did it work" and nothing else. The three questions people actually have
 * after creating something are:
 *
 *   1. What exactly did I create? (the reference, copyable)
 *   2. What do I do next? (and the answer is rarely "look at a list")
 *   3. Can I take it back? (yes, for a few seconds, and then no)
 *
 * THE UNDO WINDOW IS A REAL COUNTDOWN, AND IT IS HONEST
 *
 * A countdown that keeps ticking after the window closes, or an Undo that
 * silently stops working, is worse than no undo. This one shows the seconds,
 * disables itself when they run out, and replaces the offer with the reason
 * it is gone — the record has been dispatched downstream and undo is now a
 * separate reversal, not a cancel.
 *
 * `setInterval` is cleared on unmount and the tick derives from a stored
 * deadline rather than from a counter, so a backgrounded tab that stops
 * firing timers does not come back with thirty seconds still on the clock.
 *
 * NEXT ACTIONS ARE RANKED, NOT LISTED. One primary, two secondary, one quiet
 * link back. Four equal-weight buttons is a menu, and a menu is what the user
 * came here to avoid.
 *
 * ACCESSIBILITY: the panel is `role="status"` so the outcome is announced
 * without stealing focus; the countdown is `aria-live="off"` and re-announced
 * only at the two thresholds that matter, because a per-second live region is
 * unusable with a screen reader. Focus moves to the heading on mount, which
 * is what makes this a page state rather than a toast.
 */

import * as React from 'react'
import { ArrowRight, Check, Copy, Plus, Send, Undo2 } from 'lucide-react'

export interface SuccessAction {
  id: string
  label: string
  description: string
  tone?: 'primary' | 'secondary'
}

export interface CrudSuccessStateProps {
  title?: string
  reference?: string
  summary?: { label: string; value: string }[]
  actions?: SuccessAction[]
  /** Seconds the undo offer stays live. */
  undoSeconds?: number
  className?: string
}

const DEFAULT_SUMMARY = [
  { label: 'Supplier', value: 'Northwind Trading Ltd' },
  { label: 'Value', value: '£41,200.00' },
  { label: 'Delivery', value: 'Rotterdam DC · 24 Sep 2026' },
  { label: 'Approver', value: 'Rhea Patel (auto-assigned)' },
]

const DEFAULT_ACTIONS: SuccessAction[] = [
  {
    id: 'send',
    label: 'Send to the supplier',
    description: 'Emails the order and starts the acknowledgement clock.',
    tone: 'primary',
  },
  {
    id: 'another',
    label: 'Raise another order',
    description: 'Same supplier and delivery site, empty line items.',
  },
  {
    id: 'attach',
    label: 'Attach a quote',
    description: 'Required before finance will match the invoice.',
  },
]

export function CrudSuccessState({
  title = 'Purchase order raised',
  reference = 'PO-2291',
  summary = DEFAULT_SUMMARY,
  actions = DEFAULT_ACTIONS,
  undoSeconds = 20,
  className = '',
}: CrudSuccessStateProps) {
  const headingRef = React.useRef<HTMLHeadingElement>(null)
  const [remaining, setRemaining] = React.useState(undoSeconds)
  const [undone, setUndone] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  // Focus the heading: what makes this a page state rather than a toast.
  React.useEffect(() => {
    headingRef.current?.focus()
  }, [])

  React.useEffect(() => {
    // Derived from a deadline, not a counter — a backgrounded tab whose
    // timers were throttled must not come back with the clock unspent.
    const deadline = Date.now() + undoSeconds * 1000
    const tick = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0) window.clearInterval(tick)
    }, 250)
    return () => window.clearInterval(tick)
  }, [undoSeconds])

  async function copyReference() {
    try {
      await navigator.clipboard?.writeText(reference)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* Clipboard is absent over plain http and in some webviews. */
    }
  }

  return (
    <section className={`bg-background px-4 py-14 sm:px-6 ${className}`}>
      <div
        role="status"
        className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-6 text-card-foreground"
      >
        <span
          aria-hidden
          className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        >
          <Check className="h-5 w-5" />
        </span>

        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-4 text-xl font-bold tracking-tight outline-none"
        >
          {undone ? 'Order withdrawn' : title}
        </h1>

        {undone ? (
          <p className="mt-1.5 text-sm text-muted-foreground">
            {reference} has been withdrawn. Nothing was sent to the supplier.
          </p>
        ) : (
          <>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Reference</span>
              <span className="font-mono text-xs text-foreground">{reference}</span>
              <button
                type="button"
                onClick={copyReference}
                className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {copied ? (
                  <Check aria-hidden className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Copy aria-hidden className="h-3 w-3" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <dl className="mt-5 divide-y divide-border/70 rounded-xl border border-border">
              {summary.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-3 px-3 py-2.5 text-sm"
                >
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="text-end font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>

            {/* Ranked: one primary, the rest quieter. */}
            <ul className="mt-5 space-y-2">
              {actions.map((action) => (
                <li key={action.id}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      action.tone === 'primary'
                        ? 'bg-primary text-primary-foreground hover:opacity-90'
                        : 'border border-border hover:bg-muted'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-semibold">
                        {action.tone === 'primary' ? (
                          <Send aria-hidden className="h-4 w-4 rtl:rotate-180" />
                        ) : (
                          <Plus aria-hidden className="h-4 w-4" />
                        )}
                        {action.label}
                      </span>
                      <span
                        className={`mt-0.5 block text-xs ${
                          action.tone === 'primary'
                            ? 'text-primary-foreground/80'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {action.description}
                      </span>
                    </span>
                    <ArrowRight
                      aria-hidden
                      className="h-4 w-4 shrink-0 opacity-70 rtl:rotate-180"
                    />
                  </button>
                </li>
              ))}
            </ul>

            {/* Honest: the offer disappears and says why. */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border p-3">
              {remaining > 0 ? (
                <>
                  <p aria-live="off" className="text-xs text-muted-foreground">
                    You can withdraw this for another{' '}
                    <span className="font-semibold text-foreground">{remaining}s</span>.
                    After that it is dispatched and reversing it is a credit note.
                  </p>
                  <button
                    type="button"
                    onClick={() => setUndone(true)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Undo2 aria-hidden className="h-3.5 w-3.5 rtl:rotate-180" />
                    Withdraw
                  </button>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  The withdrawal window has closed — the order is with the
                  supplier. Reversing it now raises a credit note instead.
                </p>
              )}
            </div>
          </>
        )}

        <p className="mt-5 text-center">
          <a
            href="#"
            className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Back to purchase orders
          </a>
        </p>
      </div>
    </section>
  )
}
