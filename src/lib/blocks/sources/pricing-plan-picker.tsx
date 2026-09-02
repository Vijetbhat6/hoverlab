'use client'

/**
 * <PricingPlanPicker> — choosing a plan when the choosing is already decided.
 *
 * Every other pricing block in this catalog is a marketing surface: it is
 * trying to persuade someone who has not committed. This one is for the
 * screen after that — an upgrade dialog, a checkout step, the plan tab in
 * settings — where the visitor has already decided to pay and now has to
 * pick, and where a three-column table of feature bullets is an obstacle
 * rather than an argument.
 *
 * So it is a form control, not a table. A radiogroup of rows, one line of
 * differentiator each, the current plan marked and unselectable, a total
 * that updates, and a single submit. The interaction the reader expects
 * here is the one they get from every other form they have filled in, not
 * the one they get from a pricing page.
 *
 * Built on real `<input type="radio">` with a shared `name`, wrapped in a
 * `<fieldset>` with a `<legend>`. That gets arrow-key navigation, the
 * roving tab stop, the group announcement and form submission for free and
 * correctly. A `role="radiogroup"` reimplementation of the same thing with
 * divs and key handlers is the most commonly broken widget on the web, and
 * there is nothing here that native radios cannot already do.
 *
 * The current plan is disabled rather than hidden. Removing it loses the
 * reader's anchor — they cannot see what they are moving *from*, which is
 * the comparison they are actually making — and a disabled row with a
 * "Current" tag says why it cannot be chosen instead of leaving a gap.
 *
 * The footer states the prorated consequence, not just the price. "You will
 * be charged $34 today" is the number someone is about to have taken from
 * their card, and a picker that shows only the sticker price is the reason
 * upgrade flows generate support tickets.
 */

import * as React from 'react'
import { Check } from 'lucide-react'

export interface PickerPlan {
  id: string
  name: string
  price: string
  /** e.g. "per user, per month". Kept separate so the price stays large. */
  cadence?: string
  /** One line. This is a picker, not a comparison table. */
  summary: string
  /** Marks the row the workspace is already on. Rendered unselectable. */
  current?: boolean
  recommended?: boolean
}

export interface PricingPlanPickerProps {
  legend?: string
  heading?: string
  plans?: PickerPlan[]
  /** Per-plan line for the total, e.g. proration. Keyed by plan id. */
  chargeToday?: Record<string, string>
  submitLabel?: string
  footnote?: string
  className?: string
}

const DEFAULT_PLANS: PickerPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$0',
    cadence: 'free forever',
    summary: 'One project, community support, 60 API requests a minute.',
    current: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    cadence: 'per month',
    summary: 'Unlimited projects, email support within one business day, 600 req/min.',
    recommended: true,
  },
  {
    id: 'team',
    name: 'Team',
    price: '$12',
    cadence: 'per seat, per month',
    summary: 'Everything in Pro for every seat, shared brand library, SSO.',
  },
  {
    id: 'team-annual',
    name: 'Team, annual',
    price: '$120',
    cadence: 'per seat, once a year',
    summary: 'Ten months’ price for twelve months, billed once — nothing recurring to fail.',
  },
]

const DEFAULT_CHARGE_TODAY: Record<string, string> = {
  pro: '$12.67 today, prorated to the 21st',
  team: '$8.00 today, prorated to the 21st',
  'team-annual': '$120.00 today',
}

export function PricingPlanPicker({
  legend = 'Choose a plan',
  heading = 'Change your plan',
  plans = DEFAULT_PLANS,
  chargeToday = DEFAULT_CHARGE_TODAY,
  submitLabel = 'Confirm change',
  footnote = 'Changes take effect immediately. Downgrades credit the unused remainder against your next invoice.',
  className = '',
}: PricingPlanPickerProps) {
  const firstSelectable = plans.find((plan) => !plan.current)
  const [selected, setSelected] = React.useState(firstSelectable?.id ?? '')

  const charge = chargeToday[selected]

  return (
    <section
      aria-labelledby="plan-picker-heading"
      className={`mx-auto w-full max-w-lg px-4 py-16 sm:px-6 ${className}`}
    >
      <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
        <h2
          id="plan-picker-heading"
          className="text-xl font-bold tracking-tight text-foreground"
        >
          {heading}
        </h2>

        <form
          onSubmit={(event) => event.preventDefault()}
          className="mt-6"
        >
          <fieldset>
            <legend className="sr-only">{legend}</legend>

            <div className="space-y-3">
              {plans.map((plan) => {
                const checked = selected === plan.id
                return (
                  <label
                    key={plan.id}
                    className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background ${
                      plan.current
                        ? 'cursor-not-allowed border-border/60 bg-muted/40'
                        : checked
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border/60 hover:border-border hover:bg-muted/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={plan.id}
                      checked={checked}
                      disabled={plan.current}
                      onChange={() => setSelected(plan.id)}
                      className="mt-1 h-4 w-4 shrink-0 accent-primary focus-visible:outline-none"
                    />

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="font-semibold text-foreground">{plan.name}</span>

                        {plan.current ? (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            Current
                          </span>
                        ) : null}

                        {plan.recommended ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            Recommended
                          </span>
                        ) : null}
                      </span>

                      <span className="mt-1 block text-pretty text-sm leading-relaxed text-muted-foreground">
                        {plan.summary}
                      </span>
                    </span>

                    <span className="shrink-0 text-end">
                      <span className="block text-lg font-bold tabular-nums text-foreground">
                        {plan.price}
                      </span>
                      {plan.cadence ? (
                        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                          {plan.cadence}
                        </span>
                      ) : null}
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          {/* The number about to leave their account, announced when it
              changes — a total that updates silently is one people miss. */}
          <p
            role="status"
            className="mt-6 flex items-center gap-2 text-sm font-medium text-foreground"
          >
            {charge ? (
              <>
                <Check aria-hidden className="h-4 w-4 shrink-0 text-primary" />
                {charge}
              </>
            ) : null}
          </p>

          <button
            type="submit"
            disabled={!selected}
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {submitLabel}
          </button>
        </form>

        {footnote ? (
          <p className="mt-4 text-pretty text-xs leading-relaxed text-muted-foreground">
            {footnote}
          </p>
        ) : null}
      </div>
    </section>
  )
}
