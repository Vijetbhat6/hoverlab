'use client'

/**
 * <DataTableSortable> — a sortable, selectable table.
 *
 * The details that make this worth lifting rather than rewriting:
 *
 *  - `aria-sort` on the sorted column header. Without it a screen reader
 *    user has no way to know the table is ordered at all, let alone by what.
 *  - The header checkbox goes *indeterminate* when the selection is
 *    partial. `indeterminate` is a DOM property with no HTML attribute, so
 *    it has to be set through a ref — which is exactly why hand-rolled
 *    versions skip it and end up with a header box that lies.
 *  - Sorting is stable and type-aware: numbers compare numerically, strings
 *    through `localeCompare`. A numeric column sorted lexically puts 100
 *    before 9, and it is always caught late.
 *  - Selection survives sorting, because it is keyed by row id rather than
 *    by index.
 */

import * as React from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal } from 'lucide-react'

export interface Column<T> {
  key: keyof T & string
  header: string
  sortable?: boolean
  align?: 'left' | 'right'
  /** Custom cell rendering — falls back to the raw value. */
  render?: (row: T) => React.ReactNode
}

export interface Row {
  id: string
  name: string
  email: string
  plan: string
  mrr: number
  status: 'active' | 'trialing' | 'churned'
}

export interface DataTableSortableProps {
  rows?: Row[]
  columns?: Column<Row>[]
  className?: string
}

const STATUS_TONE: Record<Row['status'], string> = {
  active: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  trialing: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  churned: 'bg-muted text-muted-foreground',
}

const DEFAULT_ROWS: Row[] = [
  { id: '1', name: 'Northwind Ltd', email: 'ops@northwind.com', plan: 'Team', mrr: 490, status: 'active' },
  { id: '2', name: 'Contoso', email: 'billing@contoso.io', plan: 'Pro', mrr: 190, status: 'active' },
  { id: '3', name: 'Initech', email: 'admin@initech.dev', plan: 'Pro', mrr: 190, status: 'trialing' },
  { id: '4', name: 'Globex', email: 'finance@globex.co', plan: 'Team', mrr: 980, status: 'active' },
  { id: '5', name: 'Umbrella', email: 'it@umbrella.org', plan: 'Free', mrr: 0, status: 'churned' },
  { id: '6', name: 'Vandelay', email: 'george@vandelay.com', plan: 'Pro', mrr: 90, status: 'trialing' },
]

const DEFAULT_COLUMNS: Column<Row>[] = [
  { key: 'name', header: 'Customer', sortable: true },
  { key: 'plan', header: 'Plan', sortable: true },
  {
    key: 'mrr',
    header: 'MRR',
    sortable: true,
    align: 'right',
    render: (row) => (row.mrr === 0 ? '—' : `$${row.mrr.toLocaleString('en-US')}`),
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (row) => (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_TONE[row.status]}`}
      >
        {row.status}
      </span>
    ),
  },
]

type Direction = 'asc' | 'desc'

export function DataTableSortable({
  rows = DEFAULT_ROWS,
  columns = DEFAULT_COLUMNS,
  className = '',
}: DataTableSortableProps) {
  const [sortKey, setSortKey] = React.useState<keyof Row & string>('name')
  const [direction, setDirection] = React.useState<Direction>('asc')
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set())

  const headerBox = React.useRef<HTMLInputElement>(null)

  const allSelected = rows.length > 0 && selected.size === rows.length
  const someSelected = selected.size > 0 && !allSelected

  // `indeterminate` has no HTML attribute — React cannot set it as a prop,
  // so it has to be written to the DOM node directly.
  React.useEffect(() => {
    if (headerBox.current) headerBox.current.indeterminate = someSelected
  }, [someSelected])

  const sorted = React.useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      const left = a[sortKey]
      const right = b[sortKey]

      const result =
        typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left).localeCompare(String(right))

      return direction === 'asc' ? result : -result
    })
    return copy
  }, [rows, sortKey, direction])

  function toggleSort(key: keyof Row & string) {
    if (key === sortKey) {
      setDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setDirection('asc')
    }
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-border/60 bg-card/60 ${className}`}>
      {selected.size > 0 ? (
        <div
          aria-live="polite"
          className="flex items-center gap-3 border-b border-border/60 bg-primary/5 px-4 py-2.5 text-sm"
        >
          <span className="font-medium">{selected.size} selected</span>
          <button type="button" className="text-muted-foreground hover:text-foreground">
            Export
          </button>
          <button type="button" className="text-destructive hover:underline">
            Delete
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ms-auto text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th scope="col" className="w-10 px-4 py-3">
                <input
                  ref={headerBox}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label={allSelected ? 'Deselect all rows' : 'Select all rows'}
                  className="h-4 w-4 rounded border-border/60 accent-primary"
                />
              </th>

              {columns.map((col) => {
                const isSorted = col.key === sortKey
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={
                      isSorted ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'
                    }
                    className={`px-4 py-3 font-semibold ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
                          col.align === 'right' ? 'flex-row-reverse' : ''
                        } ${isSorted ? '' : 'text-muted-foreground'}`}
                      >
                        {col.header}
                        {isSorted ? (
                          direction === 'asc' ? (
                            <ChevronUp aria-hidden className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown aria-hidden className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ChevronsUpDown aria-hidden className="h-3.5 w-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                )
              })}

              <th scope="col" className="w-10 px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {sorted.map((row) => {
              const isSelected = selected.has(row.id)
              return (
                <tr
                  key={row.id}
                  data-state={isSelected ? 'selected' : undefined}
                  className={`border-b border-border/40 last:border-0 transition-colors ${
                    isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(row.id)}
                      aria-label={`Select ${row.name}`}
                      className="h-4 w-4 rounded border-border/60 accent-primary"
                    />
                  </td>

                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 ${col.align === 'right' ? 'text-right tabular-nums' : ''}`}
                    >
                      {col.render ? (
                        col.render(row)
                      ) : col.key === 'name' ? (
                        <span>
                          <span className="block font-medium">{row.name}</span>
                          <span className="block text-xs text-muted-foreground">{row.email}</span>
                        </span>
                      ) : (
                        String(row[col.key])
                      )}
                    </td>
                  ))}

                  <td className="px-4 py-3">
                    <button
                      type="button"
                      aria-label={`Actions for ${row.name}`}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <MoreHorizontal aria-hidden className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
