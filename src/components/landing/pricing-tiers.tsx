'use client'

/**
 * <PricingTiers> — 3-tier pricing (Free / Pro / Team), all purchasable.
 *
 * These tiers used to advertise prices with "coming soon" CTAs pointing
 * at a newsletter box — a product that couldn't be bought. Each paid tier
 * now opens a real Polar checkout.
 *
 * The two paid plans are deliberately different shapes:
 *   Pro  — ONE-TIME $59. Individual devs won't subscribe for CSS snippets
 *          they can get free elsewhere, but this market does pay once to
 *          own the source outright (cf. Tailwind Plus, Magic UI Pro).
 *   Team — $24 per seat / month. Seats and shared state are what companies
 *          actually pay recurring money for.
 *
 * A tier whose POLAR_PRODUCT_ID_* env var is unset falls back to the
 * waitlist CTA rather than rendering a buy button that would dead-end.
 */

import * as React from 'react'
import Link from 'next/link'
import { Check, Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Reveal } from '@/components/reveal'
import { useCheckout } from '@/hooks/use-checkout'
import { track } from '@/lib/analytics'
import { PLANS, formatPrice, isPurchasable, type PlanId } from '@/lib/billing/plans'
import { TOTAL_COUNT } from '@/lib/catalog-stats'
import { CATEGORIES } from '@/lib/effect-types'

interface Tier {
  id: PlanId
  name: string
  price: string
  period: string
  tagline: string
  cta: string
  ctaVariant: 'default' | 'outline' | 'ghost'
  popular?: boolean
  badge?: string
  features: string[]
}

const TIERS: Tier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    tagline: 'For individuals exploring, learning, and shipping side projects.',
    cta: 'Get started',
    ctaVariant: 'outline',
    features: [
      // Derived, not typed out. This line read "All 1,600+ effects, all 13
      // categories" while the catalog held 4,308 across 32 — understating the
      // product by 2.7x on the pricing page. @/lib/catalog-stats is ~1 KB, so
      // there is no bundle reason to hardcode it.
      `All ${TOTAL_COUNT.toLocaleString('en-US')}+ effects, all ${CATEGORIES.length} categories`,
      'Live customization sliders',
      'Save favorites (sync across devices)',
      'Bundle up to 10 effects',
      'Export bundles as CSS, HTML, or ZIP',
      'PWA — installable, offline-ready',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: formatPrice(PLANS.pro.priceCents),
    period: 'once — yours forever',
    tagline: 'For developers shipping client work and commercial products.',
    cta: 'Buy Pro',
    ctaVariant: 'default',
    popular: true,
    badge: 'One-time payment',
    features: [
      'Everything in Free',
      'Unlimited bundle size',
      'Every export format (Vue, Svelte, Tailwind)',
      'Custom brand color presets',
      'Private effect collections',
      'Commercial license pre-cleared',
      'All future updates included',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: formatPrice(PLANS.team.priceCents),
    period: '/seat /month',
    tagline: 'For design systems teams standardizing effects across products.',
    cta: 'Start Team plan',
    ctaVariant: 'outline',
    features: [
      'Everything in Pro, for every seat',
      'Shared brand color library',
      'Shared collections and bundles',
      'Workspace-wide theming',
      'Seat management',
      'Priority email support',
    ],
  },
]

/**
 * Call-to-action for one tier.
 *
 * Free links to signup. Paid tiers open Polar checkout — unless their
 * product id is missing from the environment, in which case they fall
 * back to the waitlist rather than showing a buy button that would fail
 * at the API with a 503.
 */
function TierCta({
  tier,
  busy,
  onBuy,
}: {
  tier: Tier
  busy: boolean
  onBuy: () => void
}) {
  if (tier.id === 'free') {
    return (
      <Button variant={tier.ctaVariant} className="mb-6 w-full" size="lg" asChild>
        <Link href="/signup">
          {tier.cta}
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </Button>
    )
  }

  if (!isPurchasable(PLANS[tier.id])) {
    return (
      <Button variant="outline" className="mb-6 w-full" size="lg" asChild>
        <Link href="#newsletter">
          Join the waitlist
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </Button>
    )
  }

  return (
    <Button
      variant={tier.ctaVariant}
      className="mb-6 w-full"
      size="lg"
      onClick={onBuy}
      disabled={busy}
    >
      {busy ? (
        <>
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          Starting checkout…
        </>
      ) : (
        <>
          {tier.cta}
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </>
      )}
    </Button>
  )
}

export function PricingTiers() {
  const { startCheckout, pendingPlan } = useCheckout()

  // Entry point of the revenue funnel — paired with checkout_started and
  // purchase_completed, this is what makes the drop-off measurable.
  React.useEffect(() => {
    track('pricing_viewed', {})
  }, [])

  return (
    <section
      id="pricing"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
    >
      <Reveal className="mx-auto mb-12 max-w-2xl text-center">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Simple, honest pricing
        </div>
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Free forever. Pro once. Team by the seat.
        </h2>
        <p className="mt-3 text-muted-foreground">
          Browsing, customizing, and copying every effect stays free — that
          part never moves behind a login. Pro is a single payment you own
          for good; Team adds shared brand tokens and seats.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {TIERS.map((tier, i) => (
          <Reveal
            key={tier.name}
            delay={i * 80}
            className={
              'fx-bento-tile relative flex h-full flex-col rounded-2xl border bg-card/80 p-6 backdrop-blur ' +
              (tier.popular
                ? 'fx-pricing-popular border-transparent lg:-mt-4 lg:mb-4'
                : 'border-border/60')
            }
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight">{tier.name}</h3>
              {tier.badge && (
                <Badge className="bg-primary/15 text-primary hover:bg-primary/20">
                  {tier.badge}
                </Badge>
              )}
            </div>
            <div className="mb-2 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight">
                {tier.price}
              </span>
              <span className="text-sm text-muted-foreground">
                {tier.period}
              </span>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">{tier.tagline}</p>

            <TierCta
              tier={tier}
              busy={pendingPlan === tier.id}
              onBuy={() => startCheckout(tier.id)}
            />

            <ul className="mt-auto space-y-2.5">
              {tier.features.map((f, j) => (
                <li key={j} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>

      <Reveal delay={240} className="mt-8 text-center">
        <p className="text-xs text-muted-foreground">
          All plans include the MIT-licensed CSS, PWA install, and{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            prefers-reduced-motion
          </code>{' '}
          support. No credit card required for Free.
        </p>
      </Reveal>
    </section>
  )
}
