'use client'

/**
 * <ContextScopeList> — Which sources this answer may draw on, shown as a scope the user can read before asking rather than a citation list after.
 *
 * Citations answer "what did this use". Nobody asks that first. The
 * question that actually arrives is "why did it not know that", and the
 * answer is scope — what the system could have looked at — which no
 * retrieval UI shows.
 *
 * The layout problem is that scope is a permission model, and the obvious
 * wrong answer is to render it as toggles. Some of these are not choices:
 * billing records are not in scope and there is no setting that puts them
 * there, and a switched-off toggle beside them would imply the opposite.
 *
 * So rows are informational and the badge carries the modality — always, on,
 * org only, never. The last row is the important one. A scope list where
 * everything is available is a list nobody needs to read; the value is in
 * the boundary.
 *
 * Rows are `<button>` elements with `aria-pressed` rather than divs, because
 * selecting one is how a real implementation would show which documents that
 * scope contains. Operable means focusable, activatable by Enter and Space,
 * and announcing its selected state, and a div carries none of the three.
 *
 * The badge text is separate from the tone. `status` says "never", `tone`
 * makes it red — so the severity survives for a reader who cannot
 * distinguish the colour, which on a page about data access is not an
 * optional consideration.
 *
 * The demo selects the first row, the most permissive one, so the panel
 * opens on the state most sources are in.
 */

import * as React from 'react'

type Tone = 'neutral' | 'positive' | 'warning' | 'critical'

export interface ContextScopeListRow {
  id: string
  label: string
  detail?: string
  tone?: Tone
  /** What the badge says. Falls back to the tone name when absent. */
  status?: string
}

export interface ContextScopeListProps {
  heading?: string
  intro?: string
  rows?: ContextScopeListRow[]
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

const ROWS: ContextScopeListRow[] = [
  { id: "row-1", label: "Public documentation", detail: "Always in scope. Re-indexed on every deploy.", tone: "positive", status: "always" },
  { id: "row-2", label: "Your workspace files", detail: "In scope. Only files your own account can already open.", tone: "positive", status: "on" },
  { id: "row-3", label: "Support ticket history", detail: "In scope for your organisation's tickets, never another customer's.", tone: "neutral", status: "org only" },
  { id: "row-4", label: "Billing and payment records", detail: "Out of scope. No retrieval path reaches them, and turning it on is not an option here.", tone: "critical", status: "never" },
]

export function ContextScopeList({
  heading = "What it can see",
  intro = "Citations tell you what an answer used. Scope tells you what it could have used, which is the question behind \"why did it not know that\".",
  rows = ROWS,
  className,
}: ContextScopeListProps) {
  const [selected, setSelected] = React.useState<string | null>(rows[0]?.id ?? null)

  return (
    <section
      aria-labelledby="context-scope-list-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="context-scope-list-heading"
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
