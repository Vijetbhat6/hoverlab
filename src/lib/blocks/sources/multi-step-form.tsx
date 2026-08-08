'use client'

/**
 * <MultiStepForm> — a three-step form with a stepper and per-step validation.
 *
 * The pattern exists to make a long form feel finishable. What makes it
 * work is that each step is genuinely complete on its own: you can answer
 * everything visible, and "Continue" is refused only for a field you can
 * currently see. A wizard that fails on step 1 because of something on
 * step 3 is worse than one long page.
 *
 * The accessibility of a stepper is almost always wrong, so:
 *
 *  - The stepper is an ordered list, not a row of divs. Position in a
 *    sequence is the entire meaning, and `<ol>` is what conveys it.
 *  - The current step carries `aria-current="step"`.
 *  - Completed steps say so in text (`sr-only` "completed"), because a
 *    green tick is colour and shape only.
 *  - Errors use `aria-invalid` plus `aria-describedby` pointing at the
 *    message, so the message is read *with* the field rather than being
 *    a red sentence floating nearby.
 *  - Advancing moves focus to the new step's heading, which is what tells
 *    a screen reader anything happened at all. Without it the user presses
 *    Continue and hears silence.
 *
 * Validation is deliberately trivial (required, and an `@` in the email) —
 * this is a layout and a flow, not a schema library. Swap `validateStep`
 * for Zod or your own rules; nothing else needs to change.
 */

import * as React from 'react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'

export interface MultiStepValues {
  name: string
  email: string
  company: string
  teamSize: string
  useCase: string
  referral: string
}

export interface MultiStepFormProps {
  heading?: string
  steps?: string[]
  submitLabel?: string
  successMessage?: string
  onSubmit?: (values: MultiStepValues) => void | Promise<void>
  className?: string
}

const DEFAULT_STEPS = ['Your details', 'Your team', 'Finish']

const EMPTY: MultiStepValues = {
  name: '',
  email: '',
  company: '',
  teamSize: '1–10',
  useCase: '',
  referral: '',
}

type Errors = Partial<Record<keyof MultiStepValues, string>>

/** Which fields each step owns — the reason a step can validate itself. */
const FIELDS_BY_STEP: Array<Array<keyof MultiStepValues>> = [
  ['name', 'email'],
  ['company', 'teamSize'],
  ['useCase'],
]

function validateStep(step: number, values: MultiStepValues): Errors {
  const errors: Errors = {}
  for (const field of FIELDS_BY_STEP[step] ?? []) {
    const value = values[field].trim()
    if (!value) {
      errors[field] = 'This field is required.'
    } else if (field === 'email' && !value.includes('@')) {
      errors[field] = 'Enter a valid email address.'
    }
  }
  return errors
}

export function MultiStepForm({
  heading = 'Set up your workspace',
  steps = DEFAULT_STEPS,
  submitLabel = 'Create workspace',
  successMessage = 'Workspace created. Check your email for the invite link.',
  onSubmit,
  className = '',
}: MultiStepFormProps) {
  const [step, setStep] = React.useState(0)
  const [values, setValues] = React.useState<MultiStepValues>(EMPTY)
  const [errors, setErrors] = React.useState<Errors>({})
  const [done, setDone] = React.useState(false)
  const headingRef = React.useRef<HTMLHeadingElement>(null)

  function set<K extends keyof MultiStepValues>(key: K, value: MultiStepValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  // Move focus to the step heading after advancing. Without this the DOM
  // changes and a screen reader says nothing.
  React.useEffect(() => {
    if (step > 0) headingRef.current?.focus()
  }, [step])

  function next() {
    const found = validateStep(step, values)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found = validateStep(step, values)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }
    await (onSubmit?.(values) ?? Promise.resolve())
    setDone(true)
  }

  if (done) {
    return (
      <section className={`mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 ${className}`}>
        <div className="flex flex-col items-center rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Check aria-hidden className="h-6 w-6" />
          </span>
          <p className="mt-4 font-semibold">{successMessage}</p>
        </div>
      </section>
    )
  }

  const isLast = step === steps.length - 1

  return (
    <section className={`mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 ${className}`}>
      <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">{heading}</h2>

      {/* -- Stepper --------------------------------------------------- */}
      <ol className="mt-8 flex items-center gap-2">
        {steps.map((label, i) => {
          const state = i < step ? 'complete' : i === step ? 'current' : 'upcoming'
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                aria-current={state === 'current' ? 'step' : undefined}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                  state === 'complete'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : state === 'current'
                      ? 'border-primary text-primary'
                      : 'border-border/60 text-muted-foreground'
                }`}
              >
                {state === 'complete' ? <Check aria-hidden className="h-4 w-4" /> : i + 1}
                {state === 'complete' ? <span className="sr-only">completed</span> : null}
              </span>
              <span
                className={`hidden text-xs font-medium sm:block ${
                  state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground'
                }`}
              >
                {label}
              </span>
              {i < steps.length - 1 ? (
                <span
                  aria-hidden
                  className={`h-px flex-1 ${i < step ? 'bg-primary' : 'bg-border'}`}
                />
              ) : null}
            </li>
          )
        })}
      </ol>

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-2xl border border-border/60 bg-card/40 p-6 sm:p-8"
      >
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-semibold outline-none"
        >
          {steps[step]}
        </h3>

        <div className="mt-5 space-y-4">
          {step === 0 ? (
            <>
              <TextField
                id="ms-name"
                label="Full name"
                autoComplete="name"
                value={values.name}
                error={errors.name}
                onChange={(v) => set('name', v)}
              />
              <TextField
                id="ms-email"
                label="Work email"
                type="email"
                autoComplete="email"
                value={values.email}
                error={errors.email}
                onChange={(v) => set('email', v)}
              />
            </>
          ) : null}

          {step === 1 ? (
            <>
              <TextField
                id="ms-company"
                label="Company"
                autoComplete="organization"
                value={values.company}
                error={errors.company}
                onChange={(v) => set('company', v)}
              />
              <div>
                <label htmlFor="ms-size" className="block text-sm font-medium">
                  Team size
                </label>
                <select
                  id="ms-size"
                  value={values.teamSize}
                  onChange={(e) => set('teamSize', e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-border/60 bg-background/60 px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  {['1–10', '11–50', '51–200', '200+'].map((size) => (
                    <option key={size}>{size}</option>
                  ))}
                </select>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div>
                <label htmlFor="ms-usecase" className="block text-sm font-medium">
                  What will you use this for?
                </label>
                <textarea
                  id="ms-usecase"
                  rows={4}
                  value={values.useCase}
                  aria-invalid={errors.useCase ? true : undefined}
                  aria-describedby={errors.useCase ? 'ms-usecase-error' : undefined}
                  onChange={(e) => set('useCase', e.target.value)}
                  className={`mt-1.5 w-full resize-y rounded-xl border bg-background/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 ${
                    errors.useCase ? 'border-destructive' : 'border-border/60 focus:border-primary/50'
                  }`}
                />
                {errors.useCase ? (
                  <p id="ms-usecase-error" className="mt-1.5 text-xs text-destructive">
                    {errors.useCase}
                  </p>
                ) : null}
              </div>
              <TextField
                id="ms-referral"
                label="How did you hear about us?"
                optional
                value={values.referral}
                onChange={(v) => set('referral', v)}
              />
            </>
          ) : null}
        </div>

        <div className="mt-7 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex h-11 items-center gap-1 rounded-xl border border-border/60 px-4 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft aria-hidden className="h-4 w-4" />
            Back
          </button>

          {isLast ? (
            <button
              type="submit"
              className="inline-flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {submitLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              className="inline-flex h-11 items-center gap-1 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Continue
              <ChevronRight aria-hidden className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </section>
  )
}

/** Text input wired to an error message via aria-describedby. */
function TextField({
  id,
  label,
  value,
  onChange,
  error,
  type = 'text',
  autoComplete,
  optional = false,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: string
  autoComplete?: string
  optional?: boolean
}) {
  const errorId = `${id}-error`
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {optional ? (
          <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
        ) : null}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1.5 h-11 w-full rounded-xl border bg-background/60 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 ${
          error ? 'border-destructive' : 'border-border/60 focus:border-primary/50'
        }`}
      />
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
