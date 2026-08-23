'use client'

/**
 * <ConfirmDialog> — the "are you sure" for something you cannot undo.
 *
 * Built on the native `<dialog>` element and `showModal()`, which is the
 * reason this is short. The browser gives you, for free, the four things a
 * hand-rolled modal spends a hundred lines getting wrong: a focus trap, the
 * top layer (so no `z-index` can cover it), inertness of the page behind,
 * and Escape-to-close.
 *
 * What is left to do by hand, and is done here:
 *
 *  - `aria-labelledby` / `aria-describedby` on the dialog, so it announces
 *    as its title and body rather than as an unlabelled group.
 *  - Escape is intercepted while a destructive action is in flight. The
 *    browser's default cancel would close the dialog mid-request and leave
 *    the user unsure whether the delete happened.
 *  - A backdrop click closes it — native `<dialog>` does not do this. The
 *    check is on the event target being the dialog itself, which works
 *    because the backdrop's clicks are reported against the dialog element
 *    while the content sits in a child.
 *  - Focus is placed on Cancel, not Delete. The safe option is the default
 *    for the same reason a "Save changes?" prompt does not focus Discard.
 *
 * Destructive styling is `bg-destructive`, and the word is the verb —
 * "Delete project", not "OK". A confirm dialog whose buttons say OK and
 * Cancel makes the reader re-read the sentence to work out which is which.
 */

import * as React from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

export interface ConfirmDialogProps {
  triggerLabel?: string
  title?: string
  description?: string
  /** The verb, repeated on the button. Never "OK". */
  confirmLabel?: string
  cancelLabel?: string
  /** Type-to-confirm guard. When set, the button unlocks only on an exact match. */
  confirmPhrase?: string
  onConfirm?: () => void | Promise<void>
  className?: string
}

export function ConfirmDialog({
  triggerLabel = 'Delete project',
  title = 'Delete this project?',
  description =
    'This removes the project, its deployments and its logs. Team members lose access immediately. This cannot be undone.',
  confirmLabel = 'Delete project',
  cancelLabel = 'Cancel',
  confirmPhrase = 'acme-web',
  onConfirm,
  className = '',
}: ConfirmDialogProps) {
  // Per-instance ids. A literal id in a reusable component is a
  // collision waiting for the second copy on the page — and a <label>
  // then resolves to whichever input rendered first.
  const uid = React.useId()
  const dialogRef = React.useRef<HTMLDialogElement>(null)
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  const [typed, setTyped] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  const unlocked = !confirmPhrase || typed === confirmPhrase

  function open() {
    setTyped('')
    dialogRef.current?.showModal()
    // Focus the safe action, not the destructive one.
    requestAnimationFrame(() => cancelRef.current?.focus())
  }

  function close() {
    if (busy) return
    dialogRef.current?.close()
  }

  async function confirm() {
    if (!unlocked || busy) return
    setBusy(true)
    try {
      await (onConfirm?.() ?? new Promise((r) => setTimeout(r, 900)))
      dialogRef.current?.close()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`flex justify-center p-10 ${className}`}>
      <button
        type="button"
        onClick={open}
        className="inline-flex h-11 items-center rounded-xl bg-destructive px-5 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {triggerLabel}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`${uid}-confirm-title`}
        aria-describedby={`${uid}-confirm-description`}
        // The browser fires `cancel` for Escape. Blocking it while a
        // request is in flight keeps the dialog up until the outcome is
        // known, rather than leaving the user guessing.
        onCancel={(e) => {
          if (busy) e.preventDefault()
        }}
        // Native <dialog> reports backdrop clicks against the dialog itself;
        // clicks on the content hit a child, so this only fires outside.
        onClick={(e) => {
          if (e.target === dialogRef.current) close()
        }}
        className="max-w-md rounded-2xl border border-border/60 bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div className="p-6">
          <div className="flex gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle aria-hidden className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 id={`${uid}-confirm-title`} className="text-base font-semibold">
                {title}
              </h2>
              <p id={`${uid}-confirm-description`} className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          </div>

          {confirmPhrase ? (
            <div className="mt-5">
              <label htmlFor={`${uid}-confirm-phrase`} className="block text-sm text-muted-foreground">
                Type <span className="font-mono font-semibold text-foreground">{confirmPhrase}</span>{' '}
                to confirm
              </label>
              <input
                id={`${uid}-confirm-phrase`}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                className="mt-1.5 h-10 w-full rounded-lg border border-border/60 bg-card/60 px-3 font-mono text-sm focus:border-destructive/50 focus:outline-none focus:ring-2 focus:ring-destructive/20"
              />
            </div>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              ref={cancelRef}
              type="button"
              onClick={close}
              disabled={busy}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border/60 px-4 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={!unlocked || busy}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-destructive px-4 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2
                    aria-hidden
                    className="h-4 w-4 animate-spin motion-reduce:[animation-duration:1.6s]"
                  />
                  Deleting
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
