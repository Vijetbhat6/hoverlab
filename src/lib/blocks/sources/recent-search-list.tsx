'use client'

/**
 * <RecentSearchList> — The empty state of a search box, filled with the searches that are worth repeating and the ones worth saving.
 *
 * The empty state is the most common state of a search box and it is
 * usually blank. The layout problem is what to put there before anything has
 * been typed, and the obvious wrong answer is suggested or trending
 * searches — those are the product talking about itself, and they are
 * identical for every user.
 *
 * Recent queries are the cheapest thing that is actually about this person,
 * and the result count is what makes them worth re-running rather than just
 * a history log.
 *
 * The last row returned nothing and is kept. That is the decision worth
 * defending: an empty result is information — it says this filter
 * combination has no matches, which someone re-running it wants to know
 * before they type it again. Pruning zero-result searches is a tidiness
 * instinct that removes the most useful row.
 *
 * The quoted row exists to document a real behaviour: a phrase in quotes is
 * stored and re-run verbatim rather than re-tokenised, so re-running it
 * gives the same results rather than a fuzzier superset.
 *
 * Rows are buttons with `aria-pressed` since running one is the whole point,
 * and `status` is separate from `tone` so the counts read without colour. In
 * a real command palette this list also needs roving focus and arrow-key
 * navigation; the scaffold's tab-through list is correct for a panel and not
 * for an overlay. The demo selects the first row, the most-run query.
 */

import * as React from 'react'

type Tone = 'neutral' | 'positive' | 'warning' | 'critical'

export interface RecentSearchListRow {
  id: string
  label: string
  detail?: string
  tone?: Tone
  /** What the badge says. Falls back to the tone name when absent. */
  status?: string
}

export interface RecentSearchListProps {
  heading?: string
  intro?: string
  rows?: RecentSearchListRow[]
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

const ROWS: RecentSearchListRow[] = [
  { id: "row-1", label: "status:open assignee:me", detail: "Run four times this week. The closest thing you have to a saved view.", tone: "positive", status: "12 results" },
  { id: "row-2", label: "invoice overdue", detail: "Run yesterday. Two more have gone overdue since.", tone: "warning", status: "7 results" },
  { id: "row-3", label: "\"cannot log in\"", detail: "Exact phrase. Quoted searches are kept verbatim rather than re-tokenised.", tone: "neutral", status: "3 results" },
  { id: "row-4", label: "region:eu plan:enterprise", detail: "Returned nothing last time. Kept anyway — an empty result is information.", tone: "neutral", status: "0 results" },
]

export function RecentSearchList({
  heading = "Pick up where you left off",
  intro = "An empty search box is the most common state of a search box, and it is usually blank. Recent queries are the cheapest useful thing to put there, and the result count is what makes them worth re-running.",
  rows = ROWS,
  className,
}: RecentSearchListProps) {
  const [selected, setSelected] = React.useState<string | null>(rows[0]?.id ?? null)

  return (
    <section
      aria-labelledby="recent-search-list-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="recent-search-list-heading"
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
