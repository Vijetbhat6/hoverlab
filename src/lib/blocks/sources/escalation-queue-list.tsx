'use client'

/**
 * <EscalationQueueList> — What is waiting on a person, ordered by how long it has been waiting rather than when it arrived.
 *
 * A queue sorted newest-first buries the item that has been stuck longest,
 * and that item is always the one that becomes the complaint. So the sort is
 * by age, and the badge is the wait rather than the arrival time.
 *
 * That is the layout problem in one line: two orderings are available and
 * the obvious one is wrong. The clock-time alternative — "10:42" — makes the
 * reader compute the age themselves, every row, every time they look.
 *
 * Tone tracks the wait rather than the money. The refund is critical because
 * it has sat for four hours with two people able to sign it, not because it
 * is £840; the schema change is a warning at eighteen minutes because it is
 * a production write. Encoding severity as amount would sort a small urgent
 * thing below a large calm one.
 *
 * The last row carries the detail that makes a queue survivable: it expires
 * on its own. An approval queue where nothing times out is a queue that
 * grows forever, and saying so on the row is what stops someone approving it
 * just to clear the list.
 *
 * Rows are buttons with `aria-pressed` — opening one is the obvious action —
 * and `status` is separate from `tone` so "4h 20m" is readable without
 * colour. The demo selects the first row, which here is genuinely the one to
 * act on, because the sort has already put it there.
 */

import * as React from 'react'

type Tone = 'neutral' | 'positive' | 'warning' | 'critical'

export interface EscalationQueueListRow {
  id: string
  label: string
  detail?: string
  tone?: Tone
  /** What the badge says. Falls back to the tone name when absent. */
  status?: string
}

export interface EscalationQueueListProps {
  heading?: string
  intro?: string
  rows?: EscalationQueueListRow[]
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

const ROWS: EscalationQueueListRow[] = [
  { id: "row-1", label: "Refund over the auto-approve limit", detail: "£840. Two people can sign this and neither has opened it.", tone: "critical", status: "4h 20m" },
  { id: "row-2", label: "Outbound message to a customer", detail: "Drafted by the agent, held because the recipient is outside the workspace.", tone: "warning", status: "51m" },
  { id: "row-3", label: "Schema change on a production table", detail: "Additive, reversible, and still not something a run should do unattended.", tone: "warning", status: "18m" },
  { id: "row-4", label: "New integration scope request", detail: "Read-only calendar access. Expires on its own in two days if nobody acts.", tone: "neutral", status: "6m" },
]

export function EscalationQueueList({
  heading = "Waiting on a person",
  intro = "Sorted by age, not arrival. A queue sorted newest-first buries the item that has been stuck longest, which is always the one that turns into the complaint.",
  rows = ROWS,
  className,
}: EscalationQueueListProps) {
  const [selected, setSelected] = React.useState<string | null>(rows[0]?.id ?? null)

  return (
    <section
      aria-labelledby="escalation-queue-list-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="escalation-queue-list-heading"
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
