'use client'

/**
 * <AgentRetryLog> — What the agent tried, what failed, and what it did about it — the run history a user needs before they trust a second attempt.
 *
 * An agent that retries silently reads as an agent that is slow. The same
 * run, shown, reads as one that is careful — and the layout problem is that
 * the interesting rows are the failures, which are the minority. The
 * obvious wrong answer is to show failures only: a log of three errors with
 * no successes around them reads as a broken system rather than as a run
 * that recovered.
 *
 * So every step is a row and the badge carries the outcome. "ok" twice is
 * context, not filler; it is what makes "abandoned" legible as one step out
 * of four rather than as the whole story.
 *
 * The abandoned row is the one worth reading twice. It names why the agent
 * stopped — a column that does not exist — rather than reporting a generic
 * failure, because "stopped rather than guessing a column name" is the
 * behaviour a user is deciding whether to trust, and it cannot be inferred
 * from a red pill.
 *
 * The rows are buttons with `aria-pressed` rather than divs: selecting one
 * is how a real implementation would open its full trace, so the row is
 * operable and must be reachable and announceable as such. The badge text
 * is separate from the tone for the same reason as the digest — a pill
 * reading "warning" tells a reader nothing about what happened, and "retried"
 * tells them everything.
 *
 * The demo selects the first row rather than the failure. A panel that
 * opens on its own worst row is making an editorial claim about which step
 * matters, and here the reader's question is usually "what did it do", in
 * order.
 */

import * as React from 'react'

type Tone = 'neutral' | 'positive' | 'warning' | 'critical'

export interface AgentRetryLogRow {
  id: string
  label: string
  detail?: string
  tone?: Tone
  /** What the badge says. Falls back to the tone name when absent. */
  status?: string
}

export interface AgentRetryLogProps {
  heading?: string
  intro?: string
  rows?: AgentRetryLogRow[]
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

const ROWS: AgentRetryLogRow[] = [
  { id: "row-1", label: "search_docs — succeeded", detail: "First attempt. 12 passages returned, 4 above the relevance floor.", tone: "positive", status: "ok" },
  { id: "row-2", label: "fetch_invoice — rate limited, retried", detail: "429 on the first call. Backed off 2.1 s and succeeded on the second.", tone: "warning", status: "retried" },
  { id: "row-3", label: "run_query — failed twice, abandoned", detail: "Column `renewed_at` does not exist. The agent stopped rather than guessing a column name.", tone: "critical", status: "abandoned" },
  { id: "row-4", label: "summarise — succeeded", detail: "Ran against the two sources that resolved, and says so in the answer.", tone: "positive", status: "ok" },
]

export function AgentRetryLog({
  heading = "What it tried before this answer",
  intro = "A retried step that is invisible reads as a slow agent. A retried step that is shown reads as a careful one, and it is the same run either way.",
  rows = ROWS,
  className,
}: AgentRetryLogProps) {
  const [selected, setSelected] = React.useState<string | null>(rows[0]?.id ?? null)

  return (
    <section
      aria-labelledby="agent-retry-log-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="agent-retry-log-heading"
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
                  className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-start transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
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
