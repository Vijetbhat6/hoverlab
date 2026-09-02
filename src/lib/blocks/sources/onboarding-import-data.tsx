'use client'

/**
 * <OnboardingImportData> — the empty product's real first question.
 *
 * Onboarding had the checklist, the wizard, the invite step, the coach
 * mark and the role picker. Every one of them is about configuring an
 * account. None of them faces the thing that actually decides whether a
 * new customer stays: the product is empty, their data is somewhere else,
 * and moving it is the work they are dreading.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * "Start from scratch" is offered with equal weight, not as grey small
 * print under three logos. A person evaluating a tool on a Tuesday
 * afternoon frequently does not want to connect their production CRM to
 * something they are trying out, and an import screen that treats that as
 * the failure path pushes them into either an abandoned signup or a
 * connection they regret. Sample data is a legitimate answer and is
 * labelled as one, with the sentence that makes it safe: it can be
 * removed in one click later.
 *
 * A CONNECTOR SAYS WHAT IT WILL READ
 *
 * Every option names its scope before it is chosen — "read-only, contacts
 * and companies" — because permission scopes shown after the OAuth
 * redirect are shown too late to influence the decision. The one that
 * writes back says so, in the same place, in the same voice.
 *
 * TIME IS PART OF THE CHOICE
 *
 * A CSV is instant, a full CRM sync is twenty minutes. Someone with ten
 * minutes before a meeting is choosing on that number, and hiding it is
 * how an import gets abandoned halfway.
 *
 * ACCESSIBILITY: a radiogroup, because these are mutually exclusive and
 * arrow keys should move between them; each option is labelled by its
 * name and described by its scope line; the continue button says which
 * option it will act on rather than "Continue".
 */

import * as React from 'react'
import { Check, Clock, Database, FileSpreadsheet, ShieldCheck, Sparkles, Upload } from 'lucide-react'

export interface ImportOption {
  id: string
  name: string
  /** What it reads or writes, stated before the redirect, not after. */
  scope: string
  /** Honest estimate for the whole import. */
  duration: string
  icon: React.ComponentType<{ className?: string }>
  /** Marks the "no thanks" path, which is deliberately not diminished. */
  standalone?: boolean
}

export interface OnboardingImportDataProps {
  options?: ImportOption[]
  className?: string
}

const DEFAULT_OPTIONS: ImportOption[] = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    scope: 'Read-only · contacts and companies. Nothing is written back.',
    duration: 'About 20 minutes for 50,000 contacts',
    icon: Database,
  },
  {
    id: 'csv',
    name: 'Upload a CSV',
    scope: 'You choose the file and map the columns before anything is created.',
    duration: 'Under a minute',
    icon: FileSpreadsheet,
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    scope: 'Read and write · keeps both sides in sync, so edits here reach Salesforce.',
    duration: 'About 40 minutes for the first sync',
    icon: Upload,
  },
  {
    id: 'sample',
    name: 'Start with sample data',
    scope: 'A worked example workspace. Remove it in one click when you are done.',
    duration: 'Instant',
    icon: Sparkles,
    standalone: true,
  },
]

export function OnboardingImportData({
  options = DEFAULT_OPTIONS,
  className = '',
}: OnboardingImportDataProps) {
  const [chosen, setChosen] = React.useState(options[0]?.id ?? '')
  const selected = options.find((o) => o.id === chosen)

  return (
    <section className={`mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 ${className}`}>
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Step 2 of 4
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
          Bring your data across
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Or don&apos;t — a sample workspace is a perfectly good way to look around
          first, and nothing here is permanent.
        </p>

        <div
          role="radiogroup"
          aria-label="How to add data"
          className="mt-5 space-y-2.5"
        >
          {options.map((option) => {
            const active = option.id === chosen
            const Icon = option.icon
            return (
              <div key={option.id}>
                {/*
                  A button with role=radio rather than a styled input: the
                  option is a whole card with two lines of description, and
                  a label wrapping a card is a much larger click target
                  than it appears to be for a keyboard user.
                */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-describedby={`${option.id}-scope`}
                  onClick={() => setChosen(option.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-4 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    active
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background hover:border-primary/40'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon aria-hidden className="h-4.5 w-4.5" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {option.name}
                      </span>
                      {/* The no-thanks path, named rather than hidden. */}
                      {option.standalone ? (
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                          No connection needed
                        </span>
                      ) : null}
                    </span>

                    <span
                      id={`${option.id}-scope`}
                      className="mt-1 block text-xs leading-relaxed text-muted-foreground"
                    >
                      <ShieldCheck aria-hidden className="mr-1 inline h-3 w-3 align-[-2px]" />
                      {option.scope}
                    </span>

                    {/* The number people actually choose on. */}
                    <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock aria-hidden className="h-3 w-3" />
                      {option.duration}
                    </span>
                  </span>

                  {active ? (
                    <Check aria-hidden className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  ) : null}
                </button>
              </div>
            )
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {/* Says what it will do, not "Continue". */}
            {selected?.standalone
              ? 'Create a sample workspace'
              : selected
                ? `Connect ${selected.name}`
                : 'Continue'}
          </button>
          <button
            type="button"
            className="rounded text-sm font-medium text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Skip for now
          </button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          You can add or change a source at any time in Settings — this is not a
          one-off decision.
        </p>
      </div>
    </section>
  )
}
