'use client'

/**
 * <DataTableBulkActions> — the selection bar, and the question it must ask.
 *
 * Data Tables already had the sortable table, the toolbar, pagination, the
 * expandable row and the column manager. Every one of them treats
 * selection as a checkbox that lights up. None of them answers what
 * happens when the person presses the button.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * "Select all" is two different commands and almost every table ships only
 * one of them. Ticking the header box selects the 8 rows on this page.
 * Wanting all 1,284 rows that match the filter is a *different* intent,
 * and a table that silently upgrades one into the other is how somebody
 * archives a year of records meaning to archive a screenful. So the
 * upgrade is offered as a sentence with the real number in it, taken only
 * on a click, and shown as a distinct state afterwards — the bar says
 * "1,284 rows across every page" and stays saying it.
 *
 * DESTRUCTION COSTS MORE THE MORE OF IT THERE IS
 *
 * Deleting three rows is a button. Deleting 1,284 is a different act, and
 * a confirm dialog that reads the same for both trains people to dismiss
 * it. Above the threshold the button asks for the count to be typed —
 * the one interaction that cannot be muscle-memoried — and below it, it
 * just runs, because friction on the small case is what teaches people to
 * stop reading.
 *
 * UNDO IS A PROMISE WITH A CLOCK ON IT
 *
 * The bar after an action says how long the undo lasts, counting down,
 * because "Undo" with no horizon is a promise the backend will break
 * quietly. When it expires the row says so rather than the control simply
 * vanishing.
 *
 * ACCESSIBILITY: a real `<table>` with a caption; the header box carries
 * its indeterminate state through a ref (there is no such attribute in
 * markup); the action bar is `aria-live="polite"` and every count is in
 * words; the destructive confirmation is a labelled input, not a
 * placeholder pretending to be one.
 */

import * as React from 'react'
import { Archive, Check, Loader2, Tag, Trash2, Undo2, X } from 'lucide-react'

export interface BulkRow {
  id: string
  name: string
  email: string
  plan: string
  lastSeen: string
}

export interface DataTableBulkActionsProps {
  rows?: BulkRow[]
  /** Rows the current filter matches beyond this page. */
  totalMatching?: number
  /** At or above this many rows, deleting asks for the count to be typed. */
  confirmThreshold?: number
  className?: string
}

const DEFAULT_ROWS: BulkRow[] = [
  { id: 'u-1', name: 'Ama Boateng', email: 'ama@meridianfoods.com', plan: 'Team', lastSeen: '2 minutes ago' },
  { id: 'u-2', name: 'Deniz Kaya', email: 'deniz@halden.co', plan: 'Pro', lastSeen: '1 hour ago' },
  { id: 'u-3', name: 'Rafael Ortiz', email: 'rafael@northwind.dev', plan: 'Free', lastSeen: '3 days ago' },
  { id: 'u-4', name: 'Yuki Tanaka', email: 'yuki@brightloom.jp', plan: 'Team', lastSeen: '6 days ago' },
  { id: 'u-5', name: 'Nadia Haddad', email: 'nadia@cedarworks.io', plan: 'Pro', lastSeen: '2 weeks ago' },
  { id: 'u-6', name: 'Tom Sørensen', email: 'tom@fjordlabs.no', plan: 'Free', lastSeen: '1 month ago' },
  { id: 'u-7', name: 'Priya Raman', email: 'priya@sundara.in', plan: 'Team', lastSeen: '1 month ago' },
  { id: 'u-8', name: 'Elise Marchand', email: 'elise@atelier9.fr', plan: 'Free', lastSeen: '3 months ago' },
]

/** How long an undo is honoured. Stated to the user, not just implemented. */
const UNDO_SECONDS = 12

export function DataTableBulkActions({
  rows = DEFAULT_ROWS,
  totalMatching = 1284,
  confirmThreshold = 50,
  className = '',
}: DataTableBulkActionsProps) {
  /*
   * Opens with every row on the page ticked, which is not the state a
   * real table starts in.
   *
   * It is the state this block is *about*: the action bar is up, and the
   * offer to extend the selection to all 1,284 matching rows — the whole
   * reason the component exists — only appears once the page is full. A
   * demo that opened empty would be a screenshot of a table.
   */
  const [selected, setSelected] = React.useState<string[]>(() => rows.map((r) => r.id))
  /** True once the visitor has upgraded the selection past this page. */
  const [wholeFilter, setWholeFilter] = React.useState(false)
  const [confirmText, setConfirmText] = React.useState('')
  const [pendingDelete, setPendingDelete] = React.useState(false)
  const [undo, setUndo] = React.useState<{ label: string; left: number } | null>(null)

  const count = wholeFilter ? totalMatching : selected.length
  const allOnPage = rows.length > 0 && selected.length === rows.length
  const someOnPage = selected.length > 0 && !allOnPage

  const headerBox = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    /* Indeterminate is a property; JSX cannot set it. */
    if (headerBox.current) headerBox.current.indeterminate = someOnPage
  }, [someOnPage])

  /* The undo clock. A promise with no visible horizon is not a promise. */
  React.useEffect(() => {
    if (!undo) return
    if (undo.left <= 0) return
    const timer = window.setTimeout(
      () => setUndo((u) => (u ? { ...u, left: u.left - 1 } : null)),
      1000,
    )
    return () => window.clearTimeout(timer)
  }, [undo])

  function clear() {
    setSelected([])
    setWholeFilter(false)
    setConfirmText('')
    setPendingDelete(false)
  }

  function run(label: string) {
    setUndo({ label, left: UNDO_SECONDS })
    clear()
  }

  const needsTyping = count >= confirmThreshold
  const typedCorrectly = confirmText.trim() === String(count)

  return (
    <section className={`mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 ${className}`}>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <header className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground">Members</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Showing {rows.length} of {totalMatching.toLocaleString('en-US')} matching
              “active in the last year”
            </p>
          </div>
        </header>

        {/*
          The action bar. Live, because it appears under the user's hands
          and the number inside it is the entire basis for the button next
          to it.
        */}
        {count > 0 ? (
          <div
            aria-live="polite"
            className="border-b border-border bg-muted/50 px-5 py-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="min-w-0 flex-1 text-sm text-foreground">
                <strong className="font-semibold tabular-nums">
                  {count.toLocaleString('en-US')}
                </strong>{' '}
                {count === 1 ? 'row' : 'rows'} selected
                {wholeFilter ? ' across every page' : ' on this page'}
              </p>

              <button
                type="button"
                onClick={() => run(`Tagged ${count.toLocaleString('en-US')} members`)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Tag aria-hidden className="h-3.5 w-3.5" />
                Tag
              </button>
              <button
                type="button"
                onClick={() => run(`Archived ${count.toLocaleString('en-US')} members`)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Archive aria-hidden className="h-3.5 w-3.5" />
                Archive
              </button>
              <button
                type="button"
                onClick={() => {
                  if (needsTyping) setPendingDelete(true)
                  else run(`Deleted ${count.toLocaleString('en-US')} members`)
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-destructive px-3 text-xs font-semibold text-destructive-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Trash2 aria-hidden className="h-3.5 w-3.5" />
                Delete
              </button>
              <button
                type="button"
                onClick={clear}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>

            {/*
              The upgrade, offered rather than assumed. This sentence is
              the difference between archiving a screenful and archiving a
              year, and it only ever appears when the whole page is ticked.
            */}
            {allOnPage && !wholeFilter ? (
              <p className="mt-2 text-xs text-muted-foreground">
                All {rows.length} rows on this page are selected.{' '}
                <button
                  type="button"
                  onClick={() => setWholeFilter(true)}
                  className="rounded font-medium text-primary underline underline-offset-2 transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Select all {totalMatching.toLocaleString('en-US')} rows that match this
                  filter
                </button>
              </p>
            ) : null}
            {wholeFilter ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Every row matching the filter is selected, including rows you have not
                seen.{' '}
                <button
                  type="button"
                  onClick={() => setWholeFilter(false)}
                  className="rounded font-medium text-primary underline underline-offset-2 transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Just this page
                </button>
              </p>
            ) : null}

            {/*
              Typed confirmation, above the threshold only. The count is the
              string because it is the one thing that changes with the size
              of the act — a fixed word like DELETE becomes muscle memory
              after the second time.
            */}
            {pendingDelete ? (
              <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/5 p-3">
                <label
                  htmlFor="bulk-confirm"
                  className="block text-xs font-medium text-foreground"
                >
                  This deletes {count.toLocaleString('en-US')} members and cannot be
                  undone. Type <strong className="tabular-nums">{count}</strong> to
                  confirm.
                </label>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    id="bulk-confirm"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    inputMode="numeric"
                    autoComplete="off"
                    className="h-8 w-28 rounded-lg border border-field bg-background px-2 text-sm tabular-nums text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button
                    type="button"
                    disabled={!typedCorrectly}
                    onClick={() => run(`Deleted ${count.toLocaleString('en-US')} members`)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-destructive px-3 text-xs font-semibold text-destructive-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    Delete {count.toLocaleString('en-US')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingDelete(false)
                      setConfirmText('')
                    }}
                    className="rounded-lg px-2 text-xs font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* What just happened, and for how much longer it can be taken back. */}
        {undo ? (
          <div
            aria-live="polite"
            className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-5 py-2.5"
          >
            <Check aria-hidden className="h-4 w-4 text-primary" />
            <p className="min-w-0 flex-1 text-sm text-foreground">{undo.label}</p>
            {undo.left > 0 ? (
              <>
                <span className="text-xs tabular-nums text-muted-foreground">
                  Undo for {undo.left}s
                </span>
                <button
                  type="button"
                  onClick={() => setUndo(null)}
                  className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Undo2 aria-hidden className="h-3.5 w-3.5" />
                  Undo
                </button>
              </>
            ) : (
              /* Expired, said out loud. A control that just disappears
                 leaves the user unsure whether they missed it. */
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 aria-hidden className="h-3.5 w-3.5" />
                Undo window closed
              </span>
            )}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Members matching the current filter. Selecting every row on this page
              offers to extend the selection to all matching rows.
            </caption>
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th scope="col" className="w-10 px-5 py-2">
                  <input
                    ref={headerBox}
                    type="checkbox"
                    checked={allOnPage}
                    onChange={() => {
                      setWholeFilter(false)
                      setSelected(allOnPage ? [] : rows.map((r) => r.id))
                    }}
                    /* accent-primary: the tokens are oklch(), so
                       hsl(var(--primary)) would render browser-blue. */
                    className="h-4 w-4 rounded border-field accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  />
                  <span className="sr-only">Select the {rows.length} rows on this page</span>
                </th>
                <th scope="col" className="px-2 py-2 font-medium">Member</th>
                <th scope="col" className="px-2 py-2 font-medium">Plan</th>
                <th scope="col" className="px-5 py-2 text-right font-medium">Last seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const checked = wholeFilter || selected.includes(row.id)
                return (
                  <tr key={row.id} className={checked ? 'bg-primary/5' : undefined}>
                    <td className="px-5 py-3">
                      <label htmlFor={`row-${row.id}`} className="sr-only">
                        Select {row.name}
                      </label>
                      <input
                        id={`row-${row.id}`}
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setWholeFilter(false)
                          setSelected((s) =>
                            s.includes(row.id)
                              ? s.filter((x) => x !== row.id)
                              : [...s, row.id],
                          )
                        }}
                        className="h-4 w-4 rounded border-field accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      />
                    </td>
                    <td className="px-2 py-3">
                      <p className="font-medium text-foreground">{row.name}</p>
                      <p className="text-xs text-muted-foreground">{row.email}</p>
                    </td>
                    <td className="px-2 py-3">
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                        {row.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                      {row.lastSeen}
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
