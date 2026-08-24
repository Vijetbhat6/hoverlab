'use client'

/**
 * <DataTableColumnManager> — show, hide and reorder a table's columns.
 *
 * The control that turns a fixed report into a table people can live in.
 * Three things it gets right that most implementations do not:
 *
 *  - Reordering works from the keyboard. Almost every column manager is
 *    drag-only, which means it does not work for anyone using a keyboard,
 *    a screen reader, or a trackpad they find fiddly. Move-up/move-down
 *    buttons are unglamorous and they work for everybody; a drag handle can
 *    be added on top, never underneath.
 *
 *  - Pinned columns cannot be hidden or moved out of the front. An id
 *    column that scrolls away or disappears leaves rows nothing to identify
 *    them by, and the resulting table is unreadable in a way the user
 *    cannot diagnose.
 *
 *  - The last visible column cannot be hidden. A table with zero columns is
 *    a blank rectangle with no way back, and users find it by unchecking
 *    boxes one at a time.
 *
 * Order is the array's order. There is no `position: number` field to keep
 * consistent, because two sources of truth for order is how a column ends
 * up in two places at once.
 */

import * as React from 'react'
import { ArrowUp, ArrowDown, Check, Pin, Columns3, RotateCcw } from 'lucide-react'

export interface ColumnDef {
  id: string
  label: string
  visible: boolean
  /** Always shown, always first. Cannot be hidden or reordered. */
  pinned?: boolean
}

export interface DataTableColumnManagerProps {
  columns?: ColumnDef[]
  onChange?: (next: ColumnDef[]) => void
  className?: string
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  { id: 'name', label: 'Name', visible: true, pinned: true },
  { id: 'status', label: 'Status', visible: true },
  { id: 'owner', label: 'Owner', visible: true },
  { id: 'plan', label: 'Plan', visible: true },
  { id: 'seats', label: 'Seats', visible: false },
  { id: 'created', label: 'Created', visible: true },
  { id: 'lastActive', label: 'Last active', visible: false },
  { id: 'mrr', label: 'MRR', visible: false },
]

/**
 * Move a column one place, without letting it cross the pinned block.
 *
 * Exported because the index arithmetic is the part worth testing: an
 * off-by-one here silently swaps the wrong pair, and the bug is invisible
 * in a screenshot.
 */
export function moveColumn(columns: ColumnDef[], id: string, delta: -1 | 1): ColumnDef[] {
  const from = columns.findIndex((c) => c.id === id)
  if (from < 0 || columns[from]!.pinned) return columns

  const to = from + delta
  if (to < 0 || to >= columns.length) return columns
  // Refuse to swap with a pinned column rather than silently doing nothing
  // at a different index — the caller's guard and this one agree.
  if (columns[to]!.pinned) return columns

  const next = [...columns]
  ;[next[from], next[to]] = [next[to]!, next[from]!]
  return next
}

export function DataTableColumnManager({
  columns = DEFAULT_COLUMNS,
  onChange,
  className,
}: DataTableColumnManagerProps) {
  const [initial] = React.useState(columns)
  const [state, setState] = React.useState(columns)

  const commit = (next: ColumnDef[]) => {
    setState(next)
    onChange?.(next)
  }

  const visibleCount = state.filter((c) => c.visible).length

  const toggle = (id: string) => {
    const column = state.find((c) => c.id === id)
    if (!column || column.pinned) return
    // The last visible column stays visible. See the note at the top.
    if (column.visible && visibleCount <= 1) return
    commit(state.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)))
  }

  const firstMovable = state.findIndex((c) => !c.pinned)

  return (
    <section
      className={`w-full max-w-sm rounded-2xl border border-border/60 bg-card ${className ?? ''}`}
      aria-labelledby="columns-heading"
    >
      <header className="flex items-center gap-2 border-b border-border/60 px-5 py-3.5">
        <Columns3 aria-hidden className="h-4 w-4 text-muted-foreground" />
        <h2 id="columns-heading" className="text-sm font-semibold tracking-tight">
          Columns
        </h2>
        <span className="text-xs text-muted-foreground">
          {visibleCount} of {state.length} shown
        </span>
        <button
          type="button"
          onClick={() => commit(initial)}
          className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <RotateCcw aria-hidden className="h-3 w-3" />
          Reset
        </button>
      </header>

      <ul className="py-1.5">
        {state.map((column, index) => {
          const canMoveUp = !column.pinned && index > firstMovable
          const canMoveDown = !column.pinned && index < state.length - 1
          const lastVisible = column.visible && visibleCount <= 1

          return (
            <li key={column.id} className="flex items-center gap-2 px-3 py-1">
              <label
                className={`flex flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm ${
                  column.pinned || lastVisible
                    ? 'cursor-not-allowed opacity-60'
                    : 'cursor-pointer hover:bg-muted/60'
                }`}
                title={
                  column.pinned
                    ? 'Pinned columns are always shown'
                    : lastVisible
                      ? 'At least one column has to stay visible'
                      : undefined
                }
              >
                <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={column.visible}
                    disabled={column.pinned || lastVisible}
                    onChange={() => toggle(column.id)}
                    className="peer h-4 w-4 appearance-none rounded border border-border bg-background checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed"
                  />
                  <Check
                    aria-hidden
                    className="pointer-events-none absolute h-3 w-3 text-primary-foreground opacity-0 peer-checked:opacity-100"
                  />
                </span>
                <span className="flex-1 truncate">{column.label}</span>
                {column.pinned ? (
                  <Pin aria-hidden className="h-3 w-3 shrink-0 text-muted-foreground" />
                ) : null}
              </label>

              {/*
                Buttons, not a drag handle. Reordering has to work without a
                pointer; a handle is an addition, never the only route.
              */}
              <span className="flex shrink-0 items-center">
                <button
                  type="button"
                  disabled={!canMoveUp}
                  onClick={() => commit(moveColumn(state, column.id, -1))}
                  aria-label={`Move ${column.label} up`}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-25"
                >
                  <ArrowUp aria-hidden className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={!canMoveDown}
                  onClick={() => commit(moveColumn(state, column.id, 1))}
                  aria-label={`Move ${column.label} down`}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-25"
                >
                  <ArrowDown aria-hidden className="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          )
        })}
      </ul>

      {/*
        Announced, not merely drawn. Someone reordering with the keyboard
        gets no visual scan of the list, so the resulting order has to be
        readable as text.
      */}
      <p aria-live="polite" className="sr-only">
        Column order: {state.filter((c) => c.visible).map((c) => c.label).join(', ')}
      </p>
    </section>
  )
}
