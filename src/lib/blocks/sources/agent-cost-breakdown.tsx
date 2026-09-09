'use client'

/**
 * <AgentCostBreakdown> — What one run cost, per step, so an expensive answer is attributable rather than a monthly surprise.
 *
 * A bill that arrives only in aggregate cannot be acted on. The layout
 * problem is attribution: a run costs one number, and the useful version is
 * that number split by step, so an expensive answer is traceable to the step
 * that made it expensive.
 *
 * The obvious wrong answer is a token count. Tokens are a unit the person
 * paying does not think in, and two models price them differently — the row
 * that matters is money, with tokens as the detail behind it.
 *
 * The reasoning row is tone `warning` while being the correct and necessary
 * majority of the cost. That is deliberate: warning here means "this is
 * where the money is", not "this is broken", and the detail says the useful
 * thing — three steps would have reached the same answer. A cost panel that
 * flags nothing teaches nothing.
 *
 * The retry inside the tool-calls row is named rather than hidden, because a
 * retried call is billed like any other call and a reader reconciling this
 * against an invoice will otherwise be one call short.
 *
 * Rows are buttons with `aria-pressed`, since drilling into a step is the
 * obvious next action, and `status` carries the currency figure separately
 * from `tone` so the amounts are legible without colour. The demo selects
 * the first row rather than the expensive one, because the panel reads top
 * to bottom as a sequence.
 */

import * as React from 'react'

type Tone = 'neutral' | 'positive' | 'warning' | 'critical'

export interface AgentCostBreakdownRow {
  id: string
  label: string
  detail?: string
  tone?: Tone
  /** What the badge says. Falls back to the tone name when absent. */
  status?: string
}

export interface AgentCostBreakdownProps {
  heading?: string
  intro?: string
  rows?: AgentCostBreakdownRow[]
  className?: string
}

/*
  Tones as complete utility classes, never assembled from fragments.
  Tailwind scans source text, so `text-${tone}-foreground` produces no
  class at all — the same failure as an undefined token, and just as
  invisible in review.
*/
const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  positive: 'bg-primary/10 text-primary',
  warning: 'bg-accent text-accent-foreground',
  critical: 'bg-destructive/10 text-destructive',
}

const ROWS: AgentCostBreakdownRow[] = [
  { id: "row-1", label: "Retrieval — 12 passages", detail: "Cheap and worth it. Cutting this is what makes the model guess.", tone: "positive", status: "$0.004" },
  { id: "row-2", label: "Reasoning — 4 steps", detail: "The bulk of it. Three steps would have reached the same answer.", tone: "warning", status: "$0.112" },
  { id: "row-3", label: "Tool calls — 6 invocations", detail: "One retry included, which is billed like any other call.", tone: "neutral", status: "$0.019" },
  { id: "row-4", label: "Final answer", detail: "Output tokens only. The cheapest part of almost every run.", tone: "positive", status: "$0.007" },
]

export function AgentCostBreakdown({
  heading = "What this run cost",
  intro = "Per step, not per month. A bill that only arrives in aggregate cannot be acted on — the useful version says which step was expensive and whether it needed to be.",
  rows = ROWS,
  className,
}: AgentCostBreakdownProps) {
  const [selected, setSelected] = React.useState<string | null>(rows[0]?.id ?? null)

  return (
    <section
      aria-labelledby="agent-cost-breakdown-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="agent-cost-breakdown-heading"
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          {heading}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{intro}</p>

        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {rows.map((row) => {
            const isSelected = row.id === selected
            return (
              <li key={row.id}>
                {/*
                  A button, not a div with onClick. The row is operable, so
                  it has to be reachable by keyboard and announce its
                  selected state — aria-pressed is what carries that.
                */}
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelected(row.id)}
                  className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                    isSelected ? 'bg-muted/40' : ''
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {row.label}
                    </span>
                    {row.detail ? (
                      <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                        {row.detail}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      TONE_CLASS[row.tone ?? 'neutral']
                    }`}
                  >
                    {row.status ?? row.tone ?? 'neutral'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
