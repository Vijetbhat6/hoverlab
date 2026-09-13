'use client'

/**
 * <CrudCreateDrawer> — Create, in a side drawer, with the list still there.
 *
 * The middle of the three create surfaces, and the one that earns its place
 * on a long form. A modal caps out at about four fields; a page throws away
 * the list you are adding to. A drawer keeps both: the table stays legible on
 * the start side, and the form gets vertical room and a scroll of its own.
 *
 * THE SCROLL BELONGS TO THE FORM, NOT THE PAGE
 *
 * The header and the action footer are pinned and only the fields scroll.
 * That is the difference between a drawer and a modal that got tall: the
 * primary action never leaves the screen, so nobody fills in nine fields and
 * then hunts for Save.
 *
 * WHY THE STEP COUNTER AND NOT A WIZARD
 *
 * A wizard hides fields behind Next, which makes reviewing what you typed a
 * navigation task and makes "which step had the error" a real question. The
 * groups here are all rendered, all scrollable, and the counter is a progress
 * report rather than a gate. Use `setup-wizard` when the steps genuinely
 * depend on each other; use this when they are just long.
 *
 * WIDTH IS CAPPED. A drawer that covers the list defeats its own argument, so
 * it stops at 30rem and goes full-width only below `sm`, where the list is
 * not visible anyway.
 *
 * ACCESSIBILITY: `role="dialog"` with `aria-modal="false"` — deliberately
 * non-modal, because the list behind stays readable and claiming modality
 * would be a lie. Each group is a `<fieldset>` with a `<legend>`; the
 * required count in the footer is a live region, so a screen-reader user
 * learns the form became submittable without polling the button.
 */

import * as React from 'react'
import { Check, Plus, X } from 'lucide-react'

export interface DrawerField {
  id: string
  label: string
  type?: 'text' | 'email' | 'number' | 'date' | 'textarea' | 'select'
  options?: string[]
  required?: boolean
  placeholder?: string
  hint?: string
}

export interface DrawerGroup {
  id: string
  title: string
  fields: DrawerField[]
}

export interface CrudCreateDrawerProps {
  heading?: string
  groups?: DrawerGroup[]
  listRows?: string[]
  className?: string
}

const DEFAULT_GROUPS: DrawerGroup[] = [
  {
    id: 'basics',
    title: 'Basics',
    fields: [
      { id: 'title', label: 'Asset name', required: true, placeholder: 'Forklift 04' },
      {
        id: 'category',
        label: 'Category',
        type: 'select',
        required: true,
        options: ['Material handling', 'Refrigeration', 'Vehicles', 'IT hardware'],
      },
      { id: 'serial', label: 'Serial number', placeholder: 'TL-2291-A' },
    ],
  },
  {
    id: 'location',
    title: 'Location',
    fields: [
      {
        id: 'site',
        label: 'Site',
        type: 'select',
        required: true,
        options: ['Rotterdam DC', 'Leeds DC', 'Pune DC'],
      },
      { id: 'zone', label: 'Zone', placeholder: 'Aisle 12, bay 3' },
      {
        id: 'custodian',
        label: 'Custodian',
        type: 'select',
        options: ['Rhea Patel', 'Sam Okafor', 'Jordan Lee'],
      },
    ],
  },
  {
    id: 'lifecycle',
    title: 'Lifecycle',
    fields: [
      { id: 'acquired', label: 'Acquired on', type: 'date' },
      { id: 'value', label: 'Book value', type: 'number', placeholder: '18400' },
      {
        id: 'service',
        label: 'Service interval',
        type: 'select',
        options: ['Monthly', 'Quarterly', 'Every 6 months', 'Annually'],
        hint: 'Drives the maintenance schedule. Changeable later.',
      },
      {
        id: 'notes',
        label: 'Commissioning notes',
        type: 'textarea',
        placeholder: 'Battery replaced before handover.',
      },
    ],
  },
]

const DEFAULT_ROWS = [
  'Forklift 03 · Rotterdam DC',
  'Chiller 11 · Leeds DC',
  'Pallet wrapper 02 · Pune DC',
  'Forklift 02 · Rotterdam DC',
  'Scanner cart 07 · Leeds DC',
]

const INPUT_CLASS =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring'

export function CrudCreateDrawer({
  heading = 'New asset',
  groups = DEFAULT_GROUPS,
  listRows = DEFAULT_ROWS,
  className = '',
}: CrudCreateDrawerProps) {
  const uid = React.useId()
  const [open, setOpen] = React.useState(true)
  const [values, setValues] = React.useState<Record<string, string>>({
    title: 'Forklift 04',
    category: 'Material handling',
  })

  const required = groups.flatMap((g) => g.fields).filter((f) => f.required)
  const outstanding = required.filter((f) => !(values[f.id] ?? '').trim())

  return (
    <section
      className={`flex min-h-[32rem] gap-4 overflow-hidden bg-muted/30 p-4 ${className}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false)
      }}
    >
      {/* The list is the reason this is a drawer and not a page. */}
      <div className="hidden min-w-0 flex-1 sm:block">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Assets</h2>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus aria-hidden className="h-3.5 w-3.5" />
            New
          </button>
        </div>
        <ul className="mt-3 space-y-1.5">
          {listRows.map((row) => (
            <li
              key={row}
              className="truncate rounded-lg border border-border bg-card/60 px-3 py-2.5 text-sm"
            >
              {row}
            </li>
          ))}
        </ul>
      </div>

      {open ? (
        <div
          role="dialog"
          // Non-modal on purpose: the list stays usable behind it.
          aria-modal="false"
          aria-labelledby={`${uid}-heading`}
          className="flex w-full flex-col rounded-xl border border-border bg-card text-card-foreground sm:w-[30rem] sm:shrink-0"
        >
          <header className="flex items-start justify-between gap-3 border-b border-border p-4">
            <div>
              <h2 id={`${uid}-heading`} className="text-base font-semibold">
                {heading}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {groups.length} groups · {required.length} required fields
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          </header>

          {/* Only this scrolls. The footer below never leaves the screen. */}
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
            {groups.map((group) => (
              <fieldset key={group.id} className="border-0 p-0">
                <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </legend>
                <div className="mt-3 space-y-3.5">
                  {group.fields.map((field) => {
                    const id = `${uid}-${field.id}`
                    const common = {
                      id,
                      required: field.required,
                      value: values[field.id] ?? '',
                      'aria-describedby': field.hint ? `${id}-hint` : undefined,
                      className: `mt-1.5 ${INPUT_CLASS}`,
                    }
                    return (
                      <div key={field.id}>
                        <label htmlFor={id} className="block text-sm font-medium">
                          {field.label}
                          {field.required ? null : (
                            <span className="ms-2 text-xs font-normal text-muted-foreground">
                              Optional
                            </span>
                          )}
                        </label>

                        {field.type === 'textarea' ? (
                          <textarea
                            {...common}
                            rows={3}
                            placeholder={field.placeholder}
                            onChange={(e) =>
                              setValues((v) => ({ ...v, [field.id]: e.target.value }))
                            }
                          />
                        ) : field.type === 'select' ? (
                          <select
                            {...common}
                            onChange={(e) =>
                              setValues((v) => ({ ...v, [field.id]: e.target.value }))
                            }
                          >
                            <option value="">Choose…</option>
                            {field.options?.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            {...common}
                            type={field.type ?? 'text'}
                            placeholder={field.placeholder}
                            onChange={(e) =>
                              setValues((v) => ({ ...v, [field.id]: e.target.value }))
                            }
                          />
                        )}

                        {field.hint ? (
                          <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">
                            {field.hint}
                          </p>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          <footer className="space-y-3 border-t border-border p-4">
            <p
              aria-live="polite"
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              {outstanding.length === 0 ? (
                <>
                  <Check aria-hidden className="h-3.5 w-3.5 text-emerald-600" />
                  Every required field is filled.
                </>
              ) : (
                `${outstanding.length} required field${
                  outstanding.length === 1 ? '' : 's'
                } left: ${outstanding.map((f) => f.label).join(', ')}.`
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={outstanding.length > 0}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                Create asset
              </button>
            </div>
          </footer>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Reopen the drawer
          </button>
        </div>
      )}
    </section>
  )
}
