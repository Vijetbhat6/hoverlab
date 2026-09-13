'use client'

/**
 * <CrudUpdateModal> — Update, in a modal, and the save that fails.
 *
 * Every edit modal in every design system shows the happy path: fields, a
 * Cancel, a Save. The interesting half is what happens after Save, and it is
 * the half nobody draws.
 *
 * THE THREE STATES THIS BLOCK IS ACTUALLY ABOUT
 *
 *  - **In flight.** Both buttons disabled, not just the primary. A Cancel
 *    that stays live during a request lets the user close a modal whose write
 *    is still going, and then wonder whether it landed.
 *  - **Rejected by the server.** The modal stays open, keeps every value the
 *    user typed, and shows the reason above the fields as an alert. The
 *    common bug is closing on submit and surfacing the failure as a toast,
 *    which discards the typing.
 *  - **Conflicted.** Someone else saved while this modal was open. That is
 *    not a validation error and must not read like one: the offer is to
 *    reload their version or overwrite it, stated in those words.
 *
 * WHY THE CONFLICT PATH IS IN THE BLOCK AND NOT LEFT AS AN EXERCISE
 *
 * Because it is the failure that loses work, and because the markup for it is
 * the same shape as the error state — one banner, two buttons — so its cost
 * is a dozen lines. The demo alternates: the first save fails on validation,
 * the second reports a conflict, the third succeeds. That is a demo, not a
 * suggestion about your API.
 *
 * ACCESSIBILITY: `role="dialog"` with `aria-modal`; the failure banner is
 * `role="alert"` so it is announced without moving focus away from the field
 * the user was in; the submit button's label changes with its state rather
 * than only its spinner, so the state is not carried by an animation alone.
 */

import * as React from 'react'
import { Loader2, RefreshCw, TriangleAlert, X } from 'lucide-react'

export type SaveOutcome = 'idle' | 'saving' | 'invalid' | 'conflict' | 'saved'

export interface CrudUpdateModalProps {
  recordName?: string
  className?: string
}

const INPUT_CLASS =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring'

export function CrudUpdateModal({
  recordName = 'Rotterdam DC · receiving hours',
  className = '',
}: CrudUpdateModalProps) {
  const uid = React.useId()
  const [open, setOpen] = React.useState(true)
  const [outcome, setOutcome] = React.useState<SaveOutcome>('idle')
  const [attempt, setAttempt] = React.useState(0)
  const [opens, setOpens] = React.useState('06:00')
  const [closes, setCloses] = React.useState('22:00')
  const [contact, setContact] = React.useState('goods-in@northwind.example')

  const busy = outcome === 'saving'

  function save(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setOutcome('saving')
    window.setTimeout(() => {
      // A scripted demo of the three endings, not a claim about your API.
      const next: SaveOutcome = attempt === 0 ? 'invalid' : attempt === 1 ? 'conflict' : 'saved'
      setOutcome(next)
      setAttempt((n) => n + 1)
    }, 700)
  }

  return (
    <section
      className={`relative flex min-h-[28rem] items-center justify-center bg-muted/30 p-4 sm:p-6 ${className}`}
    >
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${uid}-title`}
          className="w-full max-w-md rounded-2xl border border-border bg-card text-card-foreground shadow-lg"
        >
          <form onSubmit={save}>
            <header className="flex items-start justify-between gap-3 border-b border-border p-4">
              <div className="min-w-0">
                <h2 id={`${uid}-title`} className="truncate text-base font-semibold">
                  Edit {recordName}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Changes apply to bookings made from now on.
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </header>

            <div className="space-y-4 p-4">
              {/* Announced where the user is, rather than moving focus. */}
              {outcome === 'invalid' ? (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm"
                >
                  <p className="flex items-center gap-2 font-semibold text-destructive">
                    <TriangleAlert aria-hidden className="h-4 w-4" />
                    The server rejected this
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Receiving hours cannot end before they start. Everything you
                    typed is still here.
                  </p>
                </div>
              ) : null}

              {outcome === 'conflict' ? (
                <div
                  role="alert"
                  className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm"
                >
                  <p className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
                    <RefreshCw aria-hidden className="h-4 w-4" />
                    Sam Okafor saved this two minutes ago
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Their version has closing at 20:00. This is not a validation
                    error — pick which one survives.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCloses('20:00')
                        setOutcome('idle')
                      }}
                      className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Load their version
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutcome('idle')}
                      className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Keep mine and overwrite
                    </button>
                  </div>
                </div>
              ) : null}

              {outcome === 'saved' ? (
                <p
                  role="status"
                  className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm font-medium text-emerald-700 dark:text-emerald-400"
                >
                  Saved. The modal stays open so you can check the values.
                </p>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`${uid}-opens`} className="block text-sm font-medium">
                    Opens
                  </label>
                  <input
                    id={`${uid}-opens`}
                    type="time"
                    value={opens}
                    onChange={(e) => setOpens(e.target.value)}
                    className={`mt-1.5 ${INPUT_CLASS}`}
                  />
                </div>
                <div>
                  <label htmlFor={`${uid}-closes`} className="block text-sm font-medium">
                    Closes
                  </label>
                  <input
                    id={`${uid}-closes`}
                    type="time"
                    value={closes}
                    onChange={(e) => setCloses(e.target.value)}
                    className={`mt-1.5 ${INPUT_CLASS}`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`${uid}-contact`} className="block text-sm font-medium">
                  Goods-in contact
                </label>
                <input
                  id={`${uid}-contact`}
                  type="email"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className={`mt-1.5 ${INPUT_CLASS}`}
                />
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-border p-4">
              <button
                type="button"
                disabled={busy}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                {busy ? (
                  <Loader2 aria-hidden className="h-4 w-4 motion-safe:animate-spin" />
                ) : null}
                {busy ? 'Saving…' : 'Save changes'}
              </button>
            </footer>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setOpen(true)
            setOutcome('idle')
          }}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Reopen the edit modal
        </button>
      )}
    </section>
  )
}
