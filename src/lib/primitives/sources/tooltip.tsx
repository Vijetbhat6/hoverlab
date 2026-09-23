'use client'

/**
 * <Tooltip> — a short label for a control, shown on hover AND on keyboard
 * focus.
 *
 * A tooltip is easy to draw and easy to get wrong, and the ways to get it
 * wrong are exactly what WCAG 1.4.13 (content on hover or focus) lists:
 *
 *  - DISMISSIBLE. Escape hides it without moving focus, so a tooltip that is
 *    covering something the user needs to read can be got out of the way.
 *  - HOVERABLE. The pointer can travel from the trigger onto the tooltip
 *    without it vanishing, because the hover area is one wrapper around both
 *    — including the gap between them, which is padding rather than margin,
 *    and the tip itself, which takes pointer events. A tooltip that
 *    disappears the moment you try to read a long one is the most common
 *    failure. (The first version of this file set `pointer-events-none` on the
 *    tip, which made the pointer pass straight through it and close it; a test
 *    that moves the mouse onto the tip is what caught that.)
 *  - PERSISTENT. It stays until the pointer leaves, focus leaves, or Escape —
 *    not on a timer.
 *
 * The description is wired with `aria-describedby`, ALWAYS present and
 * pointing at the `role="tooltip"` element, so a screen reader announces the
 * tip when the control takes focus whether or not it is drawn. The tip is
 * hidden with `invisible`, not `hidden`, because a description that is
 * `display: none` is dropped from the accessibility tree.
 *
 * It shows on `:focus-visible`, not on every focus. Clicking a button with a
 * mouse focuses it too, and a tooltip that pops up on every click is noise.
 *
 * WHAT A TOOLTIP IS NOT FOR: anything essential. There is no hover on a phone.
 * Use it for the name of an icon-only button or a one-line hint; if the
 * information is needed to use the control, put it on the page.
 *
 * `children` must be ONE element that can take focus (a button, a link) — the
 * ref-less `aria-describedby` is added to it with `cloneElement`. It is not
 * portalled, so an `overflow: hidden` ancestor will clip it.
 */

import * as React from 'react'

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement<{ 'aria-describedby'?: string }>
  side?: 'top' | 'bottom' | 'start' | 'end'
  /** Milliseconds of hover before it appears. Focus is immediate. */
  delay?: number
  className?: string
}

/*
 * The gap between trigger and tip is PADDING on the positioned wrapper, not a
 * margin. A margin is outside the element, so a pointer travelling from the
 * trigger to the tip crosses a strip that belongs to neither, the wrapper's
 * mouseleave fires, and the tip vanishes just before it can be read — the
 * "hoverable" failure. Padding is inside the hover area, so the strip counts.
 *
 * `left-1/2 -translate-x-1/2` is the centring idiom: it centres in either
 * direction, so it is deliberately physical.
 */
const POSITION = {
  top: 'bottom-full pb-2 left-1/2 -translate-x-1/2',
  bottom: 'top-full pt-2 left-1/2 -translate-x-1/2',
  start: 'end-full pe-2 top-1/2 -translate-y-1/2',
  end: 'start-full ps-2 top-1/2 -translate-y-1/2',
} as const

export function Tooltip({ content, children, side = 'top', delay = 400, className = '' }: TooltipProps) {
  const id = React.useId()
  const [open, setOpen] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const show = (afterMs: number) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(true), afterMs)
  }
  const hide = () => {
    clearTimeout(timer.current)
    setOpen(false)
  }
  React.useEffect(() => () => clearTimeout(timer.current), [])

  // Escape has to work while the tip is open by HOVER, when focus is not on the
  // trigger — so the listener is on the document, not on the wrapper (whose
  // keydown only fires for a focused descendant). It exists only while open.
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => show(delay)}
      onMouseLeave={hide}
      onFocus={(e) => {
        if ((e.target as HTMLElement).matches(':focus-visible')) show(0)
      }}
      onBlur={hide}
    >
      {React.cloneElement(children, { 'aria-describedby': id })}
      {/*
        Two layers on purpose. The outer one is the hover area — positioned,
        padded to bridge the gap, and NOT `pointer-events-none`, so a pointer
        resting on the tip is still inside the wrapper. `invisible` (visibility:
        hidden) is what keeps it from catching the mouse while it is shut. The
        inner one is what is drawn, and what carries the role and the fade.
      */}
      <span className={`absolute z-50 ${POSITION[side]} ${open ? 'visible' : 'invisible'}`}>
        <span
          id={id}
          role="tooltip"
          className={`block w-max max-w-64 rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-lg transition-opacity duration-150 motion-reduce:transition-none ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {content}
        </span>
      </span>
    </span>
  )
}
