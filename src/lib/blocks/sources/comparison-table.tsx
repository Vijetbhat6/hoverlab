/**
 * <ComparisonTable> — a feature matrix across plans or competitors.
 *
 * A real <table> with a <caption> and scoped headers, so a screen reader
 * can announce "Priority support, Pro, included" instead of reading a grid
 * of disembodied checkmarks. The check and dash carry `<span class="sr-only">`
 * text for the same reason.
 *
 * The first column is sticky on small screens: a matrix you have to scroll
 * horizontally is useless once the row label has slid out of view.
 */

import * as React from 'react'
import { Check, Minus } from 'lucide-react'

/** `true`/`false` render as icons; a string renders verbatim. */
export type CellValue = boolean | string

export interface ComparisonRow {
  feature: string
  values: CellValue[]
}

export interface ComparisonTableProps {
  columns?: string[]
  rows?: ComparisonRow[]
  heading?: string
  subheading?: string
  /** Index into `columns` to emphasise. */
  highlightColumn?: number
  className?: string
}

const DEFAULT_COLUMNS = ['Free', 'Pro', 'Team']

const DEFAULT_ROWS: ComparisonRow[] = [
  { feature: 'Projects', values: ['3', 'Unlimited', 'Unlimited'] },
  { feature: 'Commercial license', values: [false, true, true] },
  { feature: 'Full component library', values: [false, true, true] },
  { feature: 'Figma source files', values: [false, true, true] },
  { feature: 'Seats', values: ['1', '1', 'Up to 10'] },
  { feature: 'SSO and audit log', values: [false, false, true] },
  { feature: 'Support', values: ['Community', 'Priority email', 'Dedicated'] },
]

export function ComparisonTable({
  columns = DEFAULT_COLUMNS,
  rows = DEFAULT_ROWS,
  heading = 'Compare plans',
  subheading = 'Every line, side by side.',
  highlightColumn = 1,
  className = '',
}: ComparisonTableProps) {
  return (
    <section className={`mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}>
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {heading}
        </h2>
        {subheading ? <p className="mt-3 text-muted-foreground">{subheading}</p> : null}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            {heading} — features by plan
          </caption>
          <thead>
            <tr className="border-b border-border/60 bg-muted/40">
              <th scope="col" className="sticky left-0 z-10 bg-muted/40 p-4 text-left font-semibold">
                Feature
              </th>
              {columns.map((col, i) => (
                <th
                  key={col}
                  scope="col"
                  className={`p-4 text-center font-semibold ${
                    i === highlightColumn ? 'text-primary' : ''
                  }`}
                >
                  {col}
                  {i === highlightColumn ? (
                    <span className="ml-1.5 rounded-full bg-primary/15 px-2 py-0.5 text-xs">
                      Popular
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.feature} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-background p-4 text-left font-medium"
                >
                  {row.feature}
                </th>
                {row.values.map((value, i) => (
                  <td
                    key={i}
                    className={`p-4 text-center ${
                      i === highlightColumn ? 'bg-primary/5' : ''
                    }`}
                  >
                    <Cell value={value} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Cell({ value }: { value: CellValue }) {
  if (typeof value === 'string') {
    return <span className="text-muted-foreground">{value}</span>
  }
  return value ? (
    <>
      <Check aria-hidden className="mx-auto h-4 w-4 text-emerald-500" />
      <span className="sr-only">Included</span>
    </>
  ) : (
    <>
      <Minus aria-hidden className="mx-auto h-4 w-4 text-muted-foreground/40" />
      <span className="sr-only">Not included</span>
    </>
  )
}
