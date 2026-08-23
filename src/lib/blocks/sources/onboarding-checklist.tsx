'use client'

/**
 * <OnboardingChecklist> — the "get set up" card that follows a new account.
 *
 * The thing that makes a checklist work is that the first item is already
 * ticked. An empty list of six tasks is a bill; a list with one done and a
 * bar showing 1/6 is progress you did not have to earn, and completion
 * rates follow from it. So `steps[0]` ships complete by default here, and
 * it is a real step ("Create your account") rather than a fake one.
 *
 * Details worth keeping:
 *
 *  - It is a `<ul>` of real `<button>`s, not divs with click handlers, so
 *    every row is keyboard-reachable and announces as an action.
 *  - Progress is a native `<progress>` element with a visible label. A
 *    div-with-a-width bar is invisible to assistive tech, and `<progress>`
 *    reports its value without any ARIA.
 *  - Completed rows keep their text legible rather than dropping to 40%
 *    opacity. Struck-through grey is the usual choice and it makes the
 *    record of what you did unreadable.
 *  - The dismiss control appears only once every step is done. Offering
 *    "hide this" on an incomplete checklist is an invitation to abandon it.
 *
 * `onToggle` reports the step id and its new state; wire it to your own
 * persistence. Local state is the default so the preview is interactive.
 */

import * as React from 'react'
import { ArrowRight, Check, X } from 'lucide-react'

export interface ChecklistStep {
  id: string
  label: string
  description: string
  /** Where the step is actually completed. */
  href?: string
  /** Rough time to finish — sets expectations before the click. */
  minutes?: number
}

export interface OnboardingChecklistProps {
  heading?: string
  subheading?: string
  steps?: ChecklistStep[]
  /** Ids that start complete. Defaults to the first step. */
  initialComplete?: string[]
  completeMessage?: string
  onToggle?: (id: string, complete: boolean) => void
  onDismiss?: () => void
  className?: string
}

const DEFAULT_STEPS: ChecklistStep[] = [
  {
    id: 'account',
    label: 'Create your account',
    description: 'Done — welcome aboard.',
    minutes: 1,
  },
  {
    id: 'project',
    label: 'Create your first project',
    description: 'A project holds your environments, keys and deployments.',
    href: '#',
    minutes: 2,
  },
  {
    id: 'install',
    label: 'Install the CLI',
    description: 'One command, and your terminal can deploy.',
    href: '#',
    minutes: 3,
  },
  {
    id: 'invite',
    label: 'Invite a teammate',
    description: 'Projects are more useful with someone to share them with.',
    href: '#',
    minutes: 1,
  },
  {
    id: 'domain',
    label: 'Connect a domain',
    description: 'Point a hostname at your first deployment.',
    href: '#',
    minutes: 5,
  },
]

export function OnboardingChecklist({
  heading = 'Finish setting up',
  subheading = 'Five short steps and your workspace is ready to use.',
  steps = DEFAULT_STEPS,
  initialComplete,
  completeMessage = 'All set. Nice work.',
  onToggle,
  onDismiss,
  className = '',
}: OnboardingChecklistProps) {
  // Per-instance ids. A literal id in a reusable component is a
  // collision waiting for the second copy on the page — and a <label>
  // then resolves to whichever input rendered first.
  const uid = React.useId()
  const [complete, setComplete] = React.useState<Set<string>>(
    () => new Set(initialComplete ?? (steps[0] ? [steps[0].id] : [])),
  )
  const [dismissed, setDismissed] = React.useState(false)

  const done = steps.filter((s) => complete.has(s.id)).length
  const allDone = done === steps.length

  function toggle(id: string) {
    setComplete((prev) => {
      const next = new Set(prev)
      const nowComplete = !next.has(id)
      if (nowComplete) next.add(id)
      else next.delete(id)
      onToggle?.(id, nowComplete)
      return next
    })
  }

  function dismiss() {
    setDismissed(true)
    onDismiss?.()
  }

  if (dismissed) return null

  return (
    <section
      className={`mx-auto w-full max-w-2xl rounded-2xl border border-border/60 bg-card/40 p-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight">
            {allDone ? completeMessage : heading}
          </h2>
          {!allDone ? (
            <p className="mt-1 text-sm text-muted-foreground">{subheading}</p>
          ) : null}
        </div>

        {/* Only offered once there is nothing left to abandon. */}
        {allDone ? (
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss checklist"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Native <progress>: reports its value to assistive tech for free. */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-medium">
          <label htmlFor={`${uid}-onboarding-progress`} className="text-muted-foreground">
            Setup progress
          </label>
          <span>
            {done} of {steps.length}
          </span>
        </div>
        <progress
          id={`${uid}-onboarding-progress`}
          value={done}
          max={steps.length}
          className="mt-2 h-2 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary"
        />
      </div>

      <ul className="mt-6 space-y-2">
        {steps.map((step) => {
          const isDone = complete.has(step.id)
          return (
            <li key={step.id}>
              <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3 transition-colors hover:border-border">
                <button
                  type="button"
                  onClick={() => toggle(step.id)}
                  aria-pressed={isDone}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isDone
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  {isDone ? <Check aria-hidden className="h-3 w-3" /> : null}
                  <span className="sr-only">
                    {isDone ? `Mark ${step.label} incomplete` : `Mark ${step.label} complete`}
                  </span>
                </button>

                <div className="min-w-0 flex-1">
                  {/* Completed rows stay readable — no strike-through, no
                      40% opacity. The list is also a record of what you did. */}
                  <p className={`text-sm font-semibold ${isDone ? 'text-muted-foreground' : ''}`}>
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                </div>

                {!isDone && step.href ? (
                  <a
                    href={step.href}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Start
                    <ArrowRight aria-hidden className="h-3 w-3" />
                  </a>
                ) : null}

                {!isDone && step.minutes ? (
                  <span className="shrink-0 self-center text-[11px] text-muted-foreground">
                    {step.minutes} min
                  </span>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
