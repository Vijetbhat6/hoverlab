'use client'

/**
 * <BottomSheetMobile> — the drawer that comes up from the bottom.
 *
 * Modals & Drawers had the confirm dialog, the cookie banner, a
 * side slide-over, the faceted filter drawer and the share dialog. Every
 * one of them is a desktop shape scaled down. On a phone, the pattern
 * people actually meet a dozen times a day is the sheet that rises from
 * the bottom edge, and none of the five was it.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * Snap points are a scroll problem, not an animation problem. A sheet at
 * its half height whose content is taller than the gap must scroll *its
 * own* content, and the page behind it must not scroll at all — get that
 * wrong and dragging inside the sheet quietly moves the list underneath,
 * which is the single most common bug in hand-rolled sheets. The content
 * region owns the overflow; `overscroll-contain` stops the scroll chain
 * reaching the body; and expanding to full height is what changes how
 * much is visible, not a taller inner box.
 *
 * THE HANDLE IS NOT THE ONLY WAY OUT
 *
 * A drag affordance is invisible to a keyboard and to a screen reader.
 * The handle is a real button that toggles the snap point and says which
 * one it will move to; Escape closes; the backdrop closes; and there is a
 * visible close control, because a sheet whose only dismissal is a
 * gesture strands anyone who cannot make it.
 *
 * THE BOTTOM EDGE IS NOT THE BOTTOM OF THE SCREEN
 *
 * `env(safe-area-inset-bottom)` is why the last row is reachable on a
 * phone with a home indicator. It costs one line and is missing from most
 * implementations, where the final button sits under the system gesture
 * bar and cannot be pressed.
 *
 * ACCESSIBILITY: `role="dialog"` + `aria-modal`, labelled by its heading,
 * focus moved in on open and returned to the trigger on close, and a
 * focus trap so Tab cannot walk into the page behind it.
 */

import * as React from 'react'
import { Check, ChevronUp, X } from 'lucide-react'

export interface SheetOption {
  id: string
  label: string
  hint?: string
}

export interface BottomSheetMobileProps {
  title?: string
  options?: SheetOption[]
  className?: string
}

const DEFAULT_OPTIONS: SheetOption[] = [
  { id: 'relevance', label: 'Most relevant', hint: 'Default' },
  { id: 'newest', label: 'Newest first' },
  { id: 'price-low', label: 'Price: low to high' },
  { id: 'price-high', label: 'Price: high to low' },
  { id: 'rating', label: 'Best rated', hint: 'Four stars and up' },
  { id: 'distance', label: 'Nearest to me', hint: 'Needs location access' },
]

export function BottomSheetMobile({
  title = 'Sort and filter',
  options = DEFAULT_OPTIONS,
  className = '',
}: BottomSheetMobileProps) {
  /* Open by default: a sheet demo whose interesting state is shut is a
     screenshot of a button. */
  const [open, setOpen] = React.useState(true)
  const [expanded, setExpanded] = React.useState(false)
  const [chosen, setChosen] = React.useState('relevance')

  const sheetRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (!open) {
      triggerRef.current?.focus()
      return
    }
    sheetRef.current?.focus()

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        return
      }
      if (event.key !== 'Tab' || !sheetRef.current) return
      /* Trap: without this, Tab walks into the page the sheet is covering. */
      const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <section className={`mx-auto w-full max-w-sm px-4 py-16 sm:px-6 ${className}`}>
      {/*
        A phone-shaped frame, because a bottom sheet only makes sense
        against an edge. `relative` + `overflow-hidden` make this element
        the sheet's viewport instead of the page.
      */}
      <div className="relative h-[520px] overflow-hidden rounded-[2rem] border border-border bg-background shadow-sm">
        <div className="space-y-3 p-5">
          <div className="h-3 w-24 rounded-full bg-muted" />
          <div className="h-3 w-40 rounded-full bg-muted" />
          <div className="h-28 rounded-xl bg-muted/60" />
          <div className="h-3 w-32 rounded-full bg-muted" />
          <div className="h-28 rounded-xl bg-muted/60" />
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {title}
          </button>
        </div>

        {open ? (
          <>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-foreground/40 motion-safe:animate-in motion-safe:fade-in"
            />

            <div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="sheet-title"
              tabIndex={-1}
              className={`absolute inset-x-0 bottom-0 flex flex-col rounded-t-2xl border-t border-border bg-card shadow-lg outline-none transition-[height] duration-300 ${
                expanded ? 'h-[92%]' : 'h-[58%]'
              }`}
              /* The line that makes the last row reachable on a phone. */
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              {/* The handle is a button, not a decorative bar. */}
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="group flex w-full shrink-0 flex-col items-center gap-1 rounded-t-2xl px-4 pb-1 pt-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  aria-hidden
                  className="h-1 w-10 rounded-full bg-muted-foreground/40 transition group-hover:bg-muted-foreground/70"
                />
                <span className="sr-only">
                  {expanded ? 'Collapse the sheet to half height' : 'Expand the sheet to full height'}
                </span>
              </button>

              <header className="flex shrink-0 items-center gap-2 px-5 pb-3 pt-1">
                <h2 id="sheet-title" className="min-w-0 flex-1 text-base font-semibold text-foreground">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronUp
                    aria-hidden
                    className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  />
                  {expanded ? 'Half' : 'Full'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close sort and filter"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X aria-hidden className="h-4 w-4" />
                </button>
              </header>

              {/*
                The content owns the scroll, and `overscroll-contain` stops
                the chain reaching the page behind. This is the bug in most
                hand-built sheets.
              */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3">
                <ul role="radiogroup" aria-labelledby="sheet-title" className="space-y-0.5 pb-2">
                  {options.map((option) => {
                    const selected = option.id === chosen
                    return (
                      <li key={option.id}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setChosen(option.id)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            selected ? 'bg-primary/10' : 'hover:bg-muted'
                          }`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-foreground">
                              {option.label}
                            </span>
                            {option.hint ? (
                              <span className="block text-xs text-muted-foreground">
                                {option.hint}
                              </span>
                            ) : null}
                          </span>
                          {selected ? (
                            <Check aria-hidden className="h-4 w-4 shrink-0 text-primary" />
                          ) : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div className="shrink-0 border-t border-border p-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-10 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Show results
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}
