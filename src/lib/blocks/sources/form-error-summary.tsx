'use client'

/**
 * <FormErrorSummary> — the form after it has been rejected.
 *
 * Contact & Forms had the split contact form, the multi-step flow, the
 * feedback widget and the scheduler: four forms drawn in the state where
 * everything is fine. This is the fifth state all of them eventually
 * reach and none of them illustrate, and it is the state where a form
 * either recovers a submission or loses it.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * There is a summary at the top, it is focused on submit, and every line
 * in it is a link to the field it is about. On a long form the errors are
 * usually below the fold; a red border on a control nobody can see is not
 * a message. This is the pattern the UK Government Digital Service and the
 * WCAG error-identification criteria both land on, and it is close to
 * unheard-of outside government work.
 *
 * ERRORS APPEAR ON SUBMIT, THEN TRACK THE FIELD
 *
 * Validating every keystroke means telling somebody their email is invalid
 * while they are typing the second letter of it, which is both wrong and
 * rude. Nothing is marked until submit. After that, a field that has been
 * marked revalidates as it changes, so the fix is confirmed immediately
 * and the summary shrinks as they go.
 *
 * THE MESSAGE SAYS HOW TO FIX IT
 *
 * "Enter an email address in the format name@example.com", not "invalid".
 * The rule is stated before it is broken as well — the password hint is
 * always visible, not revealed as a punishment.
 *
 * FAILURES THAT BELONG TO NO FIELD HAVE A HOME
 *
 * A declined card, a duplicate account, a service that was down: real
 * submissions fail for reasons no field can own. They render in the same
 * summary rather than as a toast that disappears before it is read, and
 * the form keeps every value the person entered.
 *
 * ACCESSIBILITY: the summary is `role="alert"` and `tabIndex={-1}` so it
 * can take focus, each field carries `aria-invalid` and `aria-describedby`
 * pointing at both its hint and its error, and every message is prefixed
 * with a visible "Error:" so the failure is not carried by colour alone.
 */

import * as React from 'react'
import { AlertCircle, Check } from 'lucide-react'

export interface FormErrorSummaryProps {
  /** Set to see the summary handle a failure that belongs to no field. */
  simulateServerError?: boolean
  /**
   * Opens already rejected, because that is the state this block is for.
   * Pass `false` for a clean form — the transition from clean to rejected
   * is the same code path either way.
   */
  startRejected?: boolean
  className?: string
}

/* Two plausible mistakes and three blanks — a realistic first submission. */
const REJECTED_VALUES: Record<string, string> = {
  'full-name': 'Sam Keller',
  'work-email': 'sam.keller@northwind',
  company: '',
  seats: '2,000',
  password: 'hunter2',
}

interface FieldDef {
  id: string
  label: string
  type: string
  hint?: string
  autoComplete?: string
  validate: (value: string) => string | null
}

const FIELDS: FieldDef[] = [
  {
    id: 'full-name',
    label: 'Full name',
    type: 'text',
    autoComplete: 'name',
    validate: (v) => (v.trim() ? null : 'Enter your full name.'),
  },
  {
    id: 'work-email',
    label: 'Work email',
    type: 'email',
    autoComplete: 'email',
    hint: 'We use this for the account, and nothing else.',
    validate: (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
        ? null
        : 'Enter an email address in the format name@example.com.',
  },
  {
    id: 'company',
    label: 'Company',
    type: 'text',
    autoComplete: 'organization',
    validate: (v) => (v.trim() ? null : 'Enter the company this is for.'),
  },
  {
    id: 'seats',
    label: 'Number of seats',
    type: 'text',
    hint: 'A number between 1 and 500. You can change it later.',
    validate: (v) => {
      const n = Number(v.trim())
      if (!v.trim()) return 'Enter how many seats you need.'
      if (!Number.isInteger(n) || n < 1 || n > 500)
        return 'Seats must be a whole number between 1 and 500.'
      return null
    },
  },
  {
    id: 'password',
    label: 'Password',
    type: 'password',
    autoComplete: 'new-password',
    /* The rule is visible before it is broken, not after. */
    hint: 'At least 12 characters. Length is the only requirement.',
    validate: (v) => (v.length >= 12 ? null : 'Use at least 12 characters.'),
  },
]

export function FormErrorSummary({
  simulateServerError = true,
  startRejected = true,
  className = '',
}: FormErrorSummaryProps) {
  const [values, setValues] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(
      FIELDS.map((f) => [f.id, startRejected ? (REJECTED_VALUES[f.id] ?? '') : '']),
    ),
  )
  const [errors, setErrors] = React.useState<Record<string, string>>(() => {
    if (!startRejected) return {}
    const found: Record<string, string> = {}
    for (const field of FIELDS) {
      const message = field.validate(REJECTED_VALUES[field.id] ?? '')
      if (message) found[field.id] = message
    }
    return found
  })
  const [formError, setFormError] = React.useState<string | null>(null)
  const [submitted, setSubmitted] = React.useState(startRejected)
  const [done, setDone] = React.useState(false)
  const summary = React.useRef<HTMLDivElement>(null)

  const setValue = (id: string, value: string) => {
    setValues((v) => ({ ...v, [id]: value }))
    /* Only revalidate a field that has already been marked. */
    if (submitted && errors[id] !== undefined) {
      const field = FIELDS.find((f) => f.id === id)
      const message = field?.validate(value) ?? null
      setErrors(({ [id]: _drop, ...rest }) => (message ? { ...rest, [id]: message } : rest))
    }
  }

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    const found: Record<string, string> = {}
    for (const field of FIELDS) {
      const message = field.validate(values[field.id] ?? '')
      if (message) found[field.id] = message
    }
    setErrors(found)

    const serverSide =
      Object.keys(found).length === 0 && simulateServerError && !done
        ? 'That email is already on an account for this company. Sign in instead, or use a different address.'
        : null
    setFormError(serverSide)

    if (Object.keys(found).length === 0 && !serverSide) {
      setDone(true)
      return
    }
    /* Focus the summary — the errors are usually below the fold. */
    window.requestAnimationFrame(() => summary.current?.focus())
  }

  const listed = FIELDS.filter((f) => errors[f.id])
  const showSummary = submitted && (listed.length > 0 || formError)

  if (done) {
    return (
      <section className={`mx-auto w-full max-w-lg px-4 py-16 sm:px-6 ${className}`}>
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <span
            aria-hidden
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          >
            <Check className="h-5 w-5" />
          </span>
          <h2 className="mt-3 text-lg font-semibold text-foreground">Account created</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nothing you typed was lost on the way here.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className={`mx-auto w-full max-w-lg px-4 py-16 sm:px-6 ${className}`}>
      <form
        noValidate
        onSubmit={onSubmit}
        className="rounded-2xl border border-border bg-card p-6 sm:p-8"
      >
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Create a team account
        </h2>

        {showSummary ? (
          <div
            ref={summary}
            role="alert"
            tabIndex={-1}
            className="mt-5 rounded-xl border border-destructive/40 bg-destructive/5 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <AlertCircle aria-hidden className="h-4 w-4 text-destructive" />
              {listed.length > 0
                ? `There ${listed.length === 1 ? 'is 1 problem' : `are ${listed.length} problems`} with this form`
                : 'This could not be submitted'}
            </h3>

            {listed.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {listed.map((f) => (
                  <li key={f.id}>
                    {/* Each line goes to the field it is about. */}
                    <a
                      href={`#${f.id}`}
                      onClick={(event) => {
                        event.preventDefault()
                        document.getElementById(f.id)?.focus()
                      }}
                      className="rounded text-sm text-destructive underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {f.label}: {errors[f.id]}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}

            {/* The failure that belongs to no field. */}
            {formError ? (
              <p className="mt-2 text-sm text-foreground">{formError}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 space-y-5">
          {FIELDS.map((field) => {
            const error = errors[field.id]
            const hintId = field.hint ? `${field.id}-hint` : undefined
            const errorId = error ? `${field.id}-error` : undefined
            return (
              <div key={field.id}>
                <label
                  htmlFor={field.id}
                  className="block text-sm font-medium text-foreground"
                >
                  {field.label}
                </label>
                {field.hint ? (
                  <p id={hintId} className="mt-0.5 text-xs text-muted-foreground">
                    {field.hint}
                  </p>
                ) : null}
                <input
                  id={field.id}
                  name={field.id}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  value={values[field.id] ?? ''}
                  onChange={(event) => setValue(field.id, event.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
                  className={`mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    error ? 'border-destructive' : 'border-field'
                  }`}
                />
                {error ? (
                  /* "Error:" in text — the state is not carried by colour. */
                  <p id={errorId} className="mt-1.5 text-sm text-destructive">
                    <span className="font-semibold">Error:</span> {error}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>

        <button
          type="submit"
          className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Create account
        </button>

        <p className="mt-3 text-xs text-muted-foreground">
          Nothing is checked until you submit — you will not be told your email
          is wrong while you are still typing it.
        </p>
      </form>
    </section>
  )
}
