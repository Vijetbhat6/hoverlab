/**
 * The sellable plan catalog — the single source of truth for what exists,
 * what it costs, and which Polar product backs it.
 *
 * Two products, deliberately different shapes:
 *
 *   Pro   — ONE-TIME license. Individual developers don't subscribe to CSS
 *           snippets they can get free elsewhere; they do pay once to own
 *           the full source, the CLI, and a pre-cleared commercial license.
 *           This is how Tailwind Plus and Magic UI Pro sell.
 *
 *   Team  — RECURRING per-seat. Companies pay for seats and shared state
 *           (brand tokens, shared collections); individuals don't. This is
 *           where recurring revenue actually comes from.
 *
 * Prices are declared here for display only — Polar is authoritative at
 * checkout, and the webhook records the amount actually charged. Changing
 * a number here never changes what a customer is billed.
 */

export type PlanId = 'free' | 'pro' | 'team'
export type BillingInterval = 'one_time' | 'month'

export interface Plan {
  id: PlanId
  name: string
  /** Display price in cents. Polar remains the source of truth at checkout. */
  priceCents: number
  interval: BillingInterval
  /** Polar product id, from the dashboard. Null for the free plan. */
  polarProductId: string | null
  /** Per-seat pricing (Team) vs a single purchase (Pro). */
  perSeat: boolean
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    priceCents: 0,
    interval: 'one_time',
    polarProductId: null,
    perSeat: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    // $59 one-time. Sits in the band this market has shown it pays
    // outright (Tailwind Plus $299, Magic UI Pro lifetime tiers), while
    // staying an easy solo-developer decision.
    priceCents: 5900,
    interval: 'one_time',
    polarProductId: process.env.POLAR_PRODUCT_ID_PRO ?? null,
    perSeat: false,
  },
  team: {
    id: 'team',
    name: 'Team',
    // $12 per seat / month.
    //
    // Was $24, which made the plan unsellable against our own Pro tier: a
    // 3-person team paid $864/year for Team versus $177 once for three Pro
    // licenses — ~15x over two years, for shared tokens and seat management.
    // Anyone who did that arithmetic bought Pro three times. At $12 a 5-seat
    // team pays ~$720/year against $295 of Pro licenses, a gap the shared
    // workspace can actually justify.
    priceCents: 1200,
    interval: 'month',
    polarProductId: process.env.POLAR_PRODUCT_ID_TEAM ?? null,
    perSeat: true,
  },
}

/**
 * Pricing regions.
 *
 * 'default' is the USD list price. Additional regions are a DISCOUNT off
 * that list price, never a separate product — Polar settles in USD and a
 * second product would mean a second set of ids, webhooks and entitlement
 * paths to keep in sync for no gain.
 */
export type Region = 'default' | 'IN'

interface RegionalOverride {
  /** Price after the regional discount, in cents. Display only. */
  priceCents: number
  /** Polar discount id that actually produces `priceCents` at checkout. */
  discountId: string | null
}

/**
 * Region-specific pricing.
 *
 * India: $59 is roughly 15% of a junior Indian developer's monthly take-home
 * — the same burden a ~$1,000 purchase would be to a US developer. The World
 * Bank PPP conversion factor for India sits near ₹23 per international dollar
 * against a ~₹96 market rate, which puts honest parity for Pro at $17-20.
 *
 * Team is discounted too, but expect it to convert poorly regardless: RBI's
 * e-mandate rules make recurring cross-border card charges unreliable from
 * Indian cards, so renewals fail for reasons no price fixes. If Team-for-India
 * matters, sell it as a one-time annual license rather than a subscription.
 */
const REGIONAL: Record<Exclude<Region, 'default'>, Partial<Record<PlanId, RegionalOverride>>> = {
  IN: {
    pro: {
      priceCents: 1900,
      discountId: process.env.POLAR_DISCOUNT_ID_IN_PRO ?? null,
    },
    team: {
      priceCents: 500,
      discountId: process.env.POLAR_DISCOUNT_ID_IN_TEAM ?? null,
    },
  },
}

function overrideFor(planId: PlanId, region: Region): RegionalOverride | null {
  if (region === 'default') return null
  return REGIONAL[region][planId] ?? null
}

/**
 * Display price for a plan in a region.
 *
 * Falls back to list price when the discount that would deliver the regional
 * price is not configured. Without that guard a missing POLAR_DISCOUNT_ID_*
 * would advertise $19 and charge $59 — the one failure mode here that takes
 * real money under false pretenses.
 */
export function priceForRegion(planId: PlanId, region: Region): number {
  const override = overrideFor(planId, region)
  return override?.discountId ? override.priceCents : PLANS[planId].priceCents
}

/** Polar discount to apply at checkout, or null to charge list price. */
export function discountForRegion(planId: PlanId, region: Region): string | null {
  return overrideFor(planId, region)?.discountId ?? null
}

/** Narrow an arbitrary string to a known plan id. */
export function parsePlanId(value: unknown): PlanId | null {
  return value === 'free' || value === 'pro' || value === 'team' ? value : null
}

/** Format cents for display, e.g. 5900 → "$59". */
export function formatPrice(cents: number): string {
  const dollars = cents / 100
  return `$${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)}`
}

/**
 * USD → INR reference rate, for DISPLAY ONLY.
 *
 * Polar is the merchant of record and charges in USD. This number never
 * reaches a charge — the amount actually billed is whatever the customer's
 * card network converts at on the day. It exists so the large share of this
 * audience that thinks in rupees can size the price without leaving the page
 * for a converter.
 *
 * Pinned rather than fetched live, deliberately: a live rate would put a
 * network call and a failure mode on the landing page's critical path, and
 * make the headline price shift between visits — all to move a figure that
 * is labelled an approximation anyway. Set a little above spot (~95.3 on
 * 2026-08-03) so it errs high rather than implying a price we can't honor.
 *
 * Revisit when spot drifts more than ~5% from this, i.e. outside ~91–101.
 */
export const USD_TO_INR = 96

/**
 * Approximate INR equivalent, e.g. 5900 → "₹5,660".
 *
 * Rounded to the nearest ₹10: precision beyond that is noise on a converted
 * figure, and an exact "₹5,664" reads like a price we would actually charge.
 * Grouping is en-IN, so separators land where this audience expects them
 * (₹1,00,000 rather than ₹100,000).
 */
export function formatPriceInr(cents: number): string {
  const rupees = Math.round(((cents / 100) * USD_TO_INR) / 10) * 10
  return `₹${rupees.toLocaleString('en-IN')}`
}

/**
 * True when a plan is fully configured and can actually be checked out.
 * The pricing UI uses this to avoid offering a buy button that would dead-end
 * at a 500 because POLAR_PRODUCT_ID_* wasn't set in the environment.
 */
export function isPurchasable(plan: Plan): boolean {
  return plan.polarProductId !== null
}
