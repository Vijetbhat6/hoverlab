'use client'

/**
 * <StockAvailabilityList> — Availability per variant stated before the cart, because discovering it at checkout is where the basket gets abandoned.
 *
 * "In stock" on a listing where one of nine variants is in stock is the
 * most expensive lie in commerce UI. It is discovered at checkout, and the
 * basket is abandoned there. The layout problem is surfacing per-variant
 * availability before the cart without turning the listing into a
 * spreadsheet.
 *
 * Four rows, one per variant, each with a real state. The obvious wrong
 * answer is a single badge on the product, which is the lie above.
 *
 * The counts are live numbers rather than a scarcity banner, and the detail
 * on the low row says so. "3 left" that is true is useful; "Only 3 left!"
 * that is decoration trains people to ignore both, and the second is the one
 * that ends up in a regulator's example of a dark pattern.
 *
 * The made-to-order row is the one most implementations get wrong by
 * filing it under "in stock". Six weeks is not out of stock and it is not
 * available — it is a third state, and stating it here is the difference
 * between a delighted customer and a chargeback.
 *
 * Rows are buttons with `aria-pressed` because selecting a variant is the
 * action. `status` carries the count separately from `tone` so "out" and "3
 * left" are readable without colour, which matters on the row that changes a
 * purchase decision. The demo selects the first available variant, not the
 * sold-out one.
 */

import * as React from 'react'

type Tone = 'neutral' | 'positive' | 'warning' | 'critical'

export interface StockAvailabilityListRow {
  id: string
  label: string
  detail?: string
  tone?: Tone
  /** What the badge says. Falls back to the tone name when absent. */
  status?: string
}

export interface StockAvailabilityListProps {
  heading?: string
  intro?: string
  rows?: StockAvailabilityListRow[]
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

const ROWS: StockAvailabilityListRow[] = [
  { id: "row-1", label: "Small — Charcoal", detail: "Ships today if ordered before 4pm.", tone: "positive", status: "42 left" },
  { id: "row-2", label: "Medium — Charcoal", detail: "Low. The counter is live, not a scarcity banner.", tone: "warning", status: "3 left" },
  { id: "row-3", label: "Large — Charcoal", detail: "Restocking. Notify me is on the product page.", tone: "critical", status: "out" },
  { id: "row-4", label: "Small — Sand", detail: "Made to order. Six weeks, stated here rather than at checkout.", tone: "neutral", status: "6 weeks" },
]

export function StockAvailabilityList({
  heading = "What is actually available",
  intro = "\"In stock\" on a listing that means \"one of nine variants is in stock\" is the single most expensive lie in commerce UI — it is discovered at checkout, and the basket is abandoned there.",
  rows = ROWS,
  className,
}: StockAvailabilityListProps) {
  const [selected, setSelected] = React.useState<string | null>(rows[0]?.id ?? null)

  return (
    <section
      aria-labelledby="stock-availability-list-heading"
      className={`w-full bg-background px-6 py-16 ${className ?? ''}`}
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="stock-availability-list-heading"
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
