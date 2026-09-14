/**
 * <ReasoningPanel> — the "Thought for 12s" disclosure above an answer.
 *
 * **It is a real `<details>`, and that is the whole design.** A reasoning
 * trace is the textbook case for the native element: a disclosure with no
 * requirement to be controlled from anywhere else. Using it means the open
 * state survives with JavaScript disabled, Enter and Space work without a
 * handler, the browser exposes it as a disclosure to assistive tech with
 * no ARIA at all, and — the reason it matters here — **this component has
 * no state, so it needs no `'use client'`**. It renders on the server, in
 * the same pass as the message it sits above.
 *
 * Its sibling `<ToolCall>` deliberately does the opposite, with an
 * `aria-expanded` button, because that one does need to be opened from
 * outside. Two disclosures, two mechanisms, each for a stated reason.
 *
 * **The steps are an `<ol>`.** The order is the meaning — step three
 * follows from step two — and an unordered list throws that away.
 *
 * **The chevron points down, not right.** A rotating right-chevron is the
 * usual choice and it drags an RTL problem in with it: the closed state has
 * to mirror, the open state must not, and two rotate utilities on one
 * element fight. Down-to-up rotates on the axis the reading direction has
 * no opinion about, so there is nothing to mirror.
 *
 * **Nothing here is a live region.** While a trace is streaming, the tokens
 * are already being announced by the thread's own `role="log"`. A second
 * live region over the same text reads it twice.
 */

import * as React from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'

export interface ReasoningPanelProps {
  /** Seconds spent thinking. Rendered as "Thought for 12s". */
  seconds?: number
  /** Replaces the generated summary text entirely. */
  label?: string
  /** Rendered as an ordered list. Use `children` for richer content. */
  steps?: React.ReactNode[]
  /** Dims the label and marks the trace as still arriving. */
  streaming?: boolean
  defaultOpen?: boolean
  className?: string
  children?: React.ReactNode
}

export function ReasoningPanel({
  seconds,
  label,
  steps,
  streaming = false,
  defaultOpen = false,
  className = '',
  children,
}: ReasoningPanelProps) {
  const summary =
    label ??
    (streaming
      ? 'Thinking…'
      : seconds !== undefined
        ? `Thought for ${seconds}s`
        : 'Reasoning')

  return (
    <details
      open={defaultOpen || undefined}
      className={['group rounded-lg border border-border bg-muted/40', className]
        .filter(Boolean)
        .join(' ')}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
        <Sparkles
          aria-hidden="true"
          className={[
            'size-3.5 shrink-0',
            streaming ? 'motion-safe:animate-pulse' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />
        <span className="flex-1 font-medium">{summary}</span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-border px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">
        {steps && steps.length > 0 ? (
          <ol className="space-y-2">
            {steps.map((step, index) => (
              <li key={index} className="flex gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-border text-[10px] font-medium tabular-nums text-muted-foreground"
                >
                  {index + 1}
                </span>
                <span className="min-w-0">{step}</span>
              </li>
            ))}
          </ol>
        ) : null}
        {children}
      </div>
    </details>
  )
}
