'use client'

/**
 * <CrudUpdateForm> — Update, as a page, with the diff on screen.
 *
 * An edit form differs from a create form by exactly one thing, and it is the
 * thing most edit forms leave out: there is a previous value, and the user
 * needs to know which fields they have moved away from it.
 *
 * Without that, three failures are routine. Someone tabs through a form and
 * changes a select by accident, saves, and never knows. Someone makes four
 * edits, gets interrupted, comes back and cannot tell which four. Someone
 * hits Save on a form they only opened to read.
 *
 * SO: PER-FIELD CHANGE MARKERS AND A REVIEW BEFORE SAVE
 *
 *  - A changed field is marked in place, with its previous value legible
 *    beside it, and carries its own Revert. Reverting one field should not
 *    mean reloading the page and losing the other three.
 *  - The primary button is **disabled until something changes** and counts
 *    the changes on its face. "Save 3 changes" is a different promise from
 *    "Save", and the count is the cheapest possible confirmation step.
 *  - The summary is a real diff — old → new — rather than a list of field
 *    names, because "you changed Payment terms" does not tell you whether to
 *    press the button.
 *
 * THE UPDATED-BY LINE IS NOT DECORATION. A shared record is edited by other
 * people, and the last-edited stamp is the only warning a user gets that they
 * may be about to overwrite someone. Optimistic concurrency belongs in the
 * request; showing whose work is at stake belongs here.
 *
 * ACCESSIBILITY: every input has a real `<label>`; the change count is a
 * polite live region so it is announced as fields move; each Revert names its
 * field, so a screen-reader user hears "Revert payment terms" rather than six
 * identical buttons.
 */

import * as React from 'react'
import { ArrowRight, History, RotateCcw } from 'lucide-react'

export interface UpdateField {
  id: string
  label: string
  type?: 'text' | 'email' | 'select' | 'textarea'
  options?: string[]
  hint?: string
  /** The persisted value. Anything else is an unsaved change. */
  original: string
}

export interface CrudUpdateFormProps {
  heading?: string
  lastEdited?: string
  fields?: UpdateField[]
  className?: string
}

const DEFAULT_FIELDS: UpdateField[] = [
  { id: 'name', label: 'Legal name', original: 'Northwind Trading Ltd' },
  { id: 'email', label: 'Billing email', type: 'email', original: 'ap@northwind.example' },
  {
    id: 'terms',
    label: 'Payment terms',
    type: 'select',
    options: ['Net 14', 'Net 30', 'Net 60', 'On receipt'],
    original: 'Net 30',
    hint: 'Applies to orders raised from now on, not to open ones.',
  },
  {
    id: 'currency',
    label: 'Currency',
    type: 'select',
    options: ['GBP', 'EUR', 'USD', 'INR'],
    original: 'EUR',
  },
  {
    id: 'tier',
    label: 'Risk tier',
    type: 'select',
    options: ['Tier 1', 'Tier 2', 'Tier 3'],
    original: 'Tier 2',
  },
  {
    id: 'notes',
    label: 'Internal notes',
    type: 'textarea',
    original: 'Ships from Rotterdam. Lead time doubles in December.',
  },
]

const INPUT_CLASS =
  'w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring'

export function CrudUpdateForm({
  heading = 'Edit supplier',
  lastEdited = 'Sam Okafor, 14 August 2026',
  fields = DEFAULT_FIELDS,
  className = '',
}: CrudUpdateFormProps) {
  const uid = React.useId()
  const initial = React.useMemo(
    () => Object.fromEntries(fields.map((f) => [f.id, f.original])),
    [fields],
  )
  const [values, setValues] = React.useState<Record<string, string>>(initial)
  const [saved, setSaved] = React.useState(false)

  const changed = fields.filter((f) => values[f.id] !== f.original)

  function set(id: string, value: string) {
    setSaved(false)
    setValues((v) => ({ ...v, [id]: value }))
  }

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <form
        className="mx-auto max-w-4xl"
        onSubmit={(event) => {
          event.preventDefault()
          setSaved(true)
        }}
      >
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
            {/* The only warning a user gets that they may overwrite someone. */}
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <History aria-hidden className="h-4 w-4" />
              Last edited by {lastEdited}
            </p>
          </div>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {changed.length === 0
              ? saved
                ? 'Saved. Nothing left to write.'
                : 'No unsaved changes.'
              : `${changed.length} unsaved change${changed.length === 1 ? '' : 's'}.`}
          </p>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {fields.map((field) => {
            const id = `${uid}-${field.id}`
            const dirty = values[field.id] !== field.original
            const wide = field.type === 'textarea'
            const border = dirty ? 'border-primary' : 'border-border'
            return (
              <div key={field.id} className={wide ? 'sm:col-span-2' : undefined}>
                <div className="flex items-baseline justify-between gap-2">
                  <label htmlFor={id} className="text-sm font-medium">
                    {field.label}
                  </label>
                  {dirty ? (
                    <button
                      type="button"
                      onClick={() => set(field.id, field.original)}
                      className="inline-flex items-center gap-1 rounded text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <RotateCcw aria-hidden className="h-3 w-3" />
                      Revert
                      <span className="sr-only"> {field.label}</span>
                    </button>
                  ) : null}
                </div>

                {field.type === 'textarea' ? (
                  <textarea
                    id={id}
                    rows={3}
                    value={values[field.id] ?? ''}
                    onChange={(e) => set(field.id, e.target.value)}
                    aria-describedby={dirty ? `${id}-was` : field.hint ? `${id}-hint` : undefined}
                    className={`mt-1.5 ${INPUT_CLASS} ${border}`}
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={id}
                    value={values[field.id] ?? ''}
                    onChange={(e) => set(field.id, e.target.value)}
                    aria-describedby={dirty ? `${id}-was` : field.hint ? `${id}-hint` : undefined}
                    className={`mt-1.5 ${INPUT_CLASS} ${border}`}
                  >
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={id}
                    type={field.type ?? 'text'}
                    value={values[field.id] ?? ''}
                    onChange={(e) => set(field.id, e.target.value)}
                    aria-describedby={dirty ? `${id}-was` : field.hint ? `${id}-hint` : undefined}
                    className={`mt-1.5 ${INPUT_CLASS} ${border}`}
                  />
                )}

                {dirty ? (
                  <p id={`${id}-was`} className="mt-1.5 truncate text-xs text-primary">
                    Was: {field.original}
                  </p>
                ) : field.hint ? (
                  <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">
                    {field.hint}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>

        {/* A real diff, not a list of field names. */}
        {changed.length > 0 ? (
          <div className="mt-8 rounded-xl border border-primary/40 bg-primary/5 p-4">
            <h2 className="text-sm font-semibold">About to save</h2>
            <ul className="mt-3 space-y-2">
              {changed.map((field) => (
                <li key={field.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{field.label}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs line-through">
                    {field.original || '—'}
                  </span>
                  <ArrowRight aria-hidden className="h-3.5 w-3.5 text-muted-foreground rtl:rotate-180" />
                  <span className="rounded bg-primary/15 px-1.5 py-0.5 text-xs font-medium text-primary">
                    {values[field.id] || '—'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="sticky bottom-0 z-10 mt-8 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-background/90 py-4 backdrop-blur">
          <button
            type="button"
            disabled={changed.length === 0}
            onClick={() => setValues(initial)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Discard all changes
          </button>
          <button
            type="submit"
            disabled={changed.length === 0}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {changed.length === 0
              ? 'Save'
              : `Save ${changed.length} change${changed.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </form>
    </section>
  )
}
