/**
 * <AgentDiffReview> — proposed edits to tabular data, accepted or rejected
 * row by row.
 *
 * When an agent rewrites forty rows, "apply all" is not a review, it is a
 * shrug. This block makes the unit of consent the row, keeps a running count
 * of what will actually be written, and shows before and after side by side
 * rather than asking the user to remember the old value.
 *
 * The table is a real `<table>` with `<caption>`, scoped headers and one
 * `<th scope="row">` per record, because a grid of divs is unnavigable with
 * a screen reader's table commands — and reviewing a diff is exactly the
 * task those commands exist for.
 *
 * Old values are wrapped in `<del>` and new ones in `<ins>`. Those elements
 * are the semantic answer to "this changed", which colour and strikethrough
 * styling alone never conveys — and `<ins>` takes a `cite`/`dateTime` in a
 * real app, which is where the provenance of a machine edit belongs.
 *
 * The header checkbox is tri-state via `indeterminate`, a DOM property with
 * no HTML attribute, so it has to be set through a ref. Getting this wrong
 * is why most "select all" boxes read as unchecked while half the rows are
 * selected.
 */

'use client'

import * as React from 'react'
import { Check, Sparkles, Undo2, X } from 'lucide-react'

export interface DiffRow {
  id: string
  record: string
  field: string
  before: string
  after: string
  /** Why the agent proposed this one. */
  reason?: string
}

export interface AgentDiffReviewProps {
  title?: string
  summary?: string
  rows?: DiffRow[]
  className?: string
}

const DEFAULT_ROWS: DiffRow[] = [
  {
    id: '1',
    record: 'Northwind Retail',
    field: 'Industry',
    before: 'Other',
    after: 'Grocery & FMCG',
    reason: 'Website and SIC code both say grocery',
  },
  {
    id: '2',
    record: 'Vela Logistics',
    field: 'Employees',
    before: '50-100',
    after: '210',
    reason: 'LinkedIn headcount, verified against last filing',
  },
  {
    id: '3',
    record: 'Harbour Foods',
    field: 'Owner',
    before: 'Unassigned',
    after: 'D. Okafor',
    reason: 'Territory rule: EMEA mid-market',
  },
  {
    id: '4',
    record: 'Pike & Sons',
    field: 'Status',
    before: 'Active',
    after: 'Churned',
    reason: 'No invoice in 240 days — low confidence, worth checking',
  },
  {
    id: '5',
    record: 'Cobalt Interiors',
    field: 'Industry',
    before: 'Retail',
    after: 'Design & Architecture',
    reason: 'Reclassified from site copy',
  },
]

export function AgentDiffReview({
  title = 'Proposed cleanup — 5 records',
  summary = 'I filled gaps and corrected classifications from public sources. Row 4 is a guess from billing inactivity; the rest are verified.',
  rows = DEFAULT_ROWS,
  className = '',
}: AgentDiffReviewProps) {
  // Starts fully selected: the agent is proposing, and a review that begins
  // with everything off makes the user do the work twice.
  const [accepted, setAccepted] = React.useState<string[]>(rows.map((r) => r.id))
  const [applied, setApplied] = React.useState(false)

  const all = accepted.length === rows.length
  const none = accepted.length === 0

  const selectAllRef = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    // `indeterminate` has no attribute — it exists only on the DOM node.
    if (selectAllRef.current) selectAllRef.current.indeterminate = !all && !none
  }, [all, none])

  function toggle(id: string) {
    setAccepted((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))
  }

  return (
    <div className={`mx-auto w-full max-w-3xl p-6 ${className}`}>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        {/* -- Header ----------------------------------------------------- */}
        <div className="flex items-start gap-3 border-b border-border/60 px-5 py-4">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles aria-hidden className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{summary}</p>
          </div>
        </div>

        {/* -- Diff table ------------------------------------------------- */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Proposed field changes, one row per record, each accepted or rejected individually
            </caption>

            <thead>
              <tr className="border-b border-border/60 text-left">
                <th scope="col" className="w-10 py-2.5 ps-5 pe-2">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={all}
                    onChange={() => setAccepted(all ? [] : rows.map((r) => r.id))}
                    aria-label="Accept every change"
                    className="h-4 w-4 accent-primary"
                  />
                </th>
                <th scope="col" className="py-2.5 pe-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Record
                </th>
                <th scope="col" className="py-2.5 pe-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Field
                </th>
                <th scope="col" className="py-2.5 pe-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Change
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/40">
              {rows.map((row) => {
                const on = accepted.includes(row.id)

                return (
                  <tr
                    key={row.id}
                    className={`transition-colors ${on ? '' : 'opacity-45'} hover:bg-muted/40`}
                  >
                    <td className="py-3 ps-5 pe-2 align-top">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(row.id)}
                        aria-label={`Accept ${row.field} change for ${row.record}`}
                        className="h-4 w-4 accent-primary"
                      />
                    </td>

                    <th scope="row" className="py-3 pe-4 text-start align-top font-medium">
                      {row.record}
                    </th>

                    <td className="py-3 pe-4 align-top text-xs text-muted-foreground">
                      {row.field}
                    </td>

                    <td className="py-3 pe-5 align-top">
                      <span className="flex flex-wrap items-center gap-2">
                        <del className="rounded-md bg-rose-500/10 px-1.5 py-0.5 text-xs text-rose-600 decoration-rose-500/50 dark:text-rose-400">
                          {row.before}
                        </del>
                        <span aria-hidden className="text-muted-foreground">
                          →
                        </span>
                        <ins className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-xs font-medium text-emerald-700 no-underline dark:text-emerald-400">
                          {row.after}
                        </ins>
                      </span>

                      {row.reason ? (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {row.reason}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* -- Apply bar --------------------------------------------------- */}
        <div className="flex flex-wrap items-center gap-3 border-t border-border/60 bg-muted/30 px-5 py-3">
          {/* The count is the whole safety mechanism: it is what stops
              "apply" from meaning something different than it looks. */}
          <p role="status" className="text-sm text-muted-foreground">
            {applied ? (
              <span className="font-medium text-foreground">
                Applied {accepted.length} {accepted.length === 1 ? 'change' : 'changes'}.{' '}
                {rows.length - accepted.length} discarded.
              </span>
            ) : (
              <>
                <span className="font-medium text-foreground">{accepted.length}</span> of{' '}
                {rows.length} will be written
              </>
            )}
          </p>

          <div className="ms-auto flex items-center gap-2">
            {applied ? (
              <button
                type="button"
                onClick={() => setApplied(false)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Undo2 aria-hidden className="h-4 w-4" />
                Undo
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setAccepted([])}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X aria-hidden className="h-4 w-4" />
                  Reject all
                </button>

                <button
                  type="button"
                  disabled={none}
                  onClick={() => setApplied(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Check aria-hidden className="h-4 w-4" />
                  Apply {accepted.length}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
