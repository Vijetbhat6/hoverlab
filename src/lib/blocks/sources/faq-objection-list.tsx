'use client'

/**
 * <FaqObjectionList> — An FAQ written from the objections that stop a sale rather than from the questions that are comfortable to answer.
 *
 * Most FAQs answer the questions a company wishes it were asked. The
 * layout problem is that the format encourages that: a long accordion of
 * comfortable questions looks thorough and converts nothing, because the
 * four objections that actually decide it are not in there.
 *
 * So this one is short and every row is an objection rather than a
 * question. The obvious wrong answer is length — twenty rows reads as
 * support documentation and buries the four that matter.
 *
 * The first row's answer is "no". That is the point of the block, and it is
 * worth defending: an FAQ where the vendor wins every exchange is read as
 * marketing, and a reader who finds one honest answer believes the other
 * three. "For one screen, build it yourself" costs a sale that was not going
 * to close and buys credibility on the ones that were.
 *
 * The badge carries the shape of the answer — "yes", "no", "sometimes no" —
 * so the list is skimmable as a set of verdicts before any detail is read.
 * That is only possible because `status` is a free string rather than the
 * tone name; "positive" as a badge would tell the reader nothing about
 * whether the answer was yes.
 *
 * Rows are buttons with `aria-pressed` rather than <details> elements. This
 * is a deliberate departure from the catalog's other FAQ block, which is
 * built on <details> and gets keyboard support for free: here the row is a
 * selection in a panel rather than a disclosure, only one answer shows at a
 * time, and `aria-pressed` is what carries that state. If you want
 * independent open/closed rows, take the accordion instead.
 *
 * The demo selects the first row — the one where the answer is no.
 */

import * as React from 'react'

type Tone = 'neutral' | 'positive' | 'warning' | 'critical'

export interface FaqObjectionListRow {
  id: string
  label: string
  detail?: string
  tone?: Tone
  /** What the badge says. Falls back to the tone name when absent. */
  status?: string
}

export interface FaqObjectionListProps {
  heading?: string
  intro?: string
  rows?: FaqObjectionListRow[]
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

const ROWS: FaqObjectionListRow[] = [
  { id: "row-1", label: "Is this cheaper than building it ourselves?", detail: "For one screen, no — build it. It stops being true somewhere around the fourth.", tone: "neutral", status: "sometimes no" },
  { id: "row-2", label: "What happens if you shut down?", detail: "The source is already in your repository and carries no runtime dependency on us.", tone: "positive", status: "yes" },
  { id: "row-3", label: "Can I get a refund?", detail: "Fourteen days, no questions, and it is stated on the refunds page rather than here only.", tone: "positive", status: "yes" },
  { id: "row-4", label: "Do I have to credit you?", detail: "No. Attribution is not required anywhere, including on the free tier.", tone: "positive", status: "no" },
]

export function FaqObjectionList({
  heading = "The awkward questions",
  intro = "Most FAQs answer what the company wishes it were asked. These are the four that actually decide it, including the one where the honest answer is no.",
  rows = ROWS,
  className,
}: FaqObjectionListProps) {
  const [selected, setSelected] = React.useState<string | null>(rows[0]?.id ?? null)

  return (
    <section
      aria-labelledby="faq-objection-list-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="faq-objection-list-heading"
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
