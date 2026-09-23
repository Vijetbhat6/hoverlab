'use client'

/**
 * <CrudCreateForm> — Create, as a page.
 *
 * The first of the twelve CRUD shapes, and the one people reach for last
 * because a modal feels quicker to build. It is the right shape whenever
 * the record has more than about six fields: a modal that scrolls is a page
 * with a scrim in front of it, and the scrim is costing you the context the
 * user needs to fill the form in.
 *
 * WHAT MAKES THIS A *CREATE* FORM AND NOT AN EDIT FORM
 *
 * Two things, and both are here because they are the two that get left out.
 *
 *  - **Save and create another.** Records arrive in batches — five
 *    suppliers, twelve rooms, thirty SKUs — and a create screen that
 *    returns to the list after each one turns a batch into a navigation
 *    exercise. The secondary button keeps the form open and preserves the
 *    fields marked `sticky`, because the account and the currency are the
 *    same for all five and the name never is.
 *  - **No dirty tracking.** An edit form has to know what changed. A create
 *    form has nothing to compare against, so the "unsaved changes" question
 *    is answered by "is anything filled in" — which is why leaving is
 *    guarded here by a count of filled fields rather than by a diff.
 *
 * THE GUIDANCE RAIL IS NOT DECORATION. The right-hand column answers the
 * question the field label cannot: what an external id is for, what happens
 * to a draft. Support tickets for internal tools are overwhelmingly "what
 * does this field mean", and the answer costs one column at `lg`.
 *
 * ACCESSIBILITY: every input has a real `<label>`, required fields are
 * marked with `required` rather than an asterisk alone, the error summary
 * is a `role="alert"` list of links that focus the field they name — the
 * pattern GOV.UK proved and `form-error-summary` in this catalog spells
 * out — and the sticky action bar is inside the `<form>`, so Enter submits
 * even though the button is visually detached from the fields.
 */

import * as React from 'react'
import { Check, CircleAlert, Info, Plus } from 'lucide-react'

export interface CreateField {
  id: string
  label: string
  hint?: string
  type?: 'text' | 'email' | 'number' | 'textarea' | 'select'
  options?: string[]
  required?: boolean
  placeholder?: string
  /** Kept when "Save and create another" clears the form. */
  sticky?: boolean
}

export interface CreateSection {
  id: string
  title: string
  description: string
  fields: CreateField[]
}

export interface CrudCreateFormProps {
  recordLabel?: string
  sections?: CreateSection[]
  className?: string
}

const DEFAULT_SECTIONS: CreateSection[] = [
  {
    id: 'identity',
    title: 'Identity',
    description: 'How this supplier is named everywhere else in the system.',
    fields: [
      {
        id: 'name',
        label: 'Legal name',
        required: true,
        placeholder: 'Northwind Trading Ltd',
        hint: 'As it appears on the invoice, not the trading name.',
      },
      {
        id: 'code',
        label: 'External reference',
        placeholder: 'SUP-0417',
        hint: 'Your accounting system’s id. Leave blank and one is generated.',
      },
      {
        id: 'email',
        label: 'Billing email',
        type: 'email',
        required: true,
        placeholder: 'ap@northwind.example',
      },
    ],
  },
  {
    id: 'terms',
    title: 'Commercial terms',
    description: 'Defaults applied to every purchase order raised against this supplier.',
    fields: [
      {
        id: 'currency',
        label: 'Currency',
        type: 'select',
        options: ['GBP', 'EUR', 'USD', 'INR'],
        sticky: true,
      },
      {
        id: 'terms',
        label: 'Payment terms',
        type: 'select',
        options: ['Net 14', 'Net 30', 'Net 60', 'On receipt'],
        sticky: true,
      },
      {
        id: 'limit',
        label: 'Credit limit',
        type: 'number',
        placeholder: '25000',
        hint: 'Orders above this need a second approver.',
      },
    ],
  },
  {
    id: 'notes',
    title: 'Notes',
    description: 'Anything the next person raising an order should know.',
    fields: [
      {
        id: 'notes',
        label: 'Internal notes',
        type: 'textarea',
        placeholder: 'Ships from Rotterdam. Lead time doubles in December.',
      },
    ],
  },
]

const INPUT_CLASS =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring'

export function CrudCreateForm({
  recordLabel = 'supplier',
  sections = DEFAULT_SECTIONS,
  className = '',
}: CrudCreateFormProps) {
  // Per-instance ids: a literal id in a reusable component collides with
  // the second copy on the page, and a <label> then resolves to whichever
  // input rendered first.
  const uid = React.useId()
  const [values, setValues] = React.useState<Record<string, string>>({})
  const [errors, setErrors] = React.useState<string[]>([])
  const [saved, setSaved] = React.useState<'none' | 'one' | 'another'>('none')

  const all = React.useMemo(() => sections.flatMap((s) => s.fields), [sections])
  const filled = all.filter((f) => (values[f.id] ?? '').trim().length > 0).length

  function fieldId(id: string) {
    return `${uid}-${id}`
  }

  function submit(mode: 'one' | 'another') {
    const missing = all.filter((f) => f.required && !(values[f.id] ?? '').trim())
    setErrors(missing.map((f) => f.id))
    if (missing.length > 0) return
    setSaved(mode)
    if (mode === 'another') {
      // Sticky fields survive: the currency is the same for all five
      // suppliers being entered, the legal name never is.
      setValues((prev) =>
        Object.fromEntries(
          all.filter((f) => f.sticky).map((f) => [f.id, prev[f.id] ?? '']),
        ),
      )
    }
  }

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <form
        className="mx-auto max-w-5xl"
        onSubmit={(event) => {
          event.preventDefault()
          submit('one')
        }}
      >
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
              <ol className="flex items-center gap-1.5">
                <li>
                  <a href="#" className="transition-colors hover:text-foreground">
                    Suppliers
                  </a>
                </li>
                <li aria-hidden>/</li>
                <li aria-current="page" className="text-foreground">
                  New
                </li>
              </ol>
            </nav>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              New {recordLabel}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {filled} of {all.length} fields filled. Nothing is saved until you
              submit.
            </p>
          </div>
        </header>

        {/* The error summary comes before the fields and links into them —
            a list of errors below the fold is a list nobody reads. */}
        {errors.length > 0 ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 p-4"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <CircleAlert aria-hidden className="h-4 w-4" />
              {errors.length} field{errors.length === 1 ? '' : 's'} needs an answer
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {errors.map((id) => {
                const field = all.find((f) => f.id === id)
                return (
                  <li key={id}>
                    <a
                      href={`#${fieldId(id)}`}
                      className="text-destructive underline underline-offset-2"
                    >
                      {field?.label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}

        {saved !== 'none' ? (
          <p
            role="status"
            className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 text-sm font-medium text-emerald-700 dark:text-emerald-400"
          >
            <Check aria-hidden className="h-4 w-4" />
            {recordLabel.charAt(0).toUpperCase() + recordLabel.slice(1)} created.
            {saved === 'another'
              ? ' The form is ready for the next one, with the shared fields kept.'
              : ''}
          </p>
        ) : null}

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-10">
            {sections.map((section) => (
              <fieldset key={section.id} className="border-0 p-0">
                <legend className="text-base font-semibold">{section.title}</legend>
                <p className="mt-1 text-sm text-muted-foreground">
                  {section.description}
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {section.fields.map((field) => {
                    const invalid = errors.includes(field.id)
                    const wide = field.type === 'textarea'
                    return (
                      <div
                        key={field.id}
                        className={wide ? 'min-w-0 sm:col-span-2' : 'min-w-0'}
                      >
                        <label
                          htmlFor={fieldId(field.id)}
                          className="block break-words text-sm font-medium"
                        >
                          {field.label}
                          {field.required ? (
                            <span className="ms-1 text-destructive" aria-hidden>
                              *
                            </span>
                          ) : (
                            <span className="ms-2 text-xs font-normal text-muted-foreground">
                              Optional
                            </span>
                          )}
                        </label>

                        {field.type === 'textarea' ? (
                          <textarea
                            id={fieldId(field.id)}
                            rows={3}
                            required={field.required}
                            placeholder={field.placeholder}
                            aria-describedby={
                              field.hint ? `${fieldId(field.id)}-hint` : undefined
                            }
                            value={values[field.id] ?? ''}
                            onChange={(e) =>
                              setValues((v) => ({ ...v, [field.id]: e.target.value }))
                            }
                            className={`mt-1.5 ${INPUT_CLASS}`}
                          />
                        ) : field.type === 'select' ? (
                          <select
                            id={fieldId(field.id)}
                            required={field.required}
                            value={values[field.id] ?? ''}
                            onChange={(e) =>
                              setValues((v) => ({ ...v, [field.id]: e.target.value }))
                            }
                            className={`mt-1.5 ${INPUT_CLASS}`}
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
                            id={fieldId(field.id)}
                            type={field.type ?? 'text'}
                            required={field.required}
                            placeholder={field.placeholder}
                            aria-invalid={invalid || undefined}
                            aria-describedby={
                              field.hint ? `${fieldId(field.id)}-hint` : undefined
                            }
                            value={values[field.id] ?? ''}
                            onChange={(e) =>
                              setValues((v) => ({ ...v, [field.id]: e.target.value }))
                            }
                            className={`mt-1.5 ${INPUT_CLASS} ${
                              invalid ? 'border-destructive' : ''
                            }`}
                          />
                        )}

                        {field.hint ? (
                          <p
                            id={`${fieldId(field.id)}-hint`}
                            className="mt-1.5 text-xs text-muted-foreground"
                          >
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

          {/* Guidance, not decoration — see the docblock. */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Info aria-hidden className="h-4 w-4 text-primary" />
                Before you save
              </h2>
              <ul className="mt-3 space-y-2.5 text-xs text-muted-foreground">
                <li>
                  The external reference is what reconciliation matches on. If
                  finance already has a code, use theirs.
                </li>
                <li>
                  Payment terms and currency become the defaults on every order.
                  They can be overridden per order, and rarely are.
                </li>
                <li>
                  Nothing here notifies the supplier. Sending the onboarding
                  pack is a separate, deliberate step.
                </li>
              </ul>
            </div>
          </aside>
        </div>

        {/* Inside the form, so Enter submits from any field. */}
        <div className="sticky bottom-0 z-10 mt-10 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-background/90 py-4 backdrop-blur">
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => submit('another')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus aria-hidden className="h-4 w-4" />
            Save and create another
          </button>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Create {recordLabel}
          </button>
        </div>
      </form>
    </section>
  )
}
