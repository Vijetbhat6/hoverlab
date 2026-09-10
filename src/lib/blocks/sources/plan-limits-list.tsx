'use client'

/**
 * <PlanLimitsList> — What actually runs out on each plan, including what happens when it does — the row a pricing table leaves off.
 *
 * Pricing tables list what a plan includes. They rarely say what happens at
 * the limit, and that is the fact which decides whether a limit is
 * survivable — the layout problem is that "10 GB storage" and "10 GB
 * storage, then read-only" are the same row in every pricing table ever
 * built.
 *
 * So each row's badge is hard or soft, and the detail says what the system
 * actually does. The obvious wrong answer is a checkmark grid, which cannot
 * express "throttled, not cut off" at all.
 *
 * The retention row is the one that earns the block. It is a hard limit
 * whose consequence is deletion, and it is the row a pricing table would
 * never carry — which is precisely why putting it here builds more trust
 * than the three friendly rows above it.
 *
 * The API row states that you are told at 80%. A soft limit with no warning
 * is a hard limit that arrives as a surprise, and saying where the warning
 * fires is what makes "soft" mean something.
 *
 * Rows are buttons with `aria-pressed` because a real implementation opens
 * the current usage behind each one. `status` and `tone` are separate so
 * "hard" reads as hard for someone who cannot see that it is red — which on
 * a page about what gets deleted matters more than most. The demo selects
 * the first row.
 */

import * as React from 'react'

type Tone = 'neutral' | 'positive' | 'warning' | 'critical'

export interface PlanLimitsListRow {
  id: string
  label: string
  detail?: string
  tone?: Tone
  /** What the badge says. Falls back to the tone name when absent. */
  status?: string
}

export interface PlanLimitsListProps {
  heading?: string
  intro?: string
  rows?: PlanLimitsListRow[]
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

const ROWS: PlanLimitsListRow[] = [
  { id: "row-1", label: "Seats", detail: "Hard limit. Inviting past it prompts an upgrade rather than charging silently.", tone: "warning", status: "hard" },
  { id: "row-2", label: "API requests", detail: "Soft. You are throttled, not cut off, and told at 80%.", tone: "positive", status: "soft" },
  { id: "row-3", label: "Storage", detail: "Soft, then read-only. Nothing is ever deleted for being over.", tone: "neutral", status: "soft" },
  { id: "row-4", label: "Retention", detail: "Hard. Data past the window is deleted on schedule and cannot be recovered.", tone: "critical", status: "hard" },
]

export function PlanLimitsList({
  heading = "What runs out, and what happens then",
  intro = "Pricing tables list what a plan includes. They rarely say what happens at the limit, which is the thing that decides whether a limit is survivable.",
  rows = ROWS,
  className,
}: PlanLimitsListProps) {
  const [selected, setSelected] = React.useState<string | null>(rows[0]?.id ?? null)

  return (
    <section
      aria-labelledby="plan-limits-list-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="plan-limits-list-heading"
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
