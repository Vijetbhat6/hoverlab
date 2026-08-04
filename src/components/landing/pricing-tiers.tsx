'use client'

/**
 * <PricingTiers> — 3-tier pricing (Free / Pro / Team), all purchasable.
 *
 * The two paid plans are deliberately different shapes:
 *   Pro  — ONE-TIME $59. Individual devs won't subscribe for CSS snippets
 *          they can get free elsewhere, but this market does pay once to
 *          own the source outright (cf. Tailwind Plus, Magic UI Pro).
 *   Team — $12 per seat / month. Seats and shared state are what companies
 *          actually pay recurring money for.
 *
 * Prices and buyability are fetched from /api/billing/pricing rather than
 * derived here, for two reasons:
 *
 *   Region. India pays a PPP-adjusted price, decided from an edge
 *   geolocation header the browser has no access to.
 *
 *   Purchasability. `isPurchasable()` tests `polarProductId`, which comes
 *   from POLAR_PRODUCT_ID_* — server-only env vars that Next does not inline
 *   into the client bundle. Calling it here always returned false, so every
 *   tier fell back to the waitlist CTA and the buy button could never render.
 *
 * What this component displays is advisory. The charge is decided by
 * /api/billing/checkout from the same header, so a visitor who fakes their
 * way to a cheaper-looking page still checks out at list price.
 *
 * The currency toggle changes the currency a price is WRITTEN IN. It does not
 * — and must not — change which price applies. Letting a visitor select their
 * pricing region would either hand the India discount to everyone who clicks
 * it, or show a price the server then refuses to honor. Region comes from the
 * request; currency is a display preference.
 */

import * as React from 'react'
import Link from 'next/link'
import { Check, Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Reveal } from '@/components/reveal'
import { useCheckout } from '@/hooks/use-checkout'
import { track } from '@/lib/analytics'
import {
  PLANS,
  formatPrice,
  formatPriceInr,
  USD_TO_INR,
  type PlanId,
  type Region,
} from '@/lib/billing/plans'
import { TOTAL_COUNT } from '@/lib/catalog-stats'
import { CATEGORIES } from '@/lib/effect-types'

interface Tier {
  id: PlanId
  name: string
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
      'Personal and non-commercial projects',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    period: 'once — yours forever',
    tagline: 'For developers shipping client work and commercial products.',
    cta: 'Buy Pro',
    ctaVariant: 'default',
    popular: true,
    badge: 'One-time payment',
    features: [
      'Everything in Free',
      'Commercial use — client work and paid products',
      'Unlimited bundle size',
      'Every export format (Vue, Svelte, Tailwind)',
      'Custom brand color presets',
      'Private effect collections',
      'All future updates included',
    ],
  },
  {
    id: 'team',
    name: 'Team',
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

/** Shape of GET /api/billing/pricing. */
interface PricingResponse {
  region: Region
  plans: Record<string, { priceCents: number; purchasable: boolean }>
}

/** Currency a price is displayed in. Never what it is charged in — see above. */
type Currency = 'USD' | 'INR'

const CURRENCY_KEY = 'hl:pricing-currency'

/**
 * Call-to-action for one tier.
 *
 * Until the server has said whether a tier can be bought, the button renders
 * disabled rather than guessing. Guessing "buyable" dead-ends at a 503;
 * guessing "waitlist" flashes the wrong CTA at every visitor on a correctly
 * configured deployment.
 */
function TierCta({
  tier,
  busy,
  purchasable,
  onBuy,
}: {
  tier: Tier
  busy: boolean
  purchasable: boolean | null
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

  if (purchasable === null) {
    return (
      <Button variant={tier.ctaVariant} className="mb-6 w-full" size="lg" disabled>
        {tier.cta}
      </Button>
    )
  }

  if (!purchasable) {
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
  const [pricing, setPricing] = React.useState<PricingResponse | null>(null)
  // null = the visitor hasn't chosen, so fall back to the regional default.
  const [currency, setCurrency] = React.useState<Currency | null>(null)

  // Entry point of the revenue funnel — paired with checkout_started and
  // purchase_completed, this is what makes the drop-off measurable.
  React.useEffect(() => {
    track('pricing_viewed', {})
  }, [])

  React.useEffect(() => {
    let cancelled = false
    fetch('/api/billing/pricing')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PricingResponse | null) => {
        if (!cancelled && data) setPricing(data)
      })
      .catch(() => {
        // Leave `pricing` null: list prices stay on screen and the paid CTAs
        // stay disabled. Better than offering a checkout we can't confirm.
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Restore a previous choice. Read on mount rather than in useState's
  // initializer so the server and first client render agree — reading
  // localStorage during render would hydrate-mismatch every visitor who has
  // ever touched the toggle.
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CURRENCY_KEY)
      if (stored === 'USD' || stored === 'INR') setCurrency(stored)
    } catch {
      // Private mode / storage disabled — the regional default is fine.
    }
  }, [])

  /**
   * Explicit choice wins; otherwise default from the region. Someone browsing
   * from India almost certainly wants to read rupees, and someone elsewhere
   * almost certainly doesn't — but either can override, which is the point of
   * the toggle (NRIs, agencies billing abroad, anyone comparing).
   */
  const activeCurrency: Currency =
    currency ?? (pricing?.region === 'IN' ? 'INR' : 'USD')

  function chooseCurrency(next: Currency) {
    setCurrency(next)
    try {
      window.localStorage.setItem(CURRENCY_KEY, next)
    } catch {
      // Not worth surfacing — the toggle still works for this page view.
    }
    track('pricing_currency_toggled', {
      currency: next,
      region: pricing?.region ?? 'unknown',
    })
  }

  /** Cents to display — regional price once known, list price until then. */
  const centsFor = (id: PlanId): number =>
    pricing?.plans[id]?.priceCents ?? PLANS[id].priceCents

  const isDiscounted = (id: PlanId): boolean =>
    centsFor(id) < PLANS[id].priceCents

  /** Headline figure, in whichever currency is selected. */
  const headline = (cents: number): string =>
    activeCurrency === 'INR' ? formatPriceInr(cents) : formatPrice(cents)

  /** The other currency, shown underneath as the secondary reference. */
  const secondary = (cents: number): string =>
    activeCurrency === 'INR' ? formatPrice(cents) : formatPriceInr(cents)

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
          Browsing, customizing, and copying every effect stays free for
          personal projects — that part never moves behind a login. Pro is a
          single payment that covers commercial work for good; Team adds
          shared brand tokens and seats.
        </p>

        {/*
          A segmented control rather than an on/off Switch: a switch has no way
          to say which side is which, so "on" would mean rupees only to whoever
          built it. Two labelled options are self-describing and land on radio
          semantics for screen readers.
        */}
        <div className="mt-6 flex flex-col items-center gap-1.5">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={activeCurrency}
            // Radix emits '' when the active item is pressed again. Currency
            // is not an optional state, so ignore the deselect.
            onValueChange={(v) => v && chooseCurrency(v as Currency)}
            aria-label="Display prices in"
          >
            <ToggleGroupItem value="USD" aria-label="Show prices in US dollars">
              $ USD
            </ToggleGroupItem>
            <ToggleGroupItem value="INR" aria-label="Show prices in Indian rupees">
              ₹ INR
            </ToggleGroupItem>
          </ToggleGroup>
          {activeCurrency === 'INR' && (
            // The one thing a rupee headline could mislead someone about, said
            // at the point of the switch rather than only in the small print.
            <p className="text-xs text-muted-foreground">
              Indicative — you are charged in USD
            </p>
          )}
        </div>
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
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight">
                  {headline(centsFor(tier.id))}
                </span>
                {/* List price kept visible when a regional discount applies,
                    so the discount is legible as a discount rather than
                    looking like the product is simply cheap. */}
                {isDiscounted(tier.id) && (
                  <span className="text-lg font-medium text-muted-foreground line-through">
                    {headline(PLANS[tier.id].priceCents)}
                  </span>
                )}
                <span className="text-sm text-muted-foreground">
                  {tier.period}
                </span>
              </div>
              {tier.id !== 'free' && (
                // The currency not currently selected, as a reference. Only
                // the rupee side is ever approximate, so only it gets the ≈.
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeCurrency === 'INR' ? '' : '≈ '}
                  {secondary(centsFor(tier.id))}
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">{tier.tagline}</p>
            </div>

            <TierCta
              tier={tier}
              busy={pendingPlan === tier.id}
              purchasable={
                tier.id === 'free'
                  ? true
                  : (pricing?.plans[tier.id]?.purchasable ?? null)
              }
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
          Every plan includes PWA install and{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            prefers-reduced-motion
          </code>{' '}
          support. Free covers personal and non-commercial projects; shipping
          an effect in client work or a paid product needs Pro or Team. No
          credit card required for Free.
        </p>
        {pricing?.region === 'IN' ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Regional pricing for India is applied automatically at checkout.
            Paid plans are still charged in USD — the rupee figures above are
            indicative, converted at approximately ₹{USD_TO_INR}/$, and your
            card issuer&rsquo;s rate on the day sets the final amount.
          </p>
        ) : (
          /*
            Stated plainly rather than buried at checkout: the rupee figures
            above are a convenience conversion, and someone paying with an
            Indian card will see a slightly different number on their
            statement. Better they learn that here than after paying.
          */
          <p className="mt-2 text-xs text-muted-foreground">
            Paid plans are charged in USD. Rupee amounts are indicative,
            converted at approximately ₹{USD_TO_INR}/$ — your card
            issuer&rsquo;s rate on the day sets the final amount.
          </p>
        )}
      </Reveal>
    </section>
  )
}
