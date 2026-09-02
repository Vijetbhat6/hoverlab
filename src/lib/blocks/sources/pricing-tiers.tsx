'use client'

/**
 * <PricingTiers> — a three-plan pricing table with a monthly/yearly toggle.
 *
 * The toggle is state rather than two pre-rendered tables, so the highlight
 * ring, the feature lists and the CTA copy stay in one place. Yearly prices
 * are derived from the monthly figure via `yearlyDiscount` — quoting both
 * numbers independently is how pricing pages end up contradicting
 * themselves after a change.
 *
 * The featured plan is raised with a ring and a badge rather than by
 * scaling it, which would knock the three CTAs out of horizontal alignment.
 */

import * as React from 'react'
import { Check } from 'lucide-react'

export interface PricingPlan {
  name: string
  /** Monthly price in whole currency units. `0` renders as "Free". */
  monthly: number
  description: string
  features: string[]
  cta?: string
  featured?: boolean
}

export interface PricingTiersProps {
  plans?: PricingPlan[]
  heading?: string
  subheading?: string
  currency?: string
  /** Fraction off when billed yearly, e.g. `0.2` for two months free. */
  yearlyDiscount?: number
  className?: string
}

const DEFAULT_PLANS: PricingPlan[] = [
  {
    name: 'Free',
    monthly: 0,
    description: 'Everything you need to try it properly.',
    features: ['Up to 3 projects', 'Community support', 'Core component library'],
    cta: 'Start free',
  },
  {
    name: 'Pro',
    monthly: 19,
    description: 'For working developers shipping real products.',
    features: [
      'Unlimited projects',
      'Commercial license',
      'The full library',
      'Priority email support',
      'Figma source files',
    ],
    cta: 'Go Pro',
    featured: true,
  },
  {
    name: 'Team',
    monthly: 49,
    description: 'Shared access and billing for a whole team.',
    features: [
      'Everything in Pro',
      'Up to 10 seats',
      'Shared component presets',
      'SSO and audit log',
      'Invoice billing',
    ],
    cta: 'Contact sales',
  },
]

export function PricingTiers({
  plans = DEFAULT_PLANS,
  heading = 'Simple, honest pricing',
  subheading = 'Start free. Upgrade when it starts paying for itself.',
  currency = '$',
  yearlyDiscount = 0.2,
  className = '',
}: PricingTiersProps) {
  const [yearly, setYearly] = React.useState(false)

  const priceOf = (plan: PricingPlan) => {
    if (plan.monthly === 0) return 'Free'
    const monthly = yearly ? plan.monthly * (1 - yearlyDiscount) : plan.monthly
    return `${currency}${Math.round(monthly)}`
  }

  return (
    <section className={`mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}>
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {heading}
        </h2>
        {subheading ? <p className="mt-3 text-muted-foreground">{subheading}</p> : null}
      </div>

      {/* Billing period toggle */}
      <div className="mb-12 flex items-center justify-center gap-3">
        <span className={yearly ? 'text-sm text-muted-foreground' : 'text-sm font-semibold'}>
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={yearly}
          aria-label="Bill yearly"
          onClick={() => setYearly((v) => !v)}
          className="relative h-6 w-11 shrink-0 rounded-full border border-border/60 bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 aria-checked:bg-primary"
        >
          <span
            aria-hidden
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-all ${
              yearly ? 'left-6' : 'left-0.5'
            }`}
          />
        </button>
        <span className={yearly ? 'text-sm font-semibold' : 'text-sm text-muted-foreground'}>
          Yearly
          <span className="ms-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Save {Math.round(yearlyDiscount * 100)}%
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col rounded-2xl border bg-card/80 p-6 backdrop-blur transition-shadow hover:shadow-lg ${
              plan.featured
                ? 'border-primary/40 shadow-lg ring-1 ring-primary/30'
                : 'border-border/60'
            }`}
          >
            {plan.featured ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                Most popular
              </span>
            ) : null}

            <h3 className="text-lg font-bold tracking-tight">{plan.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight">{priceOf(plan)}</span>
              {plan.monthly > 0 ? (
                <span className="text-sm text-muted-foreground">/month</span>
              ) : null}
            </div>
            {plan.monthly > 0 && yearly ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {currency}
                {Math.round(plan.monthly * 12 * (1 - yearlyDiscount))} billed yearly
              </p>
            ) : null}

            <ul className="mt-6 flex-1 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check
                    aria-hidden
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                  />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className={`mt-8 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                plan.featured
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'border border-border/60 bg-background hover:bg-muted'
              }`}
            >
              {plan.cta ?? 'Get started'}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
