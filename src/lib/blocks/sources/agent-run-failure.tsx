'use client'

/**
 * <AgentRunFailure> — the step that failed, and what the agent did about it.
 *
 * Agent Reasoning had the four surfaces of a run that is going well: the
 * plan, the thinking, the tool calls and the working indicator. Every one
 * of them is drawn for the happy path. This is the same trace after
 * something broke, which is the state people actually stare at.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * A step that failed and was worked around is drawn differently from a
 * step that succeeded — not the same green tick. Silent recovery is the
 * more dangerous of the two failures, because the run reports success and
 * the person never learns that the deploy went out against a stale cache
 * or that the "found" record was actually created. Amber, with the words
 * "recovered — the result below came from the fallback".
 *
 * RETRIES ARE COUNTED IN THE OPEN
 *
 * Attempts are stacked under the step with what changed each time and what
 * each one cost. An agent quietly retrying a 30-second tool call six times
 * is the single most common way a run becomes expensive, and a spinner
 * that says "working…" hides exactly that. The running total is in the
 * header where the stop button is, because the number is the reason
 * somebody presses it.
 *
 * THE ERROR IS THE REAL ERROR
 *
 * Verbatim, in monospace, copyable — not "something went wrong". The
 * person reading this is usually the only one who can tell whether the
 * agent's diagnosis is right, and they cannot do that from a paraphrase.
 * The agent's reading of it is shown *next to* the raw text and labelled
 * as an interpretation, so the two never get confused.
 *
 * THREE ROUTES OUT, AND NONE OF THEM IS "OK"
 *
 * Retry unchanged, retry with an edit, or take it over. A dialog whose
 * only button dismisses it leaves the run wedged, which is how agent
 * products end up with a support queue full of "it just stopped".
 *
 * ACCESSIBILITY: the trace is an ordered list, so position and length are
 * announced. Status is carried by an icon with a `sr-only` word as well as
 * colour. The failure panel is `role="alert"` — it appears mid-run without
 * a focus change, and is the one thing here that must interrupt.
 */

import * as React from 'react'
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Copy,
  CornerDownLeft,
  Loader2,
  RefreshCw,
  UserRoundCog,
  X,
} from 'lucide-react'

export type StepState = 'done' | 'recovered' | 'failed' | 'waiting' | 'running'

export interface RunAttempt {
  label: string
  outcome: string
  seconds: number
  cents: number
}

export interface RunStep {
  title: string
  detail: string
  state: StepState
  /** Raw tool output for a failed step — verbatim, never paraphrased. */
  rawError?: string
  /** The agent's reading of that output, kept visibly separate from it. */
  diagnosis?: string
  attempts?: RunAttempt[]
}

export interface AgentRunFailureProps {
  runName?: string
  steps?: RunStep[]
  className?: string
}

const DEFAULT_STEPS: RunStep[] = [
  {
    title: 'Read the deploy manifest',
    detail: 'infra/deploy.yaml, 240 lines',
    state: 'done',
  },
  {
    title: 'Resolve the image tag',
    detail: 'Registry timed out; used the digest pinned in the lockfile instead.',
    state: 'recovered',
    attempts: [
      { label: 'Attempt 1', outcome: 'registry.internal timed out after 30s', seconds: 30, cents: 0 },
      { label: 'Attempt 2', outcome: 'Fell back to the lockfile digest', seconds: 1, cents: 2 },
    ],
  },
  {
    title: 'Apply the migration',
    detail: 'Blocked. The migration wants a lock the reporting job is holding.',
    state: 'failed',
    rawError:
      'ERROR: could not obtain lock on relation "orders" (SQLSTATE 55P03)\n  detail: process 4417 holds AccessExclusiveLock\n  hint: retrying will queue behind the same lock',
    diagnosis:
      'The nightly reporting job took an exclusive lock on orders at 02:00 and has not released it. Retrying as-is will queue behind the same lock and time out again. Either wait for that job, or run the migration with a lock timeout and accept a partial apply.',
    attempts: [
      { label: 'Attempt 1', outcome: 'Lock not available after 60s', seconds: 60, cents: 4 },
      { label: 'Attempt 2', outcome: 'Lock not available after 60s', seconds: 60, cents: 4 },
      { label: 'Attempt 3', outcome: 'Lock not available after 60s', seconds: 60, cents: 4 },
    ],
  },
  { title: 'Restart the workers', detail: 'Not started — blocked by the step above.', state: 'waiting' },
  { title: 'Verify the health check', detail: 'Not started.', state: 'waiting' },
]

const STATE_STYLE: Record<StepState, { word: string; dot: string; text: string }> = {
  done: { word: 'Done', dot: 'bg-emerald-500', text: 'text-foreground' },
  recovered: { word: 'Recovered', dot: 'bg-amber-500', text: 'text-foreground' },
  failed: { word: 'Failed', dot: 'bg-destructive', text: 'text-foreground' },
  running: { word: 'Running', dot: 'bg-primary', text: 'text-foreground' },
  waiting: { word: 'Waiting', dot: 'bg-border', text: 'text-muted-foreground' },
}

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export function AgentRunFailure({
  runName = 'Deploy api-gateway to staging',
  steps = DEFAULT_STEPS,
  className = '',
}: AgentRunFailureProps) {
  const [openAttempts, setOpenAttempts] = React.useState<number | null>(2)
  const [copied, setCopied] = React.useState(false)

  /* The number that is the reason somebody reaches for the stop button. */
  const totals = steps
    .flatMap((s) => s.attempts ?? [])
    .reduce(
      (acc, a) => ({ seconds: acc.seconds + a.seconds, cents: acc.cents + a.cents }),
      { seconds: 0, cents: 0 },
    )
  const failedIndex = steps.findIndex((s) => s.state === 'failed')
  const failed = failedIndex >= 0 ? steps[failedIndex] : undefined

  return (
    <section className={`mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 ${className}`}>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <header className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold text-foreground">{runName}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Paused on step {failedIndex + 1} of {steps.length} ·{' '}
              <span className="tabular-nums">
                {Math.round(totals.seconds)}s · {money(totals.cents)}
              </span>{' '}
              spent so far
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <X aria-hidden className="h-3.5 w-3.5" />
            Stop run
          </button>
        </header>

        <ol className="divide-y divide-border">
          {steps.map((step, i) => {
            const style = STATE_STYLE[step.state]
            const isOpen = openAttempts === i
            return (
              <li key={step.title} className="px-5 py-4">
                <div className="flex gap-3">
                  <span className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center">
                    {step.state === 'running' ? (
                      <Loader2
                        aria-hidden
                        className="h-3.5 w-3.5 text-primary motion-safe:animate-spin"
                      />
                    ) : (
                      <span aria-hidden className={`h-2 w-2 rounded-full ${style.dot}`} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${style.text}`}>
                      {step.title}
                      {/* Status in words as well as colour. */}
                      <span className="sr-only"> — {style.word}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>

                    {step.state === 'recovered' ? (
                      <p className="mt-2 inline-flex items-start gap-1.5 rounded-lg bg-amber-500/10 px-2 py-1 text-xs text-amber-700 dark:text-amber-400">
                        <AlertTriangle aria-hidden className="mt-0.5 h-3 w-3 shrink-0" />
                        Recovered — what the later steps used came from the
                        fallback, not from the registry.
                      </p>
                    ) : null}

                    {step.attempts && step.attempts.length > 1 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setOpenAttempts(isOpen ? null : i)}
                          aria-expanded={isOpen}
                          /* Paired with aria-controls — expanded on its own
                             says a thing opened but not which thing. */
                          aria-controls={`attempts-${i}`}
                          className="mt-2 inline-flex items-center gap-1 rounded-md text-xs text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <ChevronDown
                            aria-hidden
                            className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          />
                          {step.attempts.length} attempts
                        </button>
                        {isOpen ? (
                          <ul
                            id={`attempts-${i}`}
                            className="mt-2 space-y-1 border-l border-border pl-3"
                          >
                            {step.attempts.map((a) => (
                              <li
                                key={a.label}
                                className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground"
                              >
                                <span className="font-medium text-foreground">{a.label}</span>
                                <span className="min-w-0 flex-1">{a.outcome}</span>
                                <span className="tabular-nums">
                                  {a.seconds}s · {money(a.cents)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>

        {failed ? (
          /* role="alert": this arrives mid-run without a focus change. */
          <div role="alert" className="border-t border-border bg-destructive/5 px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <AlertTriangle aria-hidden className="h-4 w-4 text-destructive" />
              {failed.title} could not complete
            </h3>

            {failed.rawError ? (
              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">
                    What the tool returned
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(failed.rawError ?? '')
                      setCopied(true)
                      window.setTimeout(() => setCopied(false), 2000)
                    }}
                    className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {copied ? (
                      <Check aria-hidden className="h-3.5 w-3.5" />
                    ) : (
                      <Copy aria-hidden className="h-3.5 w-3.5" />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="mt-1 overflow-x-auto rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs leading-relaxed text-foreground">
                  {failed.rawError}
                </pre>
              </div>
            ) : null}

            {failed.diagnosis ? (
              <div className="mt-3">
                {/* Labelled as a reading of the error, never merged with it. */}
                <p className="text-xs font-medium text-foreground">
                  What the agent thinks that means
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {failed.diagnosis}
                </p>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <CornerDownLeft aria-hidden className="h-4 w-4" />
                Retry with a lock timeout
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <RefreshCw aria-hidden className="h-4 w-4" />
                Retry unchanged
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <UserRoundCog aria-hidden className="h-4 w-4" />
                I&rsquo;ll take it from here
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
