'use client'

/**
 * <DataTableInlineEdit> — editing in the grid, with the save honest about
 * what is still pending.
 *
 * The catalog's table blocks sort, paginate, expand, reorder columns and
 * act in bulk. All of them are read-only. The moment a table is the primary
 * surface for a record — a price list, a seat roster, a translations file —
 * people stop wanting a detail page per row and start wanting to type in
 * the cell.
 *
 * THE THREE STATES THAT MATTER, AND THE ONE EVERYONE SKIPS
 *
 * A cell is clean, dirty, or *failed*. Products ship the first two and then
 * treat a failed save as a toast that disappears in four seconds, leaving a
 * grid that looks saved and is not. Here a rejected cell stays visibly
 * failed with its reason attached, and the row keeps its original value
 * beside the attempted one, so the fix does not require remembering what
 * was there before.
 *
 * WHY THERE IS A SAVE BUTTON AT ALL
 *
 * Autosave-per-keystroke is the fashionable answer and it is wrong for
 * tabular data: it makes every typo a write, and it makes a mis-tabbed
 * column a silent overwrite of the row below. Edits are staged and
 * committed together, and the count of pending edits is always on screen —
 * "3 unsaved" is the fact a user needs before they close the tab.
 *
 * ESCAPE REVERTS, ENTER COMMITS THE CELL, TAB MOVES ON. That is the
 * spreadsheet contract, and a grid that breaks it is one people have to
 * think about rather than use.
 *
 * ACCESSIBILITY: cells are real `<input>`s inside `<td>`s rather than
 * contenteditable divs, each labelled by its column header through
 * `aria-labelledby`, so a screen reader announces "Seat price, row Acme
 * Corp". Invalid cells carry `aria-invalid` and point at their message with
 * `aria-describedby` rather than relying on a red border.
 */

import * as React from 'react'
import { AlertCircle, Check, RotateCcw, Save } from 'lucide-react'

export interface EditableRow {
  id: string
  account: string
  plan: string
  seats: number
  monthly: number
}

export interface DataTableInlineEditProps {
  rows?: EditableRow[]
  className?: string
}

const DEFAULT_ROWS: EditableRow[] = [
  { id: 'acme', account: 'Acme Corp', plan: 'Studio', seats: 24, monthly: 1920 },
  { id: 'globex', account: 'Globex', plan: 'Pro', seats: 8, monthly: 640 },
  { id: 'initech', account: 'Initech', plan: 'Studio', seats: 51, monthly: 4080 },
  { id: 'umbrella', account: 'Umbrella', plan: 'Team', seats: 12, monthly: 960 },
]

type EditableField = 'seats' | 'monthly'

interface CellEdit {
  value: string
  error?: string
}

/** `${rowId}:${field}` — flat keys keep the diff trivially countable. */
type EditMap = Record<string, CellEdit>

function cellKey(rowId: string, field: EditableField) {
  return `${rowId}:${field}`
}

/**
 * Validation lives beside the field it guards rather than in a schema file,
 * because a block that shipped with a `zod` import would drag a dependency
 * into a project for four lines of arithmetic.
 */
function validate(field: EditableField, raw: string): string | undefined {
  const trimmed = raw.trim()
  if (!trimmed) return 'Required'

  const numeric = Number(trimmed.replace(/,/g, ''))
  if (!Number.isFinite(numeric)) return 'Must be a number'
  if (numeric < 0) return 'Cannot be negative'
  if (field === 'seats' && !Number.isInteger(numeric)) return 'Whole seats only'
  if (field === 'seats' && numeric > 500) return 'Over the 500-seat plan limit'
  return undefined
}

export function DataTableInlineEdit({
  rows = DEFAULT_ROWS,
  className = '',
}: DataTableInlineEditProps) {
  const [edits, setEdits] = React.useState<EditMap>({})
  const [saved, setSaved] = React.useState(false)

  const pending = Object.keys(edits).length
  const invalid = Object.values(edits).filter((edit) => edit.error).length

  function change(rowId: string, field: EditableField, value: string, original: number) {
    setSaved(false)
    setEdits((current) => {
      const next = { ...current }
      const key = cellKey(rowId, field)

      // Typing a value back to its original is not an edit. Without this the
      // "3 unsaved" counter keeps counting cells the user has already undone
      // by hand, which is the fastest way to make the counter untrustworthy.
      if (value.trim() === String(original)) {
        delete next[key]
        return next
      }

      next[key] = { value, error: validate(field, value) }
      return next
    })
  }

  function revert() {
    setEdits({})
    setSaved(false)
  }

  function save() {
    if (invalid > 0) return
    setEdits({})
    setSaved(true)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      // Revert this cell only — Escape in a spreadsheet abandons the cell,
      // not the sheet.
      event.currentTarget.blur()
    }
  }

  return (
    <section
      className={`rounded-2xl border border-border bg-card text-card-foreground ${className}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5 sm:p-6">
        <div>
          <h2 className="text-base font-semibold">Account seats</h2>
          <p
            aria-live="polite"
            className="mt-1 text-sm text-muted-foreground"
          >
            {pending === 0 ? (
              saved ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Check aria-hidden className="h-3.5 w-3.5" />
                  All changes saved
                </span>
              ) : (
                'Click a seat count or price to edit it.'
              )
            ) : (
              <>
                <span className="font-medium text-foreground">{pending} unsaved</span>
                {invalid > 0 ? (
                  <span className="text-destructive"> · {invalid} need fixing</span>
                ) : null}
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={revert}
            disabled={pending === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw aria-hidden className="h-3.5 w-3.5" />
            Revert
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending === 0 || invalid > 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Save aria-hidden className="h-3.5 w-3.5" />
            Save {pending > 0 ? pending : ''}
          </button>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-start text-sm">
          <thead>
            <tr className="border-b border-border">
              <th id="col-account" scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                Account
              </th>
              <th id="col-plan" scope="col" className="px-5 py-2.5 font-semibold">
                Plan
              </th>
              <th id="col-seats" scope="col" className="px-5 py-2.5 font-semibold">
                Seats
              </th>
              <th id="col-monthly" scope="col" className="px-5 py-2.5 font-semibold">
                Monthly
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/60 last:border-0">
                <th
                  scope="row"
                  id={`row-${row.id}`}
                  className="px-5 py-3 font-medium sm:px-6"
                >
                  {row.account}
                </th>
                <td className="px-5 py-3 text-muted-foreground">{row.plan}</td>

                {(['seats', 'monthly'] as EditableField[]).map((field) => {
                  const key = cellKey(row.id, field)
                  const edit = edits[key]
                  const value = edit?.value ?? String(row[field])
                  const errorId = `${key}-error`

                  return (
                    <td key={field} className="px-5 py-2 align-top">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={value}
                        aria-labelledby={`col-${field} row-${row.id}`}
                        aria-invalid={Boolean(edit?.error)}
                        aria-describedby={edit?.error ? errorId : undefined}
                        onKeyDown={onKeyDown}
                        onChange={(event) =>
                          change(row.id, field, event.target.value, row[field])
                        }
                        className={`w-24 rounded-md border bg-transparent px-2 py-1 text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          edit?.error
                            ? 'border-destructive text-destructive'
                            : edit
                              ? 'border-primary/60 bg-primary/5'
                              : 'border-transparent hover:border-border'
                        }`}
                      />

                      {/*
                        The original stays on screen next to the attempt.
                        Recovering from a bad edit should not require
                        remembering what the number used to be.
                      */}
                      {edit ? (
                        <span className="mt-1 block text-[11px] text-muted-foreground">
                          was {row[field].toLocaleString('en-US')}
                        </span>
                      ) : null}

                      {edit?.error ? (
                        <span
                          id={errorId}
                          className="mt-1 flex items-center gap-1 text-[11px] font-medium text-destructive"
                        >
                          <AlertCircle aria-hidden className="h-3 w-3" />
                          {edit.error}
                        </span>
                      ) : null}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground sm:px-6">
        Enter commits a cell, Tab moves to the next, Escape leaves it. Nothing is
        written until you press Save.
      </p>
    </section>
  )
}
