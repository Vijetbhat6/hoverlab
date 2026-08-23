/**
 * The sellable plan catalog — the single source of truth for what exists,
 * what it costs, and which Polar product backs it.
 *
 * Two products, deliberately different shapes:
 *
 *   Pro   — ONE-TIME license. Individual developers don't subscribe to CSS
 *           snippets they can get free elsewhere; they do pay once for a
 *           pre-cleared commercial license and an unlimited synced bundle.
 *           This is how Tailwind Plus and Magic UI Pro sell.
 *
 *           That list used to be five items long — it also claimed every
 *           export format, brand presets and private collections. Two of
 *           those are free by design and the third does not exist, so they
 *           were removed from every surface rather than left as a pitch the
 *           code contradicts. The licence at /licence is what Pro sells.
 *
 *           Note what is NOT on that list: the catalog itself and the CLI.
 *           Every artifact is readable and copyable for free, and `/api/v1`
 *           is public and unauthenticated by design (see `lib/api/public.ts`)
 *           so `npx hoverlab add` works without an account. Pro is sold on
 *           features and on the licence to ship, not on access — this comment
 *           previously said Pro bought "the CLI", which was never true and is
 *           the kind of claim the pricing page would have inherited.
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
  /**
   * Display price in paise, for checkouts presented in rupees.
   *
   * A real second price, not a conversion: Polar does not convert between
   * currencies, so a product sold in rupees carries an INR price of its own
   * and this must equal it. Keep in step with the `prices` block in
   * scripts/provision-polar.mts, which is what writes it to Polar.
   */
  priceInrPaise: number
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
    priceInrPaise: 0,
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
    // ₹5,600 — the dollar price at roughly ₹95/$, so the rupee ladder tracks
    // the dollar one rather than becoming a second pricing strategy to
    // maintain.
    priceInrPaise: 560000,
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
    /** ₹1,150 per seat / month. */
    priceInrPaise: 115000,
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
  /** Price after the regional discount, in paise, for rupee checkouts. */
  priceInrPaise: number
  /**
   * Polar discount id that produces `priceInrPaise` at a rupee checkout.
   *
   * A separate id, not an oversight: Polar scopes a fixed discount to the
   * currency it is denominated in, and offering the dollar one on a rupee
   * checkout fails with "Discount does not exist". Two exact discounts also
   * beat one shared percentage, which would round ₹5,600 down to something
   * like ₹1,803.20 instead of a round ₹1,800.
   */
  discountIdInr: string | null
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
      // ₹1,800 — $19 at the same ~₹95/$ the list price uses.
      priceInrPaise: 180000,
      discountIdInr: process.env.POLAR_DISCOUNT_ID_IN_PRO_INR ?? null,
    },
    team: {
      priceCents: 500,
      discountId: process.env.POLAR_DISCOUNT_ID_IN_TEAM ?? null,
      /** ₹475 per seat / month. */
      priceInrPaise: 47500,
      discountIdInr: process.env.POLAR_DISCOUNT_ID_IN_TEAM_INR ?? null,
    },
  },
}

/**
 * Currency the Polar checkout is presented — and charged — in, per region.
 *
 * This is NOT the display toggle on the pricing page. Presentment currency
 * is what the customer's card is actually billed in, so it follows the
 * region (an edge geolocation header) and never a client preference: an NRI
 * reading rupee figures on a US card should still be charged in dollars,
 * where their card has no foreign-currency markup.
 *
 * India gets rupees because dollar checkouts are a real drop-off point
 * there — the card issuer adds a cross-border fee on top, some cards refuse
 * foreign-currency charges outright, and a rupee total is simply the number
 * the buyer can sanity-check against their own budget.
 *
 * Polar converts at its own rate at the moment of payment, which is why
 * every rupee figure we render stays labelled approximate: ours comes from
 * the pinned USD_TO_INR below and will not match to the rupee.
 *
 * null means "present in the product's own currency" (USD) — the behavior
 * for every other region, unchanged.
 */
export type PresentmentCurrency = 'inr'

const REGION_PRESENTMENT: Record<
  Exclude<Region, 'default'>,
  PresentmentCurrency
> = {
  IN: 'inr',
}

function overrideFor(planId: PlanId, region: Region): RegionalOverride | null {
  if (region === 'default') return null
  return REGIONAL[region][planId] ?? null
}

/**
 * Currency this plan's checkout is presented and charged in for a region.
 *
 * Conditional on the regional INR discount being configured, for the same
 * reason `priceForRegion` is: without it Polar has no way to reach the rupee
 * price we advertise. Presenting ₹5,600 with no ₹3,800 discount to apply
 * would charge full list to precisely the buyers the regional price exists
 * for — the one failure mode here that takes real money under false
 * pretenses.
 *
 * A product with no INR price at all is caught one layer further out: the
 * checkout route retries in USD when Polar rejects the currency.
 */
export function presentmentCurrencyFor(
  planId: PlanId,
  region: Region,
): PresentmentCurrency | null {
  if (region === 'default') return null
  const override = overrideFor(planId, region)
  return override?.discountIdInr ? REGION_PRESENTMENT[region] : null
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

/**
 * Rupee display price for a plan in a region, in paise.
 *
 * Same guard as `priceForRegion`, against the INR discount.
 */
export function priceInrForRegion(planId: PlanId, region: Region): number {
  const override = overrideFor(planId, region)
  return override?.discountIdInr
    ? override.priceInrPaise
    : PLANS[planId].priceInrPaise
}

/**
 * Polar discount to apply at checkout, or null to charge list price.
 *
 * Takes the presentment currency because a fixed Polar discount belongs to
 * one currency: passing the dollar discount to a rupee checkout is rejected
 * outright ("Discount does not exist"), which would have failed the sale for
 * every Indian buyer.
 */
export function discountForRegion(
  planId: PlanId,
  region: Region,
  currency: PresentmentCurrency | null = null,
): string | null {
  const override = overrideFor(planId, region)
  if (!override) return null
  return currency === 'inr' ? override.discountIdInr : override.discountId
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
 * Used ONLY where no real rupee price exists — that is, outside India, where
 * the checkout is presented in dollars and the customer's card network sets
 * the conversion. India is charged an actual INR price (`priceInrPaise`),
 * which is exact and must never be rendered through this constant. It exists
 * so the large share of this audience that thinks in rupees can size a dollar
 * price without leaving the page for a converter.
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
 * An actual rupee price, e.g. 560000 → "₹5,600".
 *
 * Distinct from `formatPriceInr` on purpose. That one converts a dollar
 * figure and rounds to the nearest ₹10 so it cannot be mistaken for a real
 * price; this one IS the price the card is charged, so it is exact. Paise
 * are shown only when non-zero — every price we set is in whole rupees, and
 * a trailing ".00" on a rupee price reads like a foreign import.
 */
export function formatPricePaise(paise: number): string {
  const rupees = paise / 100
  return `₹${(Number.isInteger(rupees) ? rupees : Number(rupees.toFixed(2))).toLocaleString('en-IN')}`
}

/**
 * True when a plan is fully configured and can actually be checked out.
 * The pricing UI uses this to avoid offering a buy button that would dead-end
 * at a 500 because POLAR_PRODUCT_ID_* wasn't set in the environment.
 */
export function isPurchasable(plan: Plan): boolean {
  return plan.polarProductId !== null
}
