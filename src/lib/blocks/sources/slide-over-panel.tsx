'use client'

/**
 * <SlideOverPanel> — a side sheet for editing a record without leaving the list.
 *
 * The reason to reach for one over a route: the context behind it is the
 * point. Editing a row in a table is much easier when the table is still
 * visible, and a full-page form loses that.
 *
 * Also built on native `<dialog>` + `showModal()`, so the focus trap, top
 * layer, page inertness and Escape all come from the browser rather than
 * from an effect hook. What that leaves is the animation, which is the one
 * thing `<dialog>` makes awkward:
 *
 *   A modal dialog is `display: none` when closed, and you cannot transition
 *   out of `display: none`. So the open state is driven by a data attribute
 *   set one frame after `showModal()`, and closing waits for `transitionend`
 *   before calling `close()`. `@starting-style` would remove the first half
 *   of that, but it is too new to rely on in copied code.
 *
 * The slide is gated behind `motion-safe:` — a full-height panel flying in
 * from the edge is exactly the movement `prefers-reduced-motion` is for, and
 * under `reduce` it simply appears.
 *
 * The footer is `sticky` inside a scrolling body, so Save never scrolls out
 * of reach on a long form — the single most common complaint about sheets.
 */

import * as React from 'react'
import { X } from 'lucide-react'

export interface SlideOverPanelProps {
  triggerLabel?: string
  title?: string
  description?: string
  saveLabel?: string
  cancelLabel?: string
  /** Panel content. Defaults to a small example form. */
  children?: React.ReactNode
  onSave?: () => void | Promise<void>
  className?: string
}

export function SlideOverPanel({
  triggerLabel = 'Edit customer',
  title = 'Edit customer',
  description = 'Changes apply immediately and are visible to everyone on the team.',
  saveLabel = 'Save changes',
  cancelLabel = 'Cancel',
  children,
  onSave,
  className = '',
}: SlideOverPanelProps) {
  // Per-instance ids. A literal id in a reusable component is a
  // collision waiting for the second copy on the page — and a <label>
  // then resolves to whichever input rendered first.
  const uid = React.useId()
  const dialogRef = React.useRef<HTMLDialogElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const [shown, setShown] = React.useState(false)

  function open() {
    dialogRef.current?.showModal()
    // One frame later, so the transition has a start value to move from.
    requestAnimationFrame(() => setShown(true))
  }

  const close = React.useCallback(() => {
    const panel = panelRef.current
    setShown(false)

    // If motion is reduced there is no transition to wait for, and
    // `transitionend` would never fire — close immediately instead of
    // leaving an invisible modal trapping focus.
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!panel || reduced) {
      dialogRef.current?.close()
      return
    }

    panel.addEventListener('transitionend', () => dialogRef.current?.close(), { once: true })
  }, [])

  async function save() {
    await (onSave?.() ?? Promise.resolve())
    close()
  }

  return (
    <div className={`flex justify-center p-10 ${className}`}>
      <button
        type="button"
        onClick={open}
        className="inline-flex h-11 items-center rounded-xl border border-border/60 bg-card/60 px-5 text-sm font-semibold transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {triggerLabel}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`${uid}-slideover-title`}
        aria-describedby={`${uid}-slideover-description`}
        onCancel={(e) => {
          // Take over Escape so it runs the same exit transition as the
          // buttons rather than snapping shut.
          e.preventDefault()
          close()
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) close()
        }}
        // The dialog itself is the full-screen surface; the panel inside is
        // what slides. `ms-auto` pins it to the right edge.
        className="m-0 h-full max-h-full w-full max-w-full bg-transparent p-0 text-foreground backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div
          ref={panelRef}
          data-shown={shown ? '' : undefined}
          className="ms-auto flex h-full w-full max-w-md flex-col border-s border-border/60 bg-background shadow-2xl motion-safe:translate-x-full motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:data-shown:translate-x-0"
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border/60 p-5">
            <div className="min-w-0">
              <h2 id={`${uid}-slideover-title`} className="text-base font-semibold">
                {title}
              </h2>
              <p id={`${uid}-slideover-description`} className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close panel"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">{children ?? <ExampleFields />}</div>

          {/* Sticky, so Save is reachable without scrolling a long form. */}
          <div className="sticky bottom-0 flex shrink-0 justify-end gap-2 border-t border-border/60 bg-background/95 p-5 backdrop-blur">
            <button
              type="button"
              onClick={close}
              className="inline-flex h-10 items-center rounded-lg border border-border/60 px-4 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={save}
              className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {saveLabel}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}

/** Placeholder body — replace with your own form. */
function ExampleFields() {
  // Per-instance ids. A literal id in a reusable component is a
  // collision waiting for the second copy on the page — and a <label>
  // then resolves to whichever input rendered first.
  const uid = React.useId()
  return (
    <div className="space-y-4">
      {[
        { id: 'so-name', label: 'Name', value: 'Ada Lovelace', type: 'text' },
        { id: 'so-email', label: 'Email', value: 'ada@acme.com', type: 'email' },
        { id: 'so-company', label: 'Company', value: 'Acme Inc', type: 'text' },
      ].map((field) => (
        <div key={field.id}>
          <label htmlFor={`${uid}-${field.id}`} className="block text-sm font-medium">
            {field.label}
          </label>
          <input
            id={`${uid}-${field.id}`}
            type={field.type}
            defaultValue={field.value}
            className="mt-1.5 h-11 w-full rounded-xl border border-border/60 bg-card/60 px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
      ))}

      <div>
        <label htmlFor={`${uid}-so-notes`} className="block text-sm font-medium">
          Notes
        </label>
        <textarea
          id={`${uid}-so-notes`}
          rows={5}
          className="mt-1.5 w-full resize-y rounded-xl border border-border/60 bg-card/60 px-3 py-2.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>
    </div>
  )
}
