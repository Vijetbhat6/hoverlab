'use client'

/**
 * <SetupWizard> — a full-screen guided setup with a side rail.
 *
 * Where <MultiStepForm> collects data, this one makes *choices*: pick a
 * framework, pick a plan, pick what to import. That difference drives the
 * layout — the rail stays visible the whole time so someone four steps in
 * can still see what they picked and what is left, which a horizontal
 * stepper cannot show once labels are truncated on a phone.
 *
 * The rail is an ordered list with `aria-current="step"`. Steps already
 * visited are buttons you can go back to; steps ahead are plain text, and
 * are not focusable — offering a tab stop that does nothing is worse than
 * not offering it.
 *
 * The option groups are real radios (`role` comes free from `type="radio"`),
 * wired into one `<fieldset>` with a `<legend>`. That is what makes arrow
 * keys move between options and what makes the group announce its question
 * before its answers. The card look is a styled `<label>` over a visually
 * hidden input — never a div with `onClick`, which loses all of it.
 */

import * as React from 'react'
import { Check, ChevronLeft, Rocket } from 'lucide-react'

export interface WizardOption {
  value: string
  label: string
  description: string
}

export interface WizardStep {
  id: string
  title: string
  question: string
  options: WizardOption[]
}

export interface SetupWizardProps {
  brand?: string
  steps?: WizardStep[]
  finishLabel?: string
  completeTitle?: string
  completeBody?: string
  onFinish?: (answers: Record<string, string>) => void
  className?: string
}

const DEFAULT_STEPS: WizardStep[] = [
  {
    id: 'framework',
    title: 'Framework',
    question: 'What are you building with?',
    options: [
      { value: 'next', label: 'Next.js', description: 'App Router, server components' },
      { value: 'vite', label: 'Vite + React', description: 'Client-rendered SPA' },
      { value: 'remix', label: 'Remix', description: 'Nested routes and loaders' },
    ],
  },
  {
    id: 'styling',
    title: 'Styling',
    question: 'How do you write styles?',
    options: [
      { value: 'tailwind', label: 'Tailwind CSS', description: 'Utility classes' },
      { value: 'css', label: 'Plain CSS', description: 'Modules or global stylesheets' },
    ],
  },
  {
    id: 'team',
    title: 'Team',
    question: 'Who else needs access?',
    options: [
      { value: 'solo', label: 'Just me', description: 'You can invite people later' },
      { value: 'team', label: 'My team', description: 'We will ask for emails next' },
      { value: 'client', label: 'A client', description: 'Sets up a shared workspace' },
    ],
  },
]

export function SetupWizard({
  brand = 'Acme',
  steps = DEFAULT_STEPS,
  finishLabel = 'Finish setup',
  completeTitle = 'You are ready to go.',
  completeBody = 'We have configured your workspace from your answers. You can change any of it in Settings.',
  onFinish,
  className = '',
}: SetupWizardProps) {
  const [step, setStep] = React.useState(0)
  const [answers, setAnswers] = React.useState<Record<string, string>>({})
  const [done, setDone] = React.useState(false)

  const current = steps[step]
  const answered = current ? answers[current.id] : undefined
  const isLast = step === steps.length - 1

  function choose(value: string) {
    if (!current) return
    setAnswers((a) => ({ ...a, [current.id]: value }))
  }

  function advance() {
    if (!answered) return
    if (isLast) {
      setDone(true)
      onFinish?.(answers)
    } else {
      setStep((s) => s + 1)
    }
  }

  return (
    <section className={`mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 ${className}`}>
      <div className="grid gap-8 rounded-2xl border border-border/60 bg-card/40 p-6 sm:p-8 md:grid-cols-[220px_1fr] md:gap-12">
        {/* -- Rail ---------------------------------------------------- */}
        <div>
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-600 text-xs font-black text-primary-foreground"
            >
              {brand.slice(0, 1)}
            </span>
            <span className="font-bold tracking-tight">{brand}</span>
          </div>

          <ol className="mt-6 space-y-1">
            {steps.map((s, i) => {
              const state = done || i < step ? 'complete' : i === step ? 'current' : 'upcoming'
              const row = (
                <>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                      state === 'complete'
                        ? 'border-primary bg-primary text-primary-foreground'
                        : state === 'current'
                          ? 'border-primary text-primary'
                          : 'border-border/60 text-muted-foreground'
                    }`}
                  >
                    {state === 'complete' ? <Check aria-hidden className="h-3 w-3" /> : i + 1}
                  </span>
                  <span className="text-sm font-medium">{s.title}</span>
                  {state === 'complete' ? <span className="sr-only">completed</span> : null}
                </>
              )

              return (
                <li key={s.id}>
                  {/* Visited steps are navigable; steps ahead are not
                      focusable, because a tab stop that does nothing is
                      worse than no tab stop. */}
                  {state === 'complete' && !done ? (
                    <button
                      type="button"
                      onClick={() => setStep(i)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-start transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {row}
                    </button>
                  ) : (
                    <div
                      aria-current={state === 'current' ? 'step' : undefined}
                      className={`flex items-center gap-2.5 px-2 py-2 ${
                        state === 'upcoming' ? 'text-muted-foreground' : ''
                      }`}
                    >
                      {row}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        </div>

        {/* -- Panel --------------------------------------------------- */}
        <div className="min-h-80">
          {done || !current ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Rocket aria-hidden className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-xl font-bold tracking-tight">{completeTitle}</h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">{completeBody}</p>
            </div>
          ) : (
            <>
              <fieldset>
                <legend className="text-xl font-bold tracking-tight">{current.question}</legend>

                <div className="mt-6 space-y-3">
                  {current.options.map((option) => {
                    const id = `${current.id}-${option.value}`
                    const selected = answered === option.value
                    return (
                      <label
                        key={option.value}
                        htmlFor={id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring ${
                          selected
                            ? 'border-primary bg-primary/5'
                            : 'border-border/60 hover:border-border hover:bg-muted/40'
                        }`}
                      >
                        <input
                          id={id}
                          type="radio"
                          name={current.id}
                          value={option.value}
                          checked={selected}
                          onChange={() => choose(option.value)}
                          className="sr-only"
                        />
                        <span
                          aria-hidden
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            selected ? 'border-primary bg-primary' : 'border-border'
                          }`}
                        >
                          {selected ? (
                            <span className="h-2 w-2 rounded-full bg-primary-foreground" />
                          ) : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{option.label}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="inline-flex h-11 items-center gap-1 rounded-xl border border-border/60 px-4 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronLeft aria-hidden className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={advance}
                  disabled={!answered}
                  className="inline-flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-40"
                >
                  {isLast ? finishLabel : 'Continue'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
