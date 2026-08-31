'use client'

/**
 * <ModalUnsavedChanges> — the interception that stops work being lost.
 *
 * The catalog's confirm dialog guards a destructive action the user chose.
 * This guards a destructive outcome the user did *not* choose: closing a
 * form, following a link, hitting Escape, with edits still in the buffer.
 * It is the same shape and the opposite situation, and the difference
 * changes every word in it.
 *
 * THREE BUTTONS, NOT TWO
 *
 * A confirm dialog offers cancel and proceed. An unsaved-changes prompt has
 * a third answer — save and then leave — and it is the one most people
 * want. Products that ship only "Discard" and "Cancel" force the user to
 * cancel, find the save button, press it, then repeat the thing they were
 * originally doing. The default action here is Save and close.
 *
 * DISCARD IS NAMED AND STYLED AS DESTRUCTIVE
 *
 * Not "OK", not "Leave", not "Don't save". The button says what happens to
 * the work, and it carries the destructive colour — because the two
 * fast paths through a dialog are the default button and the one under the
 * cursor, and neither should quietly throw away twenty minutes.
 *
 * IT SAYS WHAT IS UNSAVED. A list of changed fields turns "are you sure"
 * into a decision that can actually be made. Three edits the user forgot
 * about is exactly why they are about to lose them.
 *
 * ACCESSIBILITY: `role="alertdialog"` rather than `dialog` — this
 * interrupts, and the distinction is what tells a screen reader to announce
 * it immediately. Focus moves to the dialog on open and returns to the
 * trigger on close, focus is trapped while open, and Escape resolves to
 * Cancel (the safe answer) rather than to the primary.
 */

import * as React from 'react'
import { AlertTriangle, Save, Trash2, X } from 'lucide-react'

export interface UnsavedChange {
  field: string
  from: string
  to: string
}

export interface ModalUnsavedChangesProps {
  changes?: UnsavedChange[]
  /** Open on first render — the preview needs the dialog, not the button. */
  defaultOpen?: boolean
  className?: string
}

const DEFAULT_CHANGES: UnsavedChange[] = [
  { field: 'Display name', from: 'Acme Corp', to: 'Acme Corporation Ltd' },
  { field: 'Billing email', from: 'ap@acme.com', to: 'accounts-payable@acme.com' },
  { field: 'Seat limit', from: '24', to: '40' },
]

export function ModalUnsavedChanges({
  changes = DEFAULT_CHANGES,
  defaultOpen = true,
  className = '',
}: ModalUnsavedChangesProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  const [outcome, setOutcome] = React.useState<string | null>(null)

  const dialogRef = React.useRef<HTMLDivElement>(null)
  const primaryRef = React.useRef<HTMLButtonElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  // Focus in on open, focus back on close. The second half is the one that
  // gets skipped, and it is what leaves a keyboard user at the top of the
  // document after every dialog.
  React.useEffect(() => {
    if (open) primaryRef.current?.focus()
    else triggerRef.current?.focus()
  }, [open])

  function close(reason: string) {
    setOutcome(reason)
    setOpen(false)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      // Escape means "I did not mean to do this", which is Cancel — never
      // Discard. A dialog where the panic key destroys work is a trap.
      event.stopPropagation()
      close('cancelled')
      return
    }

    if (event.key !== 'Tab') return

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    if (!focusable || focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className={`relative min-h-[26rem] rounded-2xl bg-muted/30 p-6 ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            setOutcome(null)
            setOpen(true)
          }}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Close the editor
        </button>
        {outcome ? (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            Last answer: <span className="font-medium text-foreground">{outcome}</span>
          </p>
        ) : null}
      </div>

      {open ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
          <div
            aria-hidden
            className="absolute inset-0 rounded-2xl bg-background/80 backdrop-blur-sm"
            onClick={() => close('cancelled')}
          />

          <div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="unsaved-title"
            aria-describedby="unsaved-body"
            onKeyDown={onKeyDown}
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10"
              >
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </span>
              <div className="min-w-0">
                <h2 id="unsaved-title" className="text-base font-semibold">
                  You have {changes.length} unsaved{' '}
                  {changes.length === 1 ? 'change' : 'changes'}
                </h2>
                <p id="unsaved-body" className="mt-1 text-sm text-muted-foreground">
                  Closing now discards them. Saving keeps them and closes the editor.
                </p>
              </div>
            </div>

            {/* Naming the changes is what makes this a decision rather than
                a guess. */}
            <dl className="mt-4 space-y-2 rounded-xl border border-border bg-muted/40 p-3">
              {changes.map((change) => (
                <div key={change.field} className="text-xs">
                  <dt className="font-medium">{change.field}</dt>
                  <dd className="mt-0.5 flex flex-wrap items-center gap-1.5 text-muted-foreground">
                    <span className="line-through">{change.from}</span>
                    <span aria-hidden>→</span>
                    <span className="font-medium text-foreground">{change.to}</span>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => close('cancelled')}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden className="h-4 w-4" />
                Keep editing
              </button>

              <button
                type="button"
                onClick={() => close('discarded')}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 aria-hidden className="h-4 w-4" />
                Discard changes
              </button>

              {/* The third button, and the default — see the header. */}
              <button
                ref={primaryRef}
                type="button"
                onClick={() => close('saved and closed')}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Save aria-hidden className="h-4 w-4" />
                Save and close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
