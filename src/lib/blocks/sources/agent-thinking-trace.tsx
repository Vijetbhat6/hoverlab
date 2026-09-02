/**
 * <AgentThinkingTrace> — the collapsible "thought for 12s" panel: what the
 * model considered, in order, expandable step by step.
 *
 * Two accessibility decisions carry this block.
 *
 * The outer summary is a real `<details>`/`<summary>`. Trace panels are the
 * classic case for it — a disclosure with no requirement to be controlled —
 * and using the element means the open state survives with JavaScript off,
 * responds to Enter and Space for free, and is exposed as a disclosure to
 * assistive tech without a single ARIA attribute.
 *
 * The steps are a different problem and get a different answer. Each one is
 * a button controlling its own region, because they need to be individually
 * expandable *and* individually addressable, and nested `<details>` inside
 * an open `<details>` gets announced as a disclosure inside a disclosure —
 * technically right, unbearable to listen to. So: `aria-expanded`,
 * `aria-controls`, and an ordered list, since the order is the meaning.
 *
 * Elapsed time is rendered as a `<time>` with a machine-readable `dateTime`,
 * not a bare string, and the status dots carry `sr-only` text — a coloured
 * ring is not a state for anyone who cannot see it.
 */

'use client'

import * as React from 'react'
import {
  Brain,
  ChevronRight,
  Code2,
  Database,
  FileSearch,
  Globe,
  ListChecks,
} from 'lucide-react'

export type ThinkingKind = 'plan' | 'search' | 'query' | 'code' | 'read'
export type ThinkingState = 'done' | 'active' | 'pending'

export interface ThinkingStep {
  id: string
  kind: ThinkingKind
  title: string
  /** The reasoning under the step, revealed when it is expanded. */
  detail: string
  state?: ThinkingState
  duration?: string
}

export interface AgentThinkingTraceProps {
  summary?: string
  elapsed?: string
  steps?: ThinkingStep[]
  /** Start with the trace open. */
  defaultOpen?: boolean
  className?: string
}

const KIND_ICON = {
  plan: ListChecks,
  search: Globe,
  query: Database,
  code: Code2,
  read: FileSearch,
} as const

const KIND_LABEL = {
  plan: 'Planning',
  search: 'Web search',
  query: 'Database',
  code: 'Code',
  read: 'Reading',
} as const

const DEFAULT_STEPS: ThinkingStep[] = [
  {
    id: 'plan',
    kind: 'plan',
    title: 'Decide what "churn" means here',
    detail:
      'The question is ambiguous between logo churn and revenue churn. Revenue churn is the one the finance dashboard reports, so I will use that and say so in the answer rather than asking and stalling.',
    state: 'done',
    duration: '0.4s',
  },
  {
    id: 'schema',
    kind: 'read',
    title: 'Check which tables carry cancellation dates',
    detail:
      'subscriptions.canceled_at is populated for 98% of rows; the gap is trials, which never had revenue attached. Excluding trials rather than imputing them.',
    state: 'done',
    duration: '1.1s',
  },
  {
    id: 'query',
    kind: 'query',
    title: 'Aggregate lost ARR by seat band',
    detail:
      'Grouped into <20, 20–99 and 100+ seats. The under-20 band is 6.1% against 1.4% elsewhere, which is large enough that I should check it is not one account before reporting it.',
    state: 'done',
    duration: '2.7s',
  },
  {
    id: 'verify',
    kind: 'code',
    title: 'Test whether one account explains the spike',
    detail:
      'Dropping the largest single cancellation moves the under-20 figure from 6.1% to 5.4%. The pattern holds, so it is a cohort effect and not an outlier.',
    state: 'active',
    duration: '0.9s',
  },
  {
    id: 'cite',
    kind: 'search',
    title: 'Pull exit-survey text for the same accounts',
    detail: 'Queued — will attach verbatim reasons to the three largest cancellations.',
    state: 'pending',
  },
]

const DOT = {
  done: 'bg-emerald-500',
  active: 'bg-primary motion-safe:animate-pulse',
  pending: 'bg-muted-foreground/40',
} as const

const DOT_LABEL = {
  done: 'Finished',
  active: 'In progress',
  pending: 'Not started',
} as const

export function AgentThinkingTrace({
  summary = 'Thought for 5.1 seconds',
  elapsed = '5.1s',
  steps = DEFAULT_STEPS,
  defaultOpen = true,
  className = '',
}: AgentThinkingTraceProps) {
  const [expanded, setExpanded] = React.useState<string[]>([steps[3]?.id ?? ''])

  function toggle(id: string) {
    setExpanded((open) => (open.includes(id) ? open.filter((x) => x !== id) : [...open, id]))
  }

  const baseId = React.useId()

  return (
    <div className={`mx-auto w-full max-w-2xl p-6 ${className}`}>
      <details
        open={defaultOpen}
        className="group overflow-hidden rounded-2xl border border-border/60 bg-card"
      >
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Brain aria-hidden className="h-3.5 w-3.5" />
          </span>

          <span className="text-sm font-medium">{summary}</span>

          <time dateTime={`PT${elapsed.replace('s', 'S')}`} className="sr-only">
            {elapsed}
          </time>

          <span className="ms-auto text-xs text-muted-foreground">{steps.length} steps</span>

          <ChevronRight
            aria-hidden
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
          />
        </summary>

        <ol className="border-t border-border/60 px-4 py-3">
          {steps.map((step, i) => {
            const state = step.state ?? 'done'
            const Icon = KIND_ICON[step.kind]
            const open = expanded.includes(step.id)
            const panelId = `${baseId}-${step.id}`
            const last = i === steps.length - 1

            return (
              <li key={step.id} className="relative ps-7">
                {/* The rail is drawn per step and stops on the last one, so
                    it does not trail off under nothing. */}
                {last ? null : (
                  <span
                    aria-hidden
                    className="absolute left-[7px] top-6 h-[calc(100%-1rem)] w-px bg-border"
                  />
                )}

                <span
                  aria-hidden
                  className={`absolute left-1 top-[15px] h-2 w-2 rounded-full ring-4 ring-card ${DOT[state]}`}
                />

                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => toggle(step.id)}
                  className="flex w-full items-center gap-2.5 rounded-lg py-2 ps-1 pe-2 text-start transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

                  <span className="min-w-0 flex-1 truncate text-sm">
                    <span className="sr-only">
                      {KIND_LABEL[step.kind]}, {DOT_LABEL[state]}:{' '}
                    </span>
                    {step.title}
                  </span>

                  {step.duration ? (
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                      {step.duration}
                    </span>
                  ) : null}

                  <ChevronRight
                    aria-hidden
                    className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
                      open ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {/* Unmounted when closed rather than hidden with CSS — a
                    `display: none` panel is still in the accessibility tree
                    in enough readers to matter. */}
                {open ? (
                  <div
                    id={panelId}
                    className="mb-1 ms-1 rounded-lg border-s-2 border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground"
                  >
                    {step.detail}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ol>
      </details>
    </div>
  )
}
