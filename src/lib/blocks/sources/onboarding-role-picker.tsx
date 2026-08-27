'use client'

/**
 * <OnboardingRolePicker> — "what best describes you", asked honestly.
 *
 * Onboarding had the checklist, the wizard, the coach mark and the invite
 * step: four surfaces about getting work done. This is the one before them
 * — the segmentation question nearly every product asks on first run, and
 * the one most likely to be asked for the company's benefit while being
 * dressed up as a favour to the user.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * Every option says what it will change. "Designer" is a label; "we will
 * open the canvas first and turn the code panel off" is a consequence
 * somebody can agree or object to. If an answer changes nothing, the
 * question is analytics wearing a costume, and it should either be cut or
 * be labelled as research — which is the honest third option and is why
 * the skip below is a plain link and not a greyed-out afterthought.
 *
 * SKIP IS VISIBLE AND COSTS NOTHING
 *
 * Hiding the way past a survey is how first-run flows lose the people who
 * were most ready to start. The skip states what happens instead — the
 * default setup, nameable, not a mystery — so declining is an informed
 * choice rather than a gamble.
 *
 * IT SAYS THAT THIS IS REVERSIBLE
 *
 * One sentence, under the buttons. Half the hesitation on a screen like
 * this is somebody weighing a decision they think is permanent. It is not,
 * and saying so is cheaper than any amount of copy about how great the
 * product is.
 *
 * ACCESSIBILITY: real radio inputs in a `<fieldset>` with a `<legend>`,
 * visually hidden but present, so arrow keys move within the group and the
 * screen reader announces "3 of 5". Cards built from divs and `onClick`
 * are the standard version of this screen and they are unreachable by
 * keyboard, unannounced as a group, and impossible to submit.
 */

import * as React from 'react'
import { ArrowRight, Code2, LineChart, PenTool, Users } from 'lucide-react'

export interface OnboardingRole {
  id: string
  label: string
  /** What actually changes if this is chosen. Never a restatement. */
  consequence: string
  icon: React.ComponentType<{ className?: string }>
}

export interface OnboardingRolePickerProps {
  productName?: string
  roles?: OnboardingRole[]
  /** What the skip path gives you — named, not left as a mystery. */
  defaultSetup?: string
  className?: string
}

const DEFAULT_ROLES: OnboardingRole[] = [
  {
    id: 'engineer',
    label: 'Engineer',
    consequence:
      'Opens the code panel first, installs the CLI, and shows diffs instead of previews.',
    icon: Code2,
  },
  {
    id: 'designer',
    label: 'Designer',
    consequence:
      'Opens the canvas first, hides the code panel, and turns on the Figma import.',
    icon: PenTool,
  },
  {
    id: 'pm',
    label: 'Product or project lead',
    consequence:
      'Starts on the roadmap view, and weekly summaries are switched on by default.',
    icon: LineChart,
  },
  {
    id: 'ops',
    label: 'Operations or support',
    consequence:
      'Starts on the queue, with keyboard shortcuts and bulk actions enabled.',
    icon: Users,
  },
]

export function OnboardingRolePicker({
  productName = 'Northwind',
  roles = DEFAULT_ROLES,
  defaultSetup = 'the engineer setup, which is what most people keep',
  className = '',
}: OnboardingRolePickerProps) {
  const [role, setRole] = React.useState<string | null>(null)
  const chosen = roles.find((r) => r.id === role)

  return (
    <section className={`mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 ${className}`}>
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Step 1 of 3
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          What will you be doing in {productName}?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This sets what you see first. Nothing here is locked in.
        </p>

        {/*
          A real fieldset and real radios. The div-and-onClick version of
          this card grid is unreachable by keyboard and silent to a screen
          reader, and it is the version almost everybody ships.
        */}
        <fieldset className="mt-6">
          <legend className="sr-only">Choose the description that fits you best</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {roles.map((r) => {
              const Icon = r.icon
              const selected = role === r.id
              return (
                <label
                  key={r.id}
                  className={`relative flex cursor-pointer gap-3 rounded-xl border p-4 transition focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background ${
                    selected
                      ? 'border-primary bg-accent/60'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="onboarding-role"
                    value={r.id}
                    checked={selected}
                    onChange={() => setRole(r.id)}
                    /*
                      accent-primary rather than a hand-drawn dot: the
                      tokens are oklch(), so hsl(var(--primary)) is not a
                      colour and the control renders browser-blue.
                    */
                    className="mt-0.5 h-4 w-4 shrink-0 border-field accent-primary focus:outline-none"
                  />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Icon aria-hidden className="h-4 w-4 text-muted-foreground" />
                      {r.label}
                    </span>
                    {/* The consequence, not a restatement of the label. */}
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                      {r.consequence}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
          <button
            type="button"
            disabled={!chosen}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Continue
            <ArrowRight aria-hidden className="h-4 w-4" />
          </button>

          {/* Visible, plain, and it names what you get instead. */}
          <button
            type="button"
            className="rounded text-sm text-muted-foreground underline underline-offset-4 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Skip — give me {defaultSetup}
          </button>
        </div>

        <p role="status" className="mt-4 text-xs text-muted-foreground">
          {chosen
            ? `${chosen.label} selected. ${chosen.consequence} You can change this in Settings → Workspace at any time.`
            : 'Whatever you pick, you can change it in Settings → Workspace at any time.'}
        </p>
      </div>
    </section>
  )
}
