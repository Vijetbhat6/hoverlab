'use client'

/**
 * <RetrievalFreshnessList> — Retrieved sources ranked by how stale they are, because a confident answer from a two-year-old document is the failure people do not catch.
 *
 * Relevance ranking answers which document matched. Nothing in a retrieval
 * UI answers whether the document is still true, and that is the failure
 * nobody catches — a confident, well-cited answer drawn from a two-year-old
 * migration note. The layout problem is that freshness is a second axis on
 * a list already sorted by relevance, and the obvious wrong answer is to
 * sort by date instead, which promotes a fresh irrelevant source over a
 * stale central one.
 *
 * So the order stays as retrieved and age is the badge. The reader sees
 * relevance in the ordering and staleness in the pill, which is both axes at
 * once without either overriding the other.
 *
 * The last row is deliberately one that was excluded. A freshness panel that
 * only lists what was used cannot show its own judgement; the two-year-old
 * note is there to say that something was considered and dropped, which is
 * the part that makes the other four trustworthy.
 *
 * Ages are printed as durations — "3 weeks" — rather than dates. A date
 * makes the reader do the subtraction, and the question is never "when was
 * this written", it is "how old is it now".
 *
 * Rows are buttons with `aria-pressed` because opening a source is the
 * obvious next action, and `status` carries the age separately from `tone`
 * so the colour scale can stay on four values while the words stay precise.
 *
 * The demo selects the freshest row, which is the one a reader checks first.
 */

import * as React from 'react'

type Tone = 'neutral' | 'positive' | 'warning' | 'critical'

export interface RetrievalFreshnessListRow {
  id: string
  label: string
  detail?: string
  tone?: Tone
  /** What the badge says. Falls back to the tone name when absent. */
  status?: string
}

export interface RetrievalFreshnessListProps {
  heading?: string
  intro?: string
  rows?: RetrievalFreshnessListRow[]
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

const ROWS: RetrievalFreshnessListRow[] = [
  { id: "row-1", label: "Pricing page — 2 days old", detail: "Re-indexed after the last deploy. Matches what is live.", tone: "positive", status: "2 days" },
  { id: "row-2", label: "API reference — 3 weeks old", detail: "Two endpoints have shipped since. Neither is quoted in this answer.", tone: "neutral", status: "3 weeks" },
  { id: "row-3", label: "Onboarding guide — 8 months old", detail: "Predates the current signup flow. Cited here for the account model only.", tone: "warning", status: "8 months" },
  { id: "row-4", label: "Migration notes — 2 years old", detail: "Superseded twice. Excluded from this answer and kept for the audit trail.", tone: "critical", status: "2 years" },
]

export function RetrievalFreshnessList({
  heading = "How old the sources are",
  intro = "Relevance ranking says which document matched. It says nothing about whether the document is still true, and that is the question a reader has once the answer surprises them.",
  rows = ROWS,
  className,
}: RetrievalFreshnessListProps) {
  const [selected, setSelected] = React.useState<string | null>(rows[0]?.id ?? null)

  return (
    <section
      aria-labelledby="retrieval-freshness-list-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="retrieval-freshness-list-heading"
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
