'use client'

/**
 * <ToolCall> — one tool invocation: what was called, how it went, and the
 * arguments and result one click away.
 *
 * The catalog's `<AgentToolCalls>` block is a *list* of these with the
 * grouping and density decisions already made. This is the single row, for
 * when the list is yours and the shape of a call is what you needed.
 *
 * **The status is never colour alone.** Every chip carries a glyph and an
 * `sr-only` word alongside the tint. "Which of these failed", answered only
 * in red, is not answered at all for roughly one man in twelve — and not
 * for anyone reading the thread in a transcript.
 *
 * **It is a button, not `<details>`.** Its sibling `<ReasoningPanel>` uses
 * the native element and is the better default; this one cannot, because
 * the open state is frequently driven from outside — auto-expanding the
 * call that errored, collapsing every call when a new run starts — and a
 * controlled `<details>` fights its own `toggle` event. So: `aria-expanded`,
 * `aria-controls`, and a real controlled/uncontrolled pair.
 *
 * **Arguments are a `<dl>`, not a table.** The shape is genuinely a list of
 * name/value pairs. A two-column table makes a screen reader user navigate
 * by row and column through something that has neither.
 *
 * **The duration is formatted arithmetically**, never through
 * `toLocaleString`. A number formatted against the server's locale and then
 * re-formatted against the browser's is a hydration mismatch that only
 * appears for users outside the build machine's locale.
 */

import * as React from 'react'
import { Check, ChevronDown, Clock, Loader2, TriangleAlert } from 'lucide-react'

export type ToolCallStatus = 'pending' | 'running' | 'success' | 'error'

export interface ToolCallProps {
  /** The tool's name, as the model called it. */
  name: string
  status: ToolCallStatus
  /** One line of context for the collapsed row — usually the key argument. */
  summary?: string
  /** Rendered as a definition list when given an object. */
  args?: Record<string, React.ReactNode> | React.ReactNode
  result?: React.ReactNode
  durationMs?: number
  /** Controlled disclosure. Omit for uncontrolled. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
  className?: string
}

const STATUS: Record<ToolCallStatus, { label: string; tint: string; Icon: typeof Check }> = {
  pending: { label: 'Queued', tint: 'text-muted-foreground', Icon: Clock },
  running: { label: 'Running', tint: 'text-sky-600 dark:text-sky-400', Icon: Loader2 },
  success: { label: 'Succeeded', tint: 'text-emerald-600 dark:text-emerald-400', Icon: Check },
  error: { label: 'Failed', tint: 'text-destructive', Icon: TriangleAlert },
}

/** `1420` → `1.4s`. No locale involved, so it cannot drift at hydration. */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  const seconds = ms / 1000
  return seconds < 10 ? `${seconds.toFixed(1)}s` : `${Math.round(seconds)}s`
}

function isPairs(value: unknown): value is Record<string, React.ReactNode> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !React.isValidElement(value) &&
    !Array.isArray(value)
  )
}

export function ToolCall({
  name,
  status,
  summary,
  args,
  result,
  durationMs,
  open,
  onOpenChange,
  defaultOpen = false,
  className = '',
}: ToolCallProps) {
  const uid = React.useId()
  const [internal, setInternal] = React.useState(defaultOpen)
  const isOpen = open ?? internal
  const expandable = args !== undefined || result !== undefined

  const toggle = () => {
    const next = !isOpen
    if (open === undefined) setInternal(next)
    onOpenChange?.(next)
  }

  const { label, tint, Icon } = STATUS[status]

  return (
    <div
      className={['overflow-hidden rounded-lg border border-border bg-card', className]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        onClick={toggle}
        disabled={!expandable}
        aria-expanded={expandable ? isOpen : undefined}
        aria-controls={expandable ? `${uid}-panel` : undefined}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-start text-sm hover:bg-muted/60 disabled:cursor-default disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      >
        <Icon
          aria-hidden="true"
          className={[
            'size-4 shrink-0',
            tint,
            status === 'running' ? 'motion-safe:animate-spin' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />
        <span className="sr-only">{label}: </span>

        <code className="min-w-0 shrink-0 font-mono text-[13px] font-medium text-foreground">
          {name}
        </code>

        {summary ? (
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{summary}</span>
        ) : (
          <span className="flex-1" />
        )}

        {durationMs !== undefined ? (
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatDuration(durationMs)}
          </span>
        ) : null}

        {expandable ? (
          <ChevronDown
            aria-hidden="true"
            className={[
              'size-4 shrink-0 text-muted-foreground transition-transform',
              isOpen ? 'rotate-180' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
        ) : null}
      </button>

      {expandable && isOpen ? (
        <div id={`${uid}-panel`} className="space-y-3 border-t border-border px-3 py-2.5">
          {args !== undefined ? (
            <div>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Arguments
              </p>
              {isPairs(args) ? (
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                  {Object.entries(args).map(([key, value]) => (
                    <React.Fragment key={key}>
                      <dt className="font-mono text-muted-foreground">{key}</dt>
                      <dd className="min-w-0 break-words font-mono text-foreground">{value}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              ) : (
                <div className="text-xs text-foreground">{args}</div>
              )}
            </div>
          ) : null}

          {result !== undefined ? (
            <div>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Result
              </p>
              <div
                className={[
                  'rounded-md px-2.5 py-2 text-xs',
                  status === 'error'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-foreground',
                ].join(' ')}
              >
                {result}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
