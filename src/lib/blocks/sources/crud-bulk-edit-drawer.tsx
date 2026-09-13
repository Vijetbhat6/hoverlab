'use client'

/**
 * <CrudBulkEditDrawer> — one change, applied to many records.
 *
 * `data-table-bulk-actions` covers the verbs that need no input: archive,
 * export, assign to me. This covers the one that does — editing a field
 * across a selection — and it is a different problem, because the selected
 * records do not agree with each other.
 *
 * MIXED VALUES ARE THE WHOLE DESIGN PROBLEM
 *
 * Seventeen orders are selected. Nine are Net 30, five are Net 60, three are
 * On receipt. A single select showing "Net 30" is a lie that overwrites
 * fourteen records the moment someone presses Save. So every field here has
 * three states, not two:
 *
 *   untouched   left alone entirely — the default, and it must be the default
 *   mixed       shown as "Mixed (3 values)" until deliberately set
 *   set         one value, applied to all
 *
 * The checkbox beside each field is what moves it from untouched to set. No
 * checkbox, no write — which means a bulk edit can never change a field
 * nobody looked at, and that is the property worth protecting.
 *
 * THE COUNT IS ON THE BUTTON AND IT IS ARITHMETIC
 *
 * "Apply to 17 orders" tells you the blast radius. "Save" does not. The
 * button also excludes records the change cannot apply to — three of the
 * seventeen are already dispatched and their terms are frozen — and says so
 * above itself rather than failing halfway and reporting partial success.
 *
 * ACCESSIBILITY: each field is a group whose enable checkbox is labelled with
 * the field name ("Change payment terms"), so a screen reader hears what the
 * checkbox does rather than "checkbox, checked". The excluded-records notice
 * is a polite live region because it changes as fields are enabled.
 */

import * as React from 'react'
import { Check, Info, X } from 'lucide-react'

export interface BulkField {
  id: string
  label: string
  options: string[]
  /** Distinct values across the selection. More than one renders "Mixed". */
  currentValues: string[]
  /** Records this field cannot be changed on, and why. */
  frozen?: { count: number; reason: string }
}

export interface CrudBulkEditDrawerProps {
  selectedCount?: number
  recordNoun?: string
  fields?: BulkField[]
  className?: string
}

const DEFAULT_FIELDS: BulkField[] = [
  {
    id: 'terms',
    label: 'Payment terms',
    options: ['Net 14', 'Net 30', 'Net 60', 'On receipt'],
    currentValues: ['Net 30', 'Net 60', 'On receipt'],
    frozen: { count: 3, reason: 'already dispatched — terms are frozen at dispatch' },
  },
  {
    id: 'site',
    label: 'Delivery site',
    options: ['Rotterdam DC', 'Leeds DC', 'Pune DC'],
    currentValues: ['Rotterdam DC'],
  },
  {
    id: 'approver',
    label: 'Approver',
    options: ['Rhea Patel', 'Sam Okafor', 'Jordan Lee'],
    currentValues: ['Rhea Patel', 'Sam Okafor'],
  },
  {
    id: 'priority',
    label: 'Priority',
    options: ['Standard', 'Expedited'],
    currentValues: ['Standard'],
  },
]

const INPUT_CLASS =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors disabled:opacity-50 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring'

export function CrudBulkEditDrawer({
  selectedCount = 17,
  recordNoun = 'orders',
  fields = DEFAULT_FIELDS,
  className = '',
}: CrudBulkEditDrawerProps) {
  const uid = React.useId()
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>({})
  const [values, setValues] = React.useState<Record<string, string>>({})

  const active = fields.filter((f) => enabled[f.id])
  // The largest frozen count among the enabled fields — a record excluded by
  // one field is excluded from the write for that field only, and the honest
  // headline number is the worst case.
  const excluded = active.reduce((worst, f) => Math.max(worst, f.frozen?.count ?? 0), 0)
  const applyTo = selectedCount - excluded

  return (
    <section className={`flex min-h-[30rem] justify-end bg-muted/30 p-4 ${className}`}>
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby={`${uid}-title`}
        className="flex w-full flex-col rounded-xl border border-border bg-card text-card-foreground sm:w-[28rem]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div>
            <h2 id={`${uid}-title`} className="text-base font-semibold">
              Edit {selectedCount} {recordNoun}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Only the fields you tick are written. Everything else is left
              exactly as it is.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {fields.map((field) => {
            const on = Boolean(enabled[field.id])
            const mixed = field.currentValues.length > 1
            const id = `${uid}-${field.id}`
            return (
              <div
                key={field.id}
                className={`rounded-xl border p-3 transition-colors ${
                  on ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id={`${id}-enable`}
                    checked={on}
                    onChange={(e) =>
                      setEnabled((s) => ({ ...s, [field.id]: e.target.checked }))
                    }
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
                  />
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`${id}-enable`} className="text-sm font-medium">
                      Change {field.label}
                    </label>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {mixed
                        ? `Mixed — ${field.currentValues.length} different values across the selection`
                        : `All ${selectedCount} are currently ${field.currentValues[0]}`}
                    </p>

                    <select
                      id={id}
                      aria-label={field.label}
                      disabled={!on}
                      value={values[field.id] ?? ''}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [field.id]: e.target.value }))
                      }
                      className={`mt-2 ${INPUT_CLASS}`}
                    >
                      <option value="">
                        {mixed ? `Mixed (${field.currentValues.length} values)` : 'Unchanged'}
                      </option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    {on && field.frozen ? (
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                        <Info aria-hidden className="mt-0.5 h-3 w-3 shrink-0" />
                        {field.frozen.count} of the {selectedCount} are{' '}
                        {field.frozen.reason}. They are skipped.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <footer className="space-y-3 border-t border-border p-4">
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {active.length === 0
              ? 'Nothing selected to change yet.'
              : `${active.length} field${active.length === 1 ? '' : 's'} will be written${
                  excluded > 0 ? `, skipping ${excluded} frozen ${recordNoun}` : ''
                }.`}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={active.length === 0}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <Check aria-hidden className="h-4 w-4" />
              Apply to {applyTo} {recordNoun}
            </button>
          </div>
        </footer>
      </div>
    </section>
  )
}
