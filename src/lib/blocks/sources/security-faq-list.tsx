'use client'

/**
 * <SecurityFaqList> — The security questions a buyer's IT reviewer asks, answered with scope and dates rather than with the word "enterprise-grade".
 *
 * These four questions arrive in every procurement review, and answering
 * them on a public page rather than in a returned questionnaire is worth
 * about two weeks of a sales cycle. The layout problem is that security
 * copy defaults to adjectives, and the obvious wrong answer is a paragraph
 * containing the phrase "enterprise-grade".
 *
 * Every answer here is a scope, a date or a mechanism. "The region you pick
 * at signup, pinned, never replicated out" is checkable. "Bank-level
 * security" is not, and a reviewer has read it four hundred times.
 *
 * The training answer says there is no setting that turns it on. That
 * sentence is doing the work: "we don't train on your data" is a policy and
 * policies change, while "there is no such setting" is a statement about
 * the system. Only make it if it is true.
 *
 * The internal-access row concedes that support can read data on an
 * approved ticket. A security FAQ where nobody can ever see anything is
 * read as marketing, because someone has to be able to help you; the
 * credible version bounds it and makes the log exportable.
 *
 * Rows are buttons with `aria-pressed` rather than `<details>` elements —
 * this is a selection panel showing one answer at a time, not independent
 * disclosures. Take the FAQ accordion if you want rows that open
 * separately. `status` is separate from `tone` so "no" and "30 days" read
 * without colour. The demo selects the first row.
 */

import * as React from 'react'

type Tone = 'neutral' | 'positive' | 'warning' | 'critical'

export interface SecurityFaqListRow {
  id: string
  label: string
  detail?: string
  tone?: Tone
  /** What the badge says. Falls back to the tone name when absent. */
  status?: string
}

export interface SecurityFaqListProps {
  heading?: string
  intro?: string
  rows?: SecurityFaqListRow[]
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

const ROWS: SecurityFaqListRow[] = [
  { id: "row-1", label: "Where is our data stored?", detail: "The region you pick at signup. It is pinned there and never replicated out of it.", tone: "positive", status: "pinned" },
  { id: "row-2", label: "Do you train models on it?", detail: "No, and there is no setting that turns it on.", tone: "positive", status: "no" },
  { id: "row-3", label: "Who internally can read it?", detail: "Support, on an approved ticket, time-boxed and logged. You can export that log.", tone: "neutral", status: "logged" },
  { id: "row-4", label: "What happens when we leave?", detail: "Full export any time. Deletion within 30 days of the request, backups included.", tone: "positive", status: "30 days" },
]

export function SecurityFaqList({
  heading = "Security, answered properly",
  intro = "These four arrive in every procurement review. Answering them on a public page rather than in a questionnaire is worth about two weeks of a sales cycle.",
  rows = ROWS,
  className,
}: SecurityFaqListProps) {
  const [selected, setSelected] = React.useState<string | null>(rows[0]?.id ?? null)

  return (
    <section
      aria-labelledby="security-faq-list-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="security-faq-list-heading"
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
