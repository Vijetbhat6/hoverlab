/**
 * <TypingIndicator> — the gap between sending a prompt and the first token.
 *
 * A model can take fifteen seconds to say anything, and fifteen seconds of
 * an empty thread is indistinguishable from a dropped request. This is what
 * fills it — and it is almost always built wrong in two specific ways.
 *
 * **The animation is `motion-safe:` and nothing else is.** An infinite
 * bounce with no `prefers-reduced-motion` escape is a 2.2.2 failure and a
 * genuine vestibular trigger; a reader who has asked their OS for less
 * motion gets three static dots here. What they do *not* lose is the
 * information, because the information was never in the movement — it is in
 * the label, which is always present.
 *
 * **The dots are `aria-hidden` and the label is the live region.** The
 * instinct is to drop `aria-live` on the whole thing, which then announces
 * a decorative animation, or on nothing, which announces no wait at all.
 * `role="status"` on the wrapper with the words in `sr-only` says "Assistant
 * is typing" once, politely, and never interrupts the user mid-sentence.
 *
 * A note on what this is *not*: it does not count. `<AgentWorkingIndicator>`
 * in the blocks tier does, and for waits over a few seconds a ticking
 * elapsed time is the honest answer — a spinner keeps spinning after the
 * socket dies. This is the short-wait version.
 */

import * as React from 'react'

export interface TypingIndicatorProps {
  /**
   * `dots` for a pending turn, `shimmer` for a message skeleton, `pulse`
   * for a single quiet glyph beside existing text.
   */
  variant?: 'dots' | 'shimmer' | 'pulse'
  /** Announced politely. Say who, not just that something is happening. */
  label?: string
  /** Draws the dots inside a bubble matching `<MessageBubble role="assistant">`. */
  bubble?: boolean
  className?: string
}

const DOT_DELAYS = ['0ms', '150ms', '300ms']

export function TypingIndicator({
  variant = 'dots',
  label = 'Assistant is typing',
  bubble = false,
  className = '',
}: TypingIndicatorProps) {
  const body =
    variant === 'shimmer' ? (
      <span aria-hidden="true" className="flex w-full flex-col gap-2">
        {/*
         * `bg-muted-foreground/20`, not `bg-muted`. A skeleton bar sits
         * inside an assistant bubble as often as on a card, and that bubble
         * is itself `bg-muted` — a bar of the same token on the same token
         * is a correctly-rendered invisible component, which typechecks,
         * lints, and passes every test that does not open a browser.
         */}
        <span className="h-2.5 w-4/5 rounded-full bg-muted-foreground/20 motion-safe:animate-pulse" />
        <span className="h-2.5 w-3/5 rounded-full bg-muted-foreground/20 motion-safe:animate-pulse" />
      </span>
    ) : variant === 'pulse' ? (
      <span
        aria-hidden="true"
        className="size-2 rounded-full bg-muted-foreground motion-safe:animate-pulse"
      />
    ) : (
      <span aria-hidden="true" className="flex items-center gap-1">
        {DOT_DELAYS.map((delay) => (
          <span
            key={delay}
            style={{ animationDelay: delay }}
            className="size-1.5 rounded-full bg-muted-foreground motion-safe:animate-bounce"
          />
        ))}
      </span>
    )

  return (
    <span
      role="status"
      aria-live="polite"
      className={[
        'inline-flex items-center',
        variant === 'shimmer' ? 'w-full' : '',
        bubble ? 'rounded-2xl rounded-ss-sm bg-muted px-3.5 py-3' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {body}
      <span className="sr-only">{label}</span>
    </span>
  )
}
