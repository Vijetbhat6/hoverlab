'use client'

/**
 * <PricingTiers> — 4-tier pricing (Free / Pro / Studio / Team), all
 * purchasable.
 *
 * The three paid plans are deliberately different shapes:
 *   Pro    — ONE-TIME $79. Individual devs won't subscribe for CSS snippets
 *            they can get free elsewhere, but this market does pay once to
 *            own the source outright (cf. Tailwind Plus, Magic UI Pro).
 *   Studio — ONE-TIME $299 for ten seats. The same license bought for a
 *            whole team, because that is how this market sells to teams
 *            (Preline $459/15, Tailkit $549/10, Aceternity $1,590/10) — and
 *            a team that compares a subscription against buying Pro n times
 *            buys Pro n times.
 *   Team   — $12 per seat / month. Seats and shared state are what companies
 *            actually pay recurring money for.
 *
 * Pro+ is sold here too, but as a line of copy under the table rather than
 * a fifth column. It grants no catalog rights — it is a monthly AI credit
 * allowance — so giving it a card would make the licence comparison harder
 * in order to advertise a meter.
 *
 * Prices, buyability and the display currency all come from usePricing() —
 * see that hook for why region and purchasability have to come from the
 * server, and why currency is a display preference only.
 *
 * This is the ONLY pricing UI. /account renders the same section (via
 * <UpgradePanel>) rather than a second, smaller one of its own: a signed-in
 * customer comparing plans should see the same three tiers, the same prices
 * and the same currency toggle they saw before they had an account.
 *
 * What changes when signed in is the CTA, not the layout — a tier the user
 * already holds says so instead of offering to sell it again. That state
 * comes from entitlements, and while entitlements are unknown the paid CTAs
 * are held back: Pro is a one-time license, and offering it to an owner
 * whose entitlement read merely failed invites a second purchase of
 * something that cannot be used twice.
 */

import * as React from 'react'
import Link from 'next/link'
import { Check, Sparkles, ArrowRight, Loader2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Reveal } from '@/components/reveal'
import { useAuth } from '@/components/auth-provider'
import { useCheckout } from '@/hooks/use-checkout'
import { useEntitlements } from '@/hooks/use-entitlements'
import { usePricing, type Currency } from '@/hooks/use-pricing'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { PLANS, USD_TO_INR, type PlanId } from '@/lib/billing/plans'
import { DAILY_EXPORTS } from '@/lib/billing/quota-limits'
import { TOTAL_COUNT } from '@/lib/catalog-stats'
import { CATEGORIES } from '@/lib/effect-types'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { PAGE_COUNT } from '@/lib/pages/page-index'
import { TEMPLATE_COUNT } from '@/lib/templates/template-index'

/**
 * One line in a tier's feature list.
 *
 * A bare string is something the plan delivers today. `{ soon }` is something
 * sold but not yet built, and it renders visibly marked rather than with the
 * same green check as everything else.
 *
 * That distinction exists because Team needed it. Its four differentiators —
 * shared brand library, shared collections, workspace theming, seat
 * management — are advertised on a recurring per-seat plan and none of them
 * are implemented: `canUseTeamFeatures` in `billing/entitlements.ts` is read
 * by nothing, there is no team route, and checkout always buys one seat. A
 * customer can pay $12/seat/month today and receive, functionally, the Pro
 * feature set. Listing those four with a check mark was the one piece of copy
 * here that could take money for something that does not exist.
 */
type Feature = string | { label: string; soon: true }

interface Tier {
  id: PlanId
  name: string
  period: string
  tagline: string
  cta: string
  ctaVariant: 'default' | 'outline' | 'ghost'
  popular?: boolean
  badge?: string
  features: Feature[]
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
      // The other three rungs, named on the pricing page for the first time.
      // They shipped without ever reaching this list, so a visitor comparing
      // plans saw a catalog of loose CSS snippets and none of the blocks,
      // pages or whole starter projects sitting above them.
      // Split, now that the top rung is not all free. Naming the free
      // template rather than saying "1 template" matters: the pitch is that
      // you get a whole runnable project to judge the others by, and a bare
      // count does not say that.
      `${BLOCK_COUNT} blocks and ${PAGE_COUNT} pages — full source`,
      'One complete template, free — the Marketing Site project',
      'CLI and public API — npx hoverlab add <id>',
      'Live customization sliders',
      'HTML, CSS and React exports',
      'Save favorites (sync across devices)',
      'Bundle up to 10 effects',
      // The daily cap is named on the card rather than discovered at the
      // download button. A limit a visitor finds out about by hitting it
      // reads as the product breaking; a limit on the pricing page reads as
      // the free tier being finite, which is the honest description.
      `Export bundles as CSS, HTML, or ZIP — ${DAILY_EXPORTS.free} a day`,
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
      // Scoped to the catalog, not to effects: the licence has always covered
      // whatever you ship, and three of the four rungs did not exist when
      // this line was written.
      // First line on the card, because it is the one thing on it that a
      // free user does not already have. The licence follows it.
      `All ${TEMPLATE_COUNT} templates — complete, runnable projects`,
      'Commercial licence — every effect, block, page and template',
      'Client work, paid products, no attribution',
      // The certificate, named on the card. The licence was always the
      // thing being sold and the buyer received nothing they could show
      // for it, which is a strange way to sell the one part of this that
      // copying the source does not get you. See /license.
      'A dated licence certificate to forward to whoever asks',
      'Unlimited bundle size',
      'Unlimited exports — no daily cap',
      // Named rather than summarised as "every format": the free tier has
      // three of them, so "every" only means something next to a list.
      'Vue, Svelte, styled-components and Tailwind exports',
      'Save your brand colors to your account',
      'Private collections, synced across machines',
      // The key is a feature, not plumbing: it is what makes the licence
      // work in CI and in an agent, which is where this audience lives.
      'A licence key for the CLI, MCP and the API',
      'All future updates included',
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    period: 'once — 10 seats',
    tagline: 'For agencies and product teams who all ship from one catalog.',
    cta: 'Buy Studio',
    ctaVariant: 'outline',
    badge: 'One-time payment',
    features: [
      'Everything in Pro, for 10 people',
      // The arithmetic is the pitch, so it is on the card rather than left
      // for the buyer to do: ten Pro licenses is $790.
      'Ten seats for the price of under four Pro licenses',
      'Invite your team with a workspace code',
      'One invoice, one license, no renewals',
      'All future updates included',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    period: '/seat /month',
    tagline: 'For design systems teams standardizing UI across products.',
    cta: 'Start Team plan',
    ctaVariant: 'outline',
    features: [
      'Everything in Pro, for every seat',
      'Priority email support',
      { label: 'Shared brand color library', soon: true },
      { label: 'Shared collections and bundles', soon: true },
      { label: 'Workspace-wide theming', soon: true },
      { label: 'Seat management', soon: true },
    ],
  },
]

/** What the signed-in user already has, as far as one tier is concerned. */
type Ownership =
  /** Anonymous visitor, or entitlements still loading. */
  | 'unknown'
  /** Signed in, and this tier is theirs. */
  | 'owned'
  /** Signed in, and this tier is still sellable. */
  | 'available'

/**
 * Call-to-action for one tier.
 *
 * Until the server has said whether a tier can be bought, the button renders
 * disabled rather than guessing. Guessing "buyable" dead-ends at a 503;
 * guessing "waitlist" flashes the wrong CTA at every visitor on a correctly
 * configured deployment.
 *
 * Ownership is checked before purchasability, so an existing customer is
 * never shown a buy button for what they already hold — on either surface
 * this section renders on.
 */
function TierCta({
  tier,
  busy,
  purchasable,
  ownership,
  signedIn,
  onBuy,
}: {
  tier: Tier
  busy: boolean
  purchasable: boolean | null
  ownership: Ownership
  signedIn: boolean
  onBuy: () => void
}) {
  if (ownership === 'owned') {
    return (
      <Button variant="outline" className="mb-6 w-full" size="lg" disabled>
        <Check className="mr-1.5 h-4 w-4" />
        {tier.id === 'free' ? 'Your current plan' : 'Active on this account'}
      </Button>
    )
  }

  if (tier.id === 'free') {
    // Signed-in visitors already have the free tier; sending them to /signup
    // would bounce straight back off the proxy's auth redirect.
    if (signedIn) {
      return (
        <Button variant={tier.ctaVariant} className="mb-6 w-full" size="lg" asChild>
          <Link href="/library">
            Browse the library
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      )
    }
    return (
      <Button variant={tier.ctaVariant} className="mb-6 w-full" size="lg" asChild>
        <Link href="/signup">
          {tier.cta}
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </Button>
    )
  }

  // Either the server hasn't said whether this is buyable, or we're signed in
  // and don't yet know what this account holds. Both resolve on their own in
  // a moment; neither is worth a checkout we might have to refund.
  if (purchasable === null || (signedIn && ownership === 'unknown')) {
    return (
      <Button variant={tier.ctaVariant} className="mb-6 w-full" size="lg" disabled>
        {tier.cta}
      </Button>
    )
  }

  if (!purchasable) {
    return (
      <Button variant="outline" className="mb-6 w-full" size="lg" asChild>
        {/* Route-qualified, not a bare "#newsletter": this section also
            renders on /account, where that anchor does not exist. */}
        <Link href="/#newsletter">
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

/**
 * @param className Overrides for the section's own padding and width, so
 *   the same tiers can sit in the narrower /account column. Tier markup is
 *   never varied by caller — that is the whole point of sharing this.
 */
export function PricingTiers({ className }: { className?: string } = {}) {
  const { startCheckout, pendingPlan } = useCheckout()
  const { user } = useAuth()
  const { entitlements } = useEntitlements()
  const {
    region,
    currency: activeCurrency,
    chooseCurrency,
    isDiscounted,
    headlineFor,
    listHeadlineFor,
    secondaryFor,
    chargedInInr,
    purchasableFor,
  } = usePricing()

  // Entry point of the revenue funnel — paired with checkout_started and
  // purchase_completed, this is what makes the drop-off measurable.
  React.useEffect(() => {
    track('pricing_viewed', {})
  }, [])

  const signedIn = !!user

  /**
   * True when this visitor's checkout will actually be in rupees.
   *
   * Per-plan underneath, but the tiers move together — both are provisioned
   * by the same script run — and the page-level copy needs one answer.
   */
  const rupeeCheckout =
    chargedInInr('pro') || chargedInInr('studio') || chargedInInr('team')

  /** Pro+ has no tier card, so its price is read for the add-on line. */
  const plusPrice = headlineFor('plus')

  /**
   * Which tiers this account already holds.
   *
   * Anonymous visitors are 'unknown' throughout — they are shown the plain
   * sales CTAs, exactly as before. A Team seat includes everything Pro
   * grants, so a Team member sees Pro as owned too; buying it separately
   * would add nothing.
   */
  const ownershipFor = (id: PlanId): Ownership => {
    if (!signedIn || !entitlements) return 'unknown'
    if (id === 'free') return entitlements.plan === 'free' ? 'owned' : 'available'
    if (id === 'pro') return entitlements.canUseProFeatures ? 'owned' : 'available'
    // Studio and Team are distinct purchases, not rungs: a Studio license
    // does not include the shared workspace, and a Team subscriber who wants
    // to stop renewing can still buy Studio. Only the plan you actually hold
    // reads as owned.
    if (id === 'studio') return entitlements.hasStudio ? 'owned' : 'available'
    return entitlements.hasTeam ? 'owned' : 'available'
  }

  return (
    <section
      id="pricing"
      className={cn(
        'mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8',
        className,
      )}
    >
      <Reveal className="mx-auto mb-12 max-w-2xl text-center">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Simple, honest pricing
        </div>
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Free forever. Pro once. Studio for ten. Team by the seat.
        </h2>
        <p className="mt-3 text-muted-foreground">
          Every rung of the ladder — effects, blocks, pages and templates — is
          free to browse, customize and copy for personal projects, and none
          of it moves behind a login. Pro is a single payment that covers
          commercial work for good, Studio is that same license bought once
          for ten people, and Team puts it on a per-seat plan with shared
          brand tokens and seat management on the way.
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
            // For a buyer who really is charged in rupees there is nothing to
            // warn about — the figure above is the figure on the card.
            <p className="text-xs text-muted-foreground">
              {rupeeCheckout
                ? 'Charged in rupees — this is the amount, not a conversion'
                : 'Indicative — you are charged in USD'}
            </p>
          )}
        </div>
      </Reveal>

      {/* Four tiers: two up at tablet width, four across on desktop. A
          three-column grid would orphan Team onto its own row. */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                  {headlineFor(tier.id)}
                </span>
                {/* List price kept visible when a regional discount applies,
                    so the discount is legible as a discount rather than
                    looking like the product is simply cheap. */}
                {isDiscounted(tier.id) && (
                  <span className="text-lg font-medium text-muted-foreground line-through">
                    {listHeadlineFor(tier.id)}
                  </span>
                )}
                <span className="text-sm text-muted-foreground">
                  {tier.period}
                </span>
              </div>
              {tier.id !== 'free' && (
                /*
                  The currency not currently selected, as a reference. The ≈
                  marks whichever side is not the real charge: for a plan sold
                  in rupees the dollar figure is the conversion, and for every
                  other plan it is the rupee figure.
                */
                <p className="mt-1 text-sm text-muted-foreground">
                  {(activeCurrency === 'INR') === chargedInInr(tier.id)
                    ? '≈ '
                    : ''}
                  {secondaryFor(tier.id)}
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">{tier.tagline}</p>
            </div>

            <TierCta
              tier={tier}
              busy={pendingPlan === tier.id}
              purchasable={purchasableFor(tier.id)}
              ownership={ownershipFor(tier.id)}
              signedIn={signedIn}
              onBuy={() => startCheckout(tier.id)}
            />

            <ul className="mt-auto space-y-2.5">
              {tier.features.map((f, j) => {
                const soon = typeof f !== 'string'
                const label = typeof f === 'string' ? f : f.label
                return (
                  <li key={j} className="flex items-start gap-2.5 text-sm">
                    {soon ? (
                      <Clock
                        aria-hidden
                        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                      />
                    ) : (
                      <Check
                        aria-hidden
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                      />
                    )}
                    <span
                      className={
                        soon ? 'text-muted-foreground' : 'text-foreground/90'
                      }
                    >
                      {label}
                      {soon && (
                        <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Coming
                        </span>
                      )}
                    </span>
                  </li>
                )
              })}
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
          support, and the CLI and public API are open to everyone. Free
          covers personal and non-commercial projects; shipping anything from
          the catalog in client work or a paid product needs Pro, Studio or
          Team. No credit card required for Free.
        </p>
        {/*
          Said before the buy button, not after the charge. Team's shared
          workspace features are still being built, and a per-seat
          subscription that quietly bills for them would be indefensible —
          so the card marks them and this says what a Team seat gets today.
        */}
        <p className="mt-2 text-xs text-muted-foreground">
          Lines marked <span className="font-semibold">Coming</span> are on the
          roadmap and not available yet. A Team seat today grants the full Pro
          feature set for every member, plus priority support; the shared
          workspace features ship later this year.
        </p>
        {/*
          Pro+ deliberately has no column. It grants no catalog rights, so a
          fifth tier would make the licence decision harder in order to sell
          a meter — it belongs beside the table, as an add-on to whatever
          the reader picks.
        */}
        <p className="mt-4 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            Pro+ — {plusPrice}/month
          </span>{' '}
          adds 500 AI credits a month on top of any plan, including Free.
          Credits are only spent generating new CSS in the{' '}
          <Link href="/playground" className="font-medium text-primary hover:underline">
            playground
          </Link>
          ; browsing, copying, the CLI and the API are free and unmetered.
          Everyone gets five free generations a day without it.
        </p>

        {/*
          The licence, linked before the buy button rather than after it.

          It is the whole answer to the obvious objection — that the code is
          free to copy, so why pay — and until it had a page, it was a bullet
          point on a card. Nobody's legal team approves a bullet point.
        */}
        <p className="mt-4 text-sm text-muted-foreground">
          Everything here is free to read, copy and modify under the{' '}
          <Link href="/license" className="font-medium text-primary hover:underline">
            free licence
          </Link>
          . What Pro, Studio and Team add is the commercial one — permission
          to ship the result in work you are paid for, with a dated
          certificate you can forward. Both are written out in full.
        </p>

        {/* The one thing a buyer could reasonably get wrong about the two
            team-shaped plans, said before they pick one. */}
        <p className="mt-2 text-xs text-muted-foreground">
          Studio is a license, not a workspace: it covers ten people with the
          full Pro feature set and never renews. The shared brand library and
          shared collections belong to Team.
        </p>
        {rupeeCheckout ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Regional pricing for India is applied automatically, and checkout
            is shown and charged in rupees — the amount above is what reaches
            your card, with no cross-border currency fee from your issuer. The
            dollar figures are the reference conversion.
          </p>
        ) : region === 'IN' ? (
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
