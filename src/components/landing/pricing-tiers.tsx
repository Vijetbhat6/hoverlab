'use client'

/**
 * <PricingTiers> — 4-tier pricing (Free / Pro / Studio / Team), all
 * purchasable.
 *
 * The paid plans are deliberately different shapes:
 *   Pro    — ONE-TIME $79. Individual devs won't subscribe for CSS snippets
 *            they can get free elsewhere, but this market does pay once to
 *            own the source outright (cf. Tailwind Plus, Magic UI Pro).
 *   Studio — ONE-TIME $299 for ten seats. The same license bought for a
 *            whole team, because that is how this market sells to teams
 *            (Preline $459/15, Tailkit $549/10, Aceternity $1,590/10) — and
 *            a team that compares a subscription against buying Pro n times
 *            buys Pro n times.
 *   Enterprise — ONE-TIME $999 for fifty seats. The rung above Studio, and
 *            the only one NOT rendered as a card: it is a band under the
 *            grid, because nobody weighs a fifty-seat licence against a free
 *            tier and a fifth column would cost the four that do get
 *            compared a quarter of their width. See <EnterpriseBand>.
 *   Enterprise — ONE-TIME $999 for fifty seats. The rung above Studio, and
 *            the only one NOT rendered as a card: it is a band under the
 *            grid, because nobody weighs a fifty-seat licence against a free
 *            tier and a fifth column would cost the four that do get
 *            compared a quarter of their width. See <EnterpriseBand>.
 *   Team   — $12 per seat / month. Seats and shared state are what companies
 *            actually pay recurring money for.
 *
 * There is no Pro+ column, and no Pro+ line either. Credits used to be a
 * $9/month add-on advertised under this table; they are now bundled inside
 * the licence — see `includedCredits` on each plan, rendered from the
 * catalog under the table rather than typed here, granted once and never
 * expiring. See `includedCredits` in billing/plans.ts for why that is the
 * better product at the same price. What is left under the table is a
 * sentence about top-ups for the few people who run out.
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
import { usePathname } from 'next/navigation'
import {
  Check,
  Sparkles,
  ArrowRight,
  Loader2,
  Clock,
  Building2,
} from 'lucide-react'
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
import { supportFor } from '@/lib/billing/support'
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

/**
 * The support row for one tier, in the pricing table's own vocabulary.
 *
 * Phrased as what the buyer gets rather than as the tier's internal name:
 * "Priority support — 1 business day" answers the question, where
 * "Priority" alone invites it.
 */
function supportFeature(plan: PlanId): Feature {
  const tier = supportFor(plan)
  return tier.responseDays === null
    ? tier.label
    : `${tier.label} — ${tier.responseDays} business day${tier.responseDays === 1 ? '' : 's'}`
}

interface Tier {
  id: PlanId
  name: string
  /**
   * The unit, and only the unit — 'once', 'forever', '/seat /month'.
   *
   * It sits on the same line as the headline figure, so anything longer
   * than a couple of words has to fit beside a four-figure rupee price and
   * a struck-through list price on a quarter-width card. It did not: this
   * used to read 'once — yours forever' and rendered outside the card.
   * The qualifier lives in `periodNote` instead.
   */
  period: string
  /**
   * The qualifier under the headline — what 'once' actually buys.
   *
   * Shares a line with the secondary-currency figure rather than adding a
   * fourth stacked line, and every tier sets one so all four price blocks
   * are the same height and the CTAs below them line up.
   */
  periodNote?: string
  tagline: string
  cta: string
  ctaVariant: 'default' | 'outline' | 'ghost'
  popular?: boolean
  badge?: string
  features: Feature[]
  /**
   * A second way to buy the same tier, offered under the main CTA.
   *
   * A link rather than a fifth card or a billing-period toggle. A card would
   * orphan a row in a four-across grid, and a toggle would hide one of the
   * two prices behind a click on the one control a visitor scanning prices
   * is least likely to touch. This is the same product either way, so it
   * belongs inside the tier that sells it.
   */
  altPlan?: { id: PlanId; label: string; note: string }
}

const TIERS: Tier[] = [
  {
    id: 'free',
    name: 'Free',
    period: 'forever',
    periodNote: 'No card, no expiry',
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
      // Links out rather than asserting. This line and the docs used to
      // disagree about whether free covers commercial work; /licence is now
      // the one place that answers it.
      'Personal and non-commercial projects — see the licence',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    period: 'once',
    periodNote: 'Yours forever',
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
      // Bundled, not upsold. This line used to be a $9/month add-on
      // advertised under the table, which asked a buyer who had just
      // decided to spend $79 to make a second, worse decision. The credits
      // cost the same to serve either way — see includedCredits in
      // billing/plans.ts.
      `${PLANS.pro.includedCredits?.toLocaleString('en-US')} AI credits included — they never expire`,
      'Commercial licence — every effect, block, page and template',
      'Client work, paid products, no attribution',
      // The certificate, named on the card. The licence was always the
      // thing being sold and the buyer received nothing they could show
      // for it, which is a strange way to sell the one part of this that
      // copying the source does not get you. See /license.
      'A dated licence certificate to forward to whoever asks',
      'Unlimited bundle size',
      // The meter, not the formats, is the honest wall here. A free
      // account gets ten exports a UTC day (DAILY_EXPORTS in
      // billing/quota-limits.ts) and the licence removes the counter.
      'Unlimited exports — no daily cap',
      // Named rather than summarised as "every format": the free tier has
      // three of them, so "every" only means something next to a list.
      //
      // This one is a product boundary on the website, not a lock, and the
      // card should never be written as though it were: `/api/v1` and the
      // CLI hand every format to any caller on purpose, which the footnote
      // below says out loud. FREE_FRAMEWORK_IDS in lib/export/index.ts
      // carries the same admission at the point it is enforced.
      'Vue, Svelte, styled-components and Tailwind exports',
      'Save your brand colors to your account',
      // The one Pro feature whose output does not exist until a customer
      // asks for it. Named on the card because it is the strongest answer
      // to "why pay for code I can copy".
      'Export your brand as a design system — CSS, Tailwind, Figma',
      'Private collections, synced across machines',
      // The key is a feature, not plumbing: it is what makes the licence
      // work in CI and in an agent, which is where this audience lives.
      'A licence key for the CLI, MCP and the API',
      // Was "All future updates included". Bounded, and said on the card
      // rather than discovered on the certificate — a term a buyer finds
      // out about after paying is a term that costs more in trust than it
      // recovers in revenue. See `updateWindowMonths` in billing/plans.ts.
      'Twelve months of catalog updates — what you have stays yours',
      // The delivery mechanism for the line above, named on the card.
      // A bounded update window with no way to find out an update happened
      // reads as a limitation; with `hoverlab outdated` behind it, it is
      // the feature. Nobody else in /compare answers this question.
      'npx hoverlab outdated — see what changed since you copied it',
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    period: 'once',
    periodNote: 'Ten seats, yours forever',
    tagline: 'For agencies and product teams who all ship from one catalog.',
    cta: 'Buy Studio',
    ctaVariant: 'outline',
    badge: 'One-time payment',
    features: [
      'Everything in Pro, for 10 people',
      // The arithmetic is the pitch, so it is on the card rather than left
      // for the buyer to do: ten Pro licenses is $790.
      'Ten seats for the price of under four Pro licenses',
      `${PLANS.studio.includedCredits?.toLocaleString('en-US')} AI credits for the workspace — they never expire`,
      'Invite your team with a workspace code',
      'One invoice, one license, no renewals',
      // Was "All future updates included". Bounded, and said on the card
      // rather than discovered on the certificate — a term a buyer finds
      // out about after paying is a term that costs more in trust than it
      // recovers in revenue. See `updateWindowMonths` in billing/plans.ts.
      'Twelve months of catalog updates — what you have stays yours',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    period: '/seat /month',
    periodNote: 'Billed monthly, cancel any time',
    tagline: 'For design systems teams standardizing UI across products.',
    cta: 'Start Team plan',
    ctaVariant: 'outline',
    /*
     * Offered on every card view, not only where the card rail is unreliable.
     * The reason it exists is regional — RBI e-mandate rules make recurring
     * cross-border charges fail from Indian cards, and Brazilian cards often
     * decline international recurring charges, which between them cover our
     * two largest audiences — but a plan that appears and disappears by IP
     * is worse than one always on offer, and buyers with procurement that
     * wants one invoice a year want the same thing for unrelated reasons.
     */
    altPlan: {
      id: 'team-annual',
      label: 'Pay for a year instead',
      note: 'per seat, once — no recurring charge, no renewal to fail',
    },
    features: [
      'Everything in Pro, for every seat',
      'Priority email support',
      // No longer `soon`. teams/{id}/brandPresets, /api/team/brand-presets
      // and the shared strip in the brand picker are real; requireTeam
      // gates it on a live subscription, and Studio deliberately does not
      // qualify. This was the one of Team's four differentiators worth a
      // recurring charge, so it is the one that got built.
      'Shared brand library — one palette, everyone on the workspace',
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
 * Enterprise — the fifty-seat licence, sold as a band rather than a card.
 *
 * WHY IT IS NOT A FIFTH COLUMN. The four cards above are a comparison, and
 * a comparison is only useful between things one person might actually
 * choose between. Nobody weighs a fifty-seat licence against a free tier,
 * so a fifth column would take a quarter of the width away from the four
 * that do get compared in order to advertise to the smallest audience on
 * the page — and it would break the equal-height row those four are tuned
 * for. Pro+ was sold this way for the same reason before it was retired.
 *
 * WHAT IT SAYS IT IS NOT. The "seats and the licence" line is deliberate
 * and belongs on the page rather than only in the plan catalog. Every
 * comparable enterprise tier sells SSO, SCIM or a private repo; a buyer who
 * has seen those tiers will assume this one has them unless it says
 * otherwise, and discovering it after paying $999 is a refund and a
 * grudge. See the Enterprise entry in billing/plans.ts.
 */
function EnterpriseBand({
  busy,
  purchasable,
  ownership,
  signedIn,
  headline,
  secondary,
  listHeadline,
  discounted,
  onBuy,
}: {
  busy: boolean
  purchasable: boolean | null
  ownership: Ownership
  signedIn: boolean
  headline: string
  secondary: string
  listHeadline: string
  discounted: boolean
  onBuy: () => void
}) {
  const seats = PLANS.enterprise.includedSeats ?? 50

  return (
    <Reveal delay={360} className="mt-6">
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Building2 aria-hidden className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-semibold tracking-tight">
                {PLANS.enterprise.name}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {seats} seats
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              More than ten people? Studio&rsquo;s licence for {seats} of them,
              bought once — one invite code and one update window instead of
              five of each. Everything Pro grants, for everyone on the team,
              with priority support.
            </p>
            <p className="mt-2 max-w-2xl text-xs text-muted-foreground">
              Seats and the licence. It does not include SSO, SCIM or a
              private repository — if those are what you need, we do not have
              them yet and would rather say so here than after you buy.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-3xl font-extrabold tracking-tight tabular-nums">
                {headline}
              </span>
              {discounted && (
                <span className="text-base font-medium text-muted-foreground line-through tabular-nums">
                  {listHeadline}
                </span>
              )}
              <span className="whitespace-nowrap text-sm text-muted-foreground">
                once
              </span>
            </div>
            <p className="text-xs text-muted-foreground lg:text-right">
              {secondary} &middot;{' '}Yours forever
            </p>
            <EnterpriseCta
              busy={busy}
              purchasable={purchasable}
              ownership={ownership}
              signedIn={signedIn}
              onBuy={onBuy}
            />
          </div>
        </div>
      </div>
    </Reveal>
  )
}

/**
 * The band's button, held to the same rules as `TierCta`.
 *
 * Ownership before purchasability, and a disabled button rather than a
 * guess while either is still unknown — a band that guessed differently
 * from the cards above it would be the same bug in a second place.
 */
function EnterpriseCta({
  busy,
  purchasable,
  ownership,
  signedIn,
  onBuy,
}: {
  busy: boolean
  purchasable: boolean | null
  ownership: Ownership
  signedIn: boolean
  onBuy: () => void
}) {
  if (ownership === 'owned') {
    return (
      <Button variant="outline" size="lg" className="w-full lg:w-auto" disabled>
        <Check className="mr-1.5 h-4 w-4" />
        Active on this account
      </Button>
    )
  }

  /*
   * Held back only while something is genuinely still resolving.
   *
   * `signedIn &&` is load-bearing and was missing here for a revision: an
   * anonymous visitor's ownership is ALWAYS 'unknown' — there is no account
   * to read one off — so without it every logged-out visitor got a dead
   * button, which is everyone this band is trying to sell to. Same rule as
   * TierCta, and it has to stay the same rule.
   */
  if (purchasable === null || (signedIn && ownership === 'unknown')) {
    return (
      <Button variant="outline" size="lg" className="w-full lg:w-auto" disabled>
        Buy Enterprise
      </Button>
    )
  }

  if (!purchasable) {
    return (
      <Button variant="outline" size="lg" className="w-full lg:w-auto" asChild>
        <Link href="/support">
          Talk to us
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full lg:w-auto"
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
          Buy Enterprise
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

  // Rendered on the landing page, on /account and on /pricing itself. Only
  // the first two have anywhere to send someone.
  const onPricingPage = usePathname() === '/pricing'

  /**
   * True when this visitor's checkout will actually be in rupees.
   *
   * Per-plan underneath, but the tiers move together — both are provisioned
   * by the same script run — and the page-level copy needs one answer.
   */
  const rupeeCheckout =
    chargedInInr('pro') || chargedInInr('studio') || chargedInInr('team')

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
    // Enterprise is the same kind of purchase as Studio, one rung up: a
    // Studio holder is not an Enterprise holder, and must still be able to
    // buy the bigger licence when the team outgrows ten.
    if (id === 'enterprise')
      return entitlements.hasEnterprise ? 'owned' : 'available'
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
          three-column grid would orphan Team onto its own row.

          `items-start` so each card ends where its content ends. Stretching
          them to a common height is only worth it when the lists are roughly
          the same length, and these are not — Pro sells fifteen rows and
          Studio seven — so equal heights bought aligned bottom borders at the
          price of four hundred pixels of empty card under two of the four
          CTAs. The tops still line up, which is the edge a price table is
          actually read along. */}
      <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier, i) => (
          <Reveal
            key={tier.name}
            delay={i * 80}
            className={
              'fx-bento-tile relative flex flex-col rounded-2xl border bg-card/80 p-6 backdrop-blur ' +
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
              {/*
                Wraps rather than overflows. A discounted rupee headline puts
                three items on this line — ₹2,400, a struck-through ₹7,580 and
                the unit — and a flex row that cannot wrap has a min-content
                width wider than a quarter-width card, so the unit rendered
                outside the card border. Wrapping drops it to its own line;
                `whitespace-nowrap` stops '/seat /month' breaking mid-unit
                once it gets there.
              */}
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-4xl font-extrabold tracking-tight tabular-nums">
                  {headlineFor(tier.id)}
                </span>
                {/* List price kept visible when a regional discount applies,
                    so the discount is legible as a discount rather than
                    looking like the product is simply cheap. */}
                {isDiscounted(tier.id) && (
                  <span className="text-lg font-medium text-muted-foreground line-through tabular-nums">
                    {listHeadlineFor(tier.id)}
                  </span>
                )}
                <span className="whitespace-nowrap text-sm text-muted-foreground">
                  {tier.period}
                </span>
              </div>
              {/*
                One line under the headline, carrying two things that are both
                secondary to the figure:

                  — the currency not currently selected, as a reference. The ≈
                    marks whichever side is not the real charge: for a plan
                    sold in rupees the dollar figure is the conversion, and for
                    every other plan it is the rupee figure.
                  — the qualifier that used to sit beside the headline and
                    push it out of the card.

                Together on one line, not stacked, so all four price blocks are
                exactly two lines tall and the CTAs underneath line up across
                the row. Free has no second currency worth printing — ₹0 is not
                a fact — so it carries the note alone and still fills the line.
              */}
              <p className="mt-1 text-sm text-muted-foreground lg:min-h-[2.5rem]">
                {tier.id !== 'free' && (
                  <>
                    {(activeCurrency === 'INR') === chargedInInr(tier.id)
                      ? '≈ '
                      : ''}
                    {secondaryFor(tier.id)}
                  </>
                )}
                {tier.id !== 'free' && tier.periodNote ? ' · ' : ''}
                {tier.periodNote}
              </p>
              {/*
                Reserved height, four across only. In that range the cards are
                narrow enough that one tagline takes three lines and its
                neighbour takes two, which walked the four CTAs up to 44px out
                of line with each other. Below `lg` the cards are wide, every
                tagline is the same height on its own, and a floor would only
                add dead space.
              */}
              <p className="mt-2 text-sm text-muted-foreground lg:min-h-[3.75rem]">
                {tier.tagline}
              </p>
            </div>

            <TierCta
              tier={tier}
              busy={pendingPlan === tier.id}
              purchasable={purchasableFor(tier.id)}
              ownership={ownershipFor(tier.id)}
              signedIn={signedIn}
              onBuy={() => startCheckout(tier.id)}
            />

            {/* The alternative way to buy this same tier. Hidden once the
                tier is owned — by either route, since ownership is a property
                of the tier and not of the SKU that granted it — and hidden
                when the alternative is not configured in Polar, so it never
                renders a button that dead-ends at a 503. */}
            {tier.altPlan &&
              ownershipFor(tier.id) !== 'owned' &&
              purchasableFor(tier.altPlan.id) === true && (
                <div className="-mt-4 mb-6">
                  <button
                    type="button"
                    onClick={() => startCheckout(tier.altPlan!.id)}
                    disabled={pendingPlan === tier.altPlan.id}
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline disabled:opacity-60"
                  >
                    {pendingPlan === tier.altPlan.id
                      ? 'Starting checkout…'
                      : `${tier.altPlan.label} — ${headlineFor(tier.altPlan.id)}`}
                  </button>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {tier.altPlan.note}
                  </p>
                </div>
              )}

            {/*
              Support, appended rather than typed into each tier's array.

              It is a row every competitor in this category sells and this
              page did not have at all, and deriving it from
              `supportFor()` means the pricing page and /support cannot
              state different numbers — the exact drift that made a
              hardcoded effect count understate the catalog by 2.7x above.
            */}
            {/*
              Sits directly under the CTA, not pinned to the bottom of the
              card. This was `mt-auto`, which bottom-aligned every list in a
              row of equal-height cards: Pro has fifteen rows and Studio has
              seven, so Studio's list was pushed to the floor of a card sized
              by Pro's and the buyer read a call to action followed by six
              hundred pixels of nothing. Trailing space below a short list is
              the normal shape of a pricing table; a hole in the middle of one
              is not.
            */}
            <ul className="space-y-2.5">
              {[...tier.features, supportFeature(tier.id)].map((f, j) => {
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

      <EnterpriseBand
        busy={pendingPlan === 'enterprise'}
        purchasable={purchasableFor('enterprise')}
        ownership={ownershipFor('enterprise')}
        signedIn={signedIn}
        headline={headlineFor('enterprise')}
        secondary={
          // The currency not currently selected, as a reference. The ≈
          // marks whichever side is not the real charge — same rule the
          // cards above use, and the same reason.
          ((activeCurrency === 'INR') === chargedInInr('enterprise')
            ? '≈ '
            : '') + secondaryFor('enterprise')
        }
        listHeadline={listHeadlineFor('enterprise')}
        discounted={isDiscounted('enterprise')}
        onBuy={() => startCheckout('enterprise')}
      />

      {/*
        The linkable version of this section.

        Pricing lived only here — a band in the middle of two long pages —
        so there was no URL to paste to a colleague and nothing for "hoverlab
        pricing" to land on. /pricing renders this exact component, so the
        pointer is hidden there rather than sending someone to the page they
        are already reading.
      */}
      {onPricingPage ? null : (
        <Reveal delay={200} className="mt-8 text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-all hover:gap-2 hover:underline"
          >
            Full pricing page — comparison and FAQ
            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        </Reveal>
      )}

      <Reveal delay={240} className="mt-8 text-center">
        <p className="text-xs text-muted-foreground">
          Every plan includes PWA install and{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            prefers-reduced-motion
          </code>{' '}
          support, and the CLI and public API are open to everyone — every
          export format included. Free covers personal and non-commercial
          projects; shipping anything from the catalog in client work or a
          paid product needs Pro, Studio, Enterprise or Team. The{' '}
          <Link href="/licence" className="font-medium text-primary hover:underline">
            licence
          </Link>{' '}
          sets out exactly where that line falls. No credit card required for
          Free.
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
          feature set for every member, priority support, and the shared brand
          library; shared collections, workspace theming and seat management
          ship later this year.
        </p>
        {/*
          What used to be the Pro+ add-on line.

          Credits are inside the licence now, so this no longer sells
          anything — it explains what the number on the card buys, and says
          where to get more without implying anyone needs to. A paragraph
          that ended in a $9/month upsell was the second decision this page
          should never have asked for.
        */}
        <p className="mt-4 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            AI credits are included in the licence
          </span>{' '}
          — {PLANS.pro.includedCredits?.toLocaleString('en-US')} with Pro,{' '}
          {PLANS.studio.includedCredits?.toLocaleString('en-US')} with Studio
          and {PLANS.enterprise.includedCredits?.toLocaleString('en-US')} with
          Enterprise, granted once and never expiring. They buy three things: a variation
          or an edit of any effect (1 credit), a recolour of one onto your
          brand (1), and a whole section composed from a brief in your design
          tokens (3). Browsing, copying, the CLI and the API stay free and
          unmetered, and everyone — including free accounts — gets five
          generations a day without spending any. Run out and you can buy a
          top-up pack; there is no subscription for them.
        </p>

        {/*
          The licence, linked before the buy button rather than after it.

          It is the whole answer to the obvious objection — that the code is
          free to copy, so why pay — and until it had a page, it was a bullet
          point on a card. Nobody's legal team approves a bullet point.
        */}
        <p className="mt-4 text-sm text-muted-foreground">
          Everything here is free to read, copy and modify under the{' '}
          <Link href="/licence" className="font-medium text-primary hover:underline">
            free licence
          </Link>
          . What the paid plans add is the commercial one — permission to
          ship the result in work you are paid for, with a dated certificate
          you can forward. Both are written out in full.
        </p>

        {/* The one thing a buyer could reasonably get wrong about the
            team-shaped plans, said before they pick one. Enterprise is named
            here rather than only in the band above, because the band sells
            it and this is where the distinction it shares with Studio is
            actually drawn. */}
        <p className="mt-2 text-xs text-muted-foreground">
          Studio and Enterprise are licenses, not workspaces: they cover ten
          and fifty people respectively with the full Pro feature set, and
          never renew. The shared brand library and shared collections belong
          to Team.
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
        ) : region && region !== 'default' ? (
          /*
            Every other band. Written without naming a country because the
            region IS a band — a table of forty countries priced individually
            would be forty Polar discounts nobody maintains, so Brazil and
            Türkiye read the same sentence and pay the same price. Saying
            "your location" rather than guessing at a country name also
            avoids telling someone behind a corporate VPN which country we
            think they are in.
          */
          <p className="mt-2 text-xs text-muted-foreground">
            Regional pricing for your location is applied automatically at
            checkout — the prices above already include it. Paid plans are
            charged in USD; rupee amounts are indicative, converted at
            approximately ₹{USD_TO_INR}/$.
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
