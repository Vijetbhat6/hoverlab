'use client'

/**
 * <CrudArchiveRestore> — the bin, and the clock running on it.
 *
 * Soft delete is the setting almost every internal tool turns on and almost
 * none of them builds a screen for. The row disappears from the list, a
 * `deleted_at` column fills in, and the only way to get it back is a support
 * request that ends in someone running SQL.
 *
 * WHAT AN ARCHIVE SCREEN OWES ITS USER
 *
 *  - **The deadline, per record, in days.** "Archived" is not a state, it is
 *    a countdown. A row with four days left and a row with ninety are not the
 *    same row, and sorting by soonest-purge is the default here for that
 *    reason.
 *  - **Who archived it, and when.** Restoring someone else's deletion without
 *    knowing it was deliberate is how the same record gets deleted twice.
 *  - **A real difference between restore and purge.** Restore is one click
 *    and reversible. Purge is guarded and final, and they must not sit next
 *    to each other looking alike — so purge is destructive-styled, out of the
 *    row, and only reachable through selection.
 *
 * THE RESTORE CAN FAIL, AND THE REASON IS INTERESTING
 *
 * A record whose parent has been purged cannot come back to anything. Rather
 * than a generic error on click, those rows are marked up front and their
 * Restore is disabled with the reason — the workspace they belonged to is
 * gone, so restoring would produce an orphan. This is the counterpart of the
 * "orphaned" fate in `crud-delete-cascade`, seen from the other end.
 *
 * ACCESSIBILITY: a real `<table>` with scoped column headers, because this is
 * tabular data and a list of divs is not. Selection is a checkbox per row
 * labelled with the record's name, and the header checkbox reflects the
 * indeterminate state through the DOM property — `indeterminate` is not an
 * attribute and cannot be set in JSX. The purge bar is a live region.
 */

import * as React from 'react'
import { ArchiveRestore, Ban, Clock, Trash2 } from 'lucide-react'

export interface ArchivedRecord {
  id: string
  name: string
  kind: string
  archivedBy: string
  archivedOn: string
  /** Days until it is purged. Small numbers are styled as urgent. */
  daysLeft: number
  /** Set when the record cannot be restored, with the reason. */
  blocked?: string
}

export interface CrudArchiveRestoreProps {
  records?: ArchivedRecord[]
  retentionDays?: number
  className?: string
}

const DEFAULT_RECORDS: ArchivedRecord[] = [
  {
    id: 'prj-91',
    name: 'Warehouse relabelling',
    kind: 'Project',
    archivedBy: 'Sam Okafor',
    archivedOn: '9 Sep 2026',
    daysLeft: 3,
  },
  {
    id: 'sup-208',
    name: 'Fabrikam Parts GmbH',
    kind: 'Supplier',
    archivedBy: 'Rhea Patel',
    archivedOn: '2 Sep 2026',
    daysLeft: 11,
  },
  {
    id: 'doc-4412',
    name: 'Q3 carrier tender',
    kind: 'Document',
    archivedBy: 'Jordan Lee',
    archivedOn: '28 Aug 2026',
    daysLeft: 16,
    blocked: 'its workspace was purged on 1 September',
  },
  {
    id: 'prj-88',
    name: 'Returns triage rewrite',
    kind: 'Project',
    archivedBy: 'Rhea Patel',
    archivedOn: '21 Aug 2026',
    daysLeft: 44,
  },
]

export function CrudArchiveRestore({
  records = DEFAULT_RECORDS,
  retentionDays = 90,
  className = '',
}: CrudArchiveRestoreProps) {
  const uid = React.useId()
  const [rows, setRows] = React.useState<ArchivedRecord[]>(
    // Soonest purge first: a countdown list sorted by name is a list that
    // buries the row about to disappear.
    [...records].sort((a, b) => a.daysLeft - b.daysLeft),
  )
  const [selected, setSelected] = React.useState<string[]>([])
  const [restored, setRestored] = React.useState<string | null>(null)
  const headerBox = React.useRef<HTMLInputElement>(null)

  const selectable = rows.filter((row) => !row.blocked)
  const allSelected = selectable.length > 0 && selected.length === selectable.length

  React.useEffect(() => {
    // `indeterminate` is a DOM property, not an attribute — it cannot be set
    // from JSX and has to be written after render.
    if (headerBox.current) {
      headerBox.current.indeterminate = selected.length > 0 && !allSelected
    }
  }, [selected.length, allSelected])

  function restore(row: ArchivedRecord) {
    setRows((r) => r.filter((item) => item.id !== row.id))
    setSelected((s) => s.filter((id) => id !== row.id))
    setRestored(row.name)
  }

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Archive</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Archived records are kept for {retentionDays} days and then
              permanently removed. Sorted by whichever goes first.
            </p>
          </div>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {restored ? `${restored} restored.` : `${rows.length} archived records.`}
          </p>
        </header>

        {selected.length > 0 ? (
          <div
            role="status"
            className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-3"
          >
            <p className="text-sm">
              <span className="font-semibold">{selected.length} selected.</span>{' '}
              <span className="text-muted-foreground">
                Purging removes them now, before the retention clock runs out.
              </span>
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Trash2 aria-hidden className="h-4 w-4" />
              Purge {selected.length} permanently
            </button>
          </div>
        ) : null}

        {/* `relative` on the scroller: sr-only is position:absolute, and a
            static overflow-x container does not clip it — the label escapes
            and scrolls the whole page sideways on a phone. */}
        <div className="relative mt-5 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[42rem] border-collapse text-sm">
            <caption className="sr-only">
              Archived records, soonest to be purged first
            </caption>
            <thead>
              <tr className="border-b border-border bg-muted/50 text-start">
                <th scope="col" className="w-10 px-3 py-2.5">
                  <input
                    ref={headerBox}
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) =>
                      setSelected(e.target.checked ? selectable.map((r) => r.id) : [])
                    }
                    aria-label="Select every restorable record"
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                </th>
                <th scope="col" className="px-3 py-2.5 text-start font-semibold">
                  Record
                </th>
                <th scope="col" className="px-3 py-2.5 text-start font-semibold">
                  Archived
                </th>
                <th scope="col" className="px-3 py-2.5 text-start font-semibold">
                  Purged in
                </th>
                <th scope="col" className="px-3 py-2.5 text-end font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const urgent = row.daysLeft <= 7
                return (
                  <tr key={row.id} className="border-b border-border/70 last:border-0">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        id={`${uid}-${row.id}`}
                        checked={selected.includes(row.id)}
                        disabled={Boolean(row.blocked)}
                        onChange={(e) =>
                          setSelected((s) =>
                            e.target.checked ? [...s, row.id] : s.filter((id) => id !== row.id),
                          )
                        }
                        className="h-4 w-4 rounded border-border accent-primary disabled:opacity-40"
                      />
                      <label htmlFor={`${uid}-${row.id}`} className="sr-only">
                        Select {row.name}
                      </label>
                    </td>
                    <td className="px-3 py-3">
                      <span className="block font-medium">{row.name}</span>
                      <span className="block text-xs text-muted-foreground">{row.kind}</span>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      <span className="block">{row.archivedOn}</span>
                      <span className="block text-xs">by {row.archivedBy}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold ${
                          urgent
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Clock aria-hidden className="h-3 w-3" />
                        {row.daysLeft} days
                      </span>
                    </td>
                    <td className="px-3 py-3 text-end">
                      {row.blocked ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Ban aria-hidden className="h-3.5 w-3.5" />
                          Cannot restore — {row.blocked}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => restore(row)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <ArchiveRestore aria-hidden className="h-3.5 w-3.5" />
                          Restore
                          <span className="sr-only"> {row.name}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {rows.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            The archive is empty. Records deleted from a list land here first.
          </p>
        ) : null}
      </div>
    </section>
  )
}
