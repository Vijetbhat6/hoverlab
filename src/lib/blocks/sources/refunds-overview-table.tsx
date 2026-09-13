'use client'

/**
 * <RefundsOverviewTable> — the operator's side of the refund queue.
 *
 * `refund-status-tracker` is what one customer sees about one refund. This is
 * what the finance or support team sees about all of them, and it is a
 * different design problem: the interesting rows are not the recent ones, they
 * are the *stuck* ones.
 *
 * SORTED BY AGE, NOT BY DATE
 *
 * Newest-first is the default of every table and the wrong default here. A
 * refund raised this morning needs nothing; one raised eleven days ago and
 * still unpaid is a complaint that has not been made yet. So the default order
 * is oldest-open-first, and the age column is styled by how far past the
 * promise it is rather than by absolute value.
 *
 * THE SUMMARY BAND IS THREE NUMBERS AND THEY ARE THE THREE THAT MATTER
 *
 * Money out this period, the count breaching the service promise, and the
 * count blocked on something the team can fix. Not a chart. A refunds queue is
 * worked from a list; the band exists to say whether the list needs working
 * today.
 *
 * BLOCKED IS A FIRST-CLASS STATUS AND IT NAMES THE BLOCKER
 *
 * "Awaiting goods", "bank details refused", "over approval limit" — three
 * different people fix those three things. A single "Pending" bucket makes the
 * queue unworkable and is the most common failure of this screen.
 *
 * ACCESSIBILITY: a real `<table>` with scoped headers and a caption; sorting
 * is a header button carrying `aria-sort`, which is the only thing that makes
 * the current order perceivable without sight; the scroll container is
 * `relative`, because `sr-only` is `position: absolute` and a static
 * `overflow-x-auto` does not clip it — the label escapes and scrolls the page
 * sideways on a phone.
 */

import * as React from 'react'
import { AlertTriangle, ArrowUpDown, Banknote, Clock } from 'lucide-react'

export type RefundStatus = 'released' | 'approved' | 'blocked' | 'rejected'

export interface RefundRow {
  id: string
  order: string
  customer: string
  amount: number
  raisedOn: string
  /** Days since it was raised. Drives the default sort and the urgency style. */
  ageDays: number
  status: RefundStatus
  /** Required when blocked: who or what unblocks it. */
  blocker?: string
}

export interface RefundsOverviewTableProps {
  rows?: RefundRow[]
  /** Days after which an open refund is breaching the promise. */
  promiseDays?: number
  currency?: string
  className?: string
}

const DEFAULT_ROWS: RefundRow[] = [
  { id: 'REF-20390', order: 'ORD-88104', customer: 'A. Ferreira', amount: 214.0, raisedOn: '31 Aug', ageDays: 13, status: 'blocked', blocker: 'Bank details refused — customer contacted twice' },
  { id: 'REF-20402', order: 'ORD-88221', customer: 'Northwind Trading', amount: 1840.5, raisedOn: '2 Sep', ageDays: 11, status: 'blocked', blocker: 'Over the £1,000 approval limit — needs Rhea Patel' },
  { id: 'REF-20411', order: 'ORD-88377', customer: 'K. Ojo', amount: 89.99, raisedOn: '5 Sep', ageDays: 8, status: 'blocked', blocker: 'Awaiting returned goods — carrier scan 4 days ago' },
  { id: 'REF-20418', order: 'ORD-88410', customer: 'M. Haugen', amount: 928.0, raisedOn: '9 Sep', ageDays: 4, status: 'approved' },
  { id: 'REF-20425', order: 'ORD-88502', customer: 'Contoso Logistics', amount: 412.4, raisedOn: '11 Sep', ageDays: 2, status: 'released' },
  { id: 'REF-20431', order: 'ORD-88566', customer: 'S. Baptiste', amount: 64.0, raisedOn: '12 Sep', ageDays: 1, status: 'rejected' },
]

const STATUS_STYLE: Record<RefundStatus, string> = {
  released: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  approved: 'bg-primary/10 text-primary',
  blocked: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  rejected: 'bg-muted text-muted-foreground',
}

const STATUS_LABEL: Record<RefundStatus, string> = {
  released: 'Released',
  approved: 'Approved',
  blocked: 'Blocked',
  rejected: 'Rejected',
}

type SortKey = 'ageDays' | 'amount'

export function RefundsOverviewTable({
  rows = DEFAULT_ROWS,
  promiseDays = 5,
  currency = '£',
  className = '',
}: RefundsOverviewTableProps) {
  // Oldest open first — see the docblock. Not newest-first.
  const [sort, setSort] = React.useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'ageDays',
    dir: 'desc',
  })
  const [only, setOnly] = React.useState<'all' | 'open'>('all')

  const open = (row: RefundRow) => row.status === 'blocked' || row.status === 'approved'

  const visible = React.useMemo(() => {
    const filtered = only === 'open' ? rows.filter(open) : rows
    return [...filtered].sort((a, b) => {
      const delta = a[sort.key] - b[sort.key]
      return sort.dir === 'asc' ? delta : -delta
    })
  }, [rows, only, sort])

  const outstanding = rows.filter(open)
  const breaching = outstanding.filter((row) => row.ageDays > promiseDays)
  const blocked = rows.filter((row) => row.status === 'blocked')
  const released = rows
    .filter((row) => row.status === 'released')
    .reduce((sum, row) => sum + row.amount, 0)

  function money(value: number) {
    return `${currency}${value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
  }

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))
  }

  function ariaSort(key: SortKey) {
    if (sort.key !== key) return 'none' as const
    return sort.dir === 'asc' ? ('ascending' as const) : ('descending' as const)
  }

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Refunds</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Oldest open first. A refund gets slower the longer nobody looks at
              it, so recency is the wrong default here.
            </p>
          </div>
          <div className="flex rounded-lg border border-border p-0.5">
            {(['all', 'open'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setOnly(value)}
                aria-pressed={only === value}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  only === value ? 'bg-muted text-foreground' : 'text-muted-foreground'
                }`}
              >
                {value === 'all' ? 'Everything' : 'Still open'}
              </button>
            ))}
          </div>
        </header>

        {/* Three numbers, and they are the three that matter. */}
        <dl className="mt-5 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          <div className="bg-card p-4">
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Banknote aria-hidden className="h-3.5 w-3.5" />
              Released this period
            </dt>
            <dd className="mt-1.5 text-xl font-bold tracking-tight">{money(released)}</dd>
          </div>
          <div className="bg-card p-4">
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Clock aria-hidden className="h-3.5 w-3.5" />
              Past {promiseDays} days
            </dt>
            <dd className="mt-1.5 text-xl font-bold tracking-tight text-destructive">
              {breaching.length}
            </dd>
          </div>
          <div className="bg-card p-4">
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <AlertTriangle aria-hidden className="h-3.5 w-3.5" />
              Blocked on us
            </dt>
            <dd className="mt-1.5 text-xl font-bold tracking-tight">{blocked.length}</dd>
          </div>
        </dl>

        {/* `relative`: sr-only is absolute, and a static scroller cannot clip it. */}
        <div className="relative mt-5 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[52rem] border-collapse text-sm">
            <caption className="sr-only">
              Refunds, {sort.key === 'ageDays' ? 'by age' : 'by amount'}
            </caption>
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th scope="col" className="px-3 py-2.5 text-start font-semibold">
                  Refund
                </th>
                <th scope="col" className="px-3 py-2.5 text-start font-semibold">
                  Customer
                </th>
                <th scope="col" aria-sort={ariaSort('amount')} className="px-3 py-2.5 text-end font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('amount')}
                    className="inline-flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Amount
                    <ArrowUpDown aria-hidden className="h-3 w-3" />
                  </button>
                </th>
                <th scope="col" aria-sort={ariaSort('ageDays')} className="px-3 py-2.5 text-start font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('ageDays')}
                    className="inline-flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Age
                    <ArrowUpDown aria-hidden className="h-3 w-3" />
                  </button>
                </th>
                <th scope="col" className="px-3 py-2.5 text-start font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const late = open(row) && row.ageDays > promiseDays
                return (
                  <tr key={row.id} className="border-b border-border/70 last:border-0">
                    <td className="px-3 py-3">
                      <a href="#" className="font-mono text-xs font-medium underline-offset-4 hover:underline">
                        {row.id}
                      </a>
                      <span className="block text-xs text-muted-foreground">{row.order}</span>
                    </td>
                    <td className="px-3 py-3">{row.customer}</td>
                    <td className="px-3 py-3 text-end font-medium">{money(row.amount)}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold ${
                          late ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground'
                        }`}
                      >
                        {row.ageDays} day{row.ageDays === 1 ? '' : 's'}
                        {late ? <span className="sr-only"> — past the promise</span> : null}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        raised {row.raisedOn}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLE[row.status]}`}
                      >
                        {STATUS_LABEL[row.status]}
                      </span>
                      {/* Naming the blocker is what makes the queue workable. */}
                      {row.blocker ? (
                        <span className="mt-1 block max-w-[18rem] text-xs text-muted-foreground">
                          {row.blocker}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
