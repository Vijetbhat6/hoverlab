'use client'

/**
 * <DataTableGroupedRows> — rows collapsed under a group header that carries
 * its own subtotals.
 *
 * The moment a table has a categorical column people stop reading rows and
 * start reading categories. Sorting by that column gets them half way and
 * then leaves them counting by eye; grouping is the other half.
 *
 * THE SUBTOTAL IS THE FEATURE
 *
 * A group header that only says "Enterprise (7)" saves a scroll and answers
 * nothing. The number people came for is the sum, and it has to be on the
 * header while the group is *collapsed* — a subtotal you can only see by
 * expanding the thing you collapsed is decoration.
 *
 * A GRAND TOTAL THAT DOES NOT LIE
 *
 * `<tfoot>` sums every row, not the expanded ones, and says so. Tables that
 * total the visible rows produce a footer that changes when you collapse a
 * group, which reads as a bug even when it is a choice.
 *
 * WHY `<tbody>` PER GROUP. HTML allows many bodies in one table and this is
 * exactly what they are for: the group header is a row inside its own body,
 * so collapsing hides a body rather than filtering a flat list, and the
 * column widths stay put instead of reflowing as groups open and close.
 *
 * ACCESSIBILITY: each header row's button carries `aria-expanded` and
 * `aria-controls` pointing at its `<tbody>` — the pairing the a11y audit
 * flags when only half of it is present. Counts and totals are inside the
 * button's accessible name, so a screen reader hears the summary without
 * having to expand the group to reach it.
 */

import * as React from 'react'
import { ChevronRight } from 'lucide-react'

export interface GroupedRow {
  id: string
  name: string
  owner: string
  seats: number
  arr: number
}

export interface RowGroup {
  id: string
  label: string
  rows: GroupedRow[]
}

export interface DataTableGroupedRowsProps {
  groups?: RowGroup[]
  /** Groups collapsed on first render. */
  initialCollapsed?: string[]
  className?: string
}

const DEFAULT_GROUPS: RowGroup[] = [
  {
    id: 'enterprise',
    label: 'Enterprise',
    rows: [
      { id: 'acme', name: 'Acme Corp', owner: 'R. Patel', seats: 240, arr: 288_000 },
      { id: 'initech', name: 'Initech', owner: 'S. Okafor', seats: 180, arr: 216_000 },
      { id: 'umbrella', name: 'Umbrella', owner: 'R. Patel', seats: 96, arr: 115_200 },
    ],
  },
  {
    id: 'mid-market',
    label: 'Mid-market',
    rows: [
      { id: 'globex', name: 'Globex', owner: 'J. Lindqvist', seats: 48, arr: 46_080 },
      { id: 'soylent', name: 'Soylent', owner: 'S. Okafor', seats: 32, arr: 30_720 },
      { id: 'hooli', name: 'Hooli', owner: 'J. Lindqvist', seats: 25, arr: 24_000 },
    ],
  },
  {
    id: 'smb',
    label: 'Small business',
    rows: [
      { id: 'vehement', name: 'Vehement Capital', owner: 'A. Moreau', seats: 9, arr: 7_776 },
      { id: 'massive', name: 'Massive Dynamic', owner: 'A. Moreau', seats: 6, arr: 5_184 },
    ],
  },
]

const money = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function subtotal(rows: GroupedRow[]) {
  return rows.reduce(
    (acc, row) => ({ seats: acc.seats + row.seats, arr: acc.arr + row.arr }),
    { seats: 0, arr: 0 },
  )
}

export function DataTableGroupedRows({
  groups = DEFAULT_GROUPS,
  initialCollapsed = ['smb'],
  className = '',
}: DataTableGroupedRowsProps) {
  const [collapsed, setCollapsed] = React.useState<string[]>(initialCollapsed)

  const toggle = (id: string) =>
    setCollapsed((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    )

  const grand = subtotal(groups.flatMap((group) => group.rows))

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-border bg-card text-card-foreground ${className}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5 sm:p-6">
        <div>
          <h2 className="text-base font-semibold">Accounts by segment</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {groups.length} segments · {groups.flatMap((g) => g.rows).length} accounts
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(collapsed.length ? [] : groups.map((g) => g.id))}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {collapsed.length ? 'Expand all' : 'Collapse all'}
        </button>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-start text-sm">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                Account
              </th>
              <th scope="col" className="px-5 py-2.5 font-semibold">
                Owner
              </th>
              <th scope="col" className="px-5 py-2.5 text-end font-semibold">
                Seats
              </th>
              <th scope="col" className="px-5 py-2.5 text-end font-semibold">
                ARR
              </th>
            </tr>
          </thead>

          {groups.map((group) => {
            const open = !collapsed.includes(group.id)
            const totals = subtotal(group.rows)
            const bodyId = `group-${group.id}`

            return (
              <tbody key={group.id} id={bodyId} className="border-b border-border last:border-0">
                <tr className="bg-muted/50">
                  <th scope="rowgroup" colSpan={2} className="px-5 py-2.5 sm:px-6">
                    <button
                      type="button"
                      onClick={() => toggle(group.id)}
                      aria-expanded={open}
                      aria-controls={bodyId}
                      className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ChevronRight
                        aria-hidden
                        className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`}
                      />
                      {group.label}
                      <span className="font-normal text-muted-foreground">
                        ({group.rows.length})
                      </span>
                      {/*
                        Inside the button's name on purpose: a screen reader
                        user should hear the subtotal without expanding the
                        group to find it.
                      */}
                      <span className="sr-only">
                        — {totals.seats} seats, {money(totals.arr)} ARR
                      </span>
                    </button>
                  </th>
                  <td className="px-5 py-2.5 text-end font-semibold tabular-nums">
                    {totals.seats.toLocaleString('en-US')}
                  </td>
                  <td className="px-5 py-2.5 text-end font-semibold tabular-nums">
                    {money(totals.arr)}
                  </td>
                </tr>

                {open
                  ? group.rows.map((row) => (
                      <tr key={row.id} className="border-t border-border/50">
                        <th scope="row" className="px-5 py-3 ps-11 font-medium sm:px-6 sm:ps-12">
                          {row.name}
                        </th>
                        <td className="px-5 py-3 text-muted-foreground">{row.owner}</td>
                        <td className="px-5 py-3 text-end tabular-nums text-muted-foreground">
                          {row.seats.toLocaleString('en-US')}
                        </td>
                        <td className="px-5 py-3 text-end tabular-nums text-muted-foreground">
                          {money(row.arr)}
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            )
          })}

          <tfoot>
            <tr className="border-t-2 border-border bg-muted/30">
              <th scope="row" colSpan={2} className="px-5 py-3 font-semibold sm:px-6">
                All segments
                <span className="ml-2 font-normal text-muted-foreground">
                  including collapsed
                </span>
              </th>
              <td className="px-5 py-3 text-end font-semibold tabular-nums">
                {grand.seats.toLocaleString('en-US')}
              </td>
              <td className="px-5 py-3 text-end font-semibold tabular-nums">
                {money(grand.arr)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}
