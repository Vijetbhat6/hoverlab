'use client'

/**
 * <Dialog> — a modal window, built on the native `<dialog>` element.
 *
 * `showModal()` does the hard parts of a modal for free and does them
 * correctly: it makes everything behind the dialog inert (so Tab cannot walk
 * into the page underneath), it traps focus, it puts the dialog in the top
 * layer above every z-index, and Escape closes it. Nearly every hand-rolled
 * modal reimplements those four things worse, so this one does not.
 *
 * What the browser does NOT do, and this component adds:
 *
 *  - The page behind still scrolls under a wheel or a swipe. Scroll is locked
 *    on the root element while it is open and restored to whatever it was, so
 *    two dialogs (or a page that had already set overflow) do not fight.
 *  - Clicking the backdrop closes it. A click on the `<dialog>` element ITSELF
 *    is a click outside its content, because the content fills the box with
 *    its own padding and the dialog has none. That is why the padding lives on
 *    an inner div.
 *  - `open` is controlled state. Escape closes the element natively, so the
 *    `close` event is what reports it back through `onOpenChange`; without
 *    that, the parent still thinks it is open and the next "open" does nothing.
 *
 * `role="alertdialog"` is for a confirmation the user must answer, such as a
 * delete. It drops the backdrop dismiss by default (`dismissible` false),
 * because clicking away from "Delete this project?" should not count as an
 * answer. Focus lands on the first focusable element in the dialog, so put the
 * safe action (Cancel) first in the footer's tab order.
 *
 * Tailwind's preflight resets `margin` to 0 on every element, including
 * `<dialog>`, whose browser default is `margin: auto` — the thing that
 * centres it. `m-auto` restores it; without it the dialog sits top-left.
 */

import * as React from 'react'
import { X } from 'lucide-react'

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: React.ReactNode
  /** Usually the buttons. Rendered in a bar under the content. */
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  role?: 'dialog' | 'alertdialog'
  /** Whether a click on the backdrop closes it. Defaults to false for alertdialog. */
  dismissible?: boolean
  className?: string
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' } as const

let scrollLocks = 0
let previousOverflow = ''

function lockScroll() {
  if (scrollLocks++ === 0) {
    previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
  }
}
function unlockScroll() {
  if (--scrollLocks === 0) document.documentElement.style.overflow = previousOverflow
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  role = 'dialog',
  dismissible,
  className = '',
}: DialogProps) {
  const uid = React.useId()
  const ref = React.useRef<HTMLDialogElement>(null)
  const canDismiss = dismissible ?? role !== 'alertdialog'
  // `close()` reports back through the `close` event, one task later. When the
  // component itself closes the element (the parent set `open` false, or an
  // effect re-ran) that report is not news, and forwarding it would tell a
  // parent that had just re-opened us that we were closed.
  const closedByUs = React.useRef(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      el.showModal()
      lockScroll()
      return () => {
        unlockScroll()
        if (el.open) {
          closedByUs.current = true
          el.close()
        }
      }
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      role={role === 'alertdialog' ? 'alertdialog' : undefined}
      aria-labelledby={`${uid}-title`}
      aria-describedby={description ? `${uid}-desc` : undefined}
      // Escape and close() both land here; report it so state stays true.
      onClose={() => {
        if (closedByUs.current) {
          closedByUs.current = false
          return
        }
        onOpenChange(false)
      }}
      onClick={(e) => {
        if (canDismiss && e.target === e.currentTarget) onOpenChange(false)
      }}
      className={`m-auto w-[calc(100%-2rem)] ${SIZES[size]} rounded-2xl border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm ${className}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={`${uid}-title`} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          {role === 'dialog' ? (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="-m-1.5 shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        {description ? (
          <p id={`${uid}-desc`} className="mt-2 text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-4 text-sm">{children}</div> : null}
      </div>
      {footer ? (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-muted/40 px-6 py-4">
          {footer}
        </div>
      ) : null}
    </dialog>
  )
}
