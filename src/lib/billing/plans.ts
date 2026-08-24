/**
 * The sellable plan catalog — the single source of truth for what exists,
 * what it costs, and which Polar product backs it.
 *
 * Three products, deliberately different shapes:
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
 *   Pro+  — RECURRING monthly, and deliberately NOT a fifth column on the
 *           pricing grid. It is an add-on: a monthly allowance of AI
 *           credits on top of whatever licence you hold.
 *
 *           This is the answer to the problem the comment below states —
 *           individuals will not subscribe to static assets. They will pay
 *           monthly for something that gets consumed, which is why every
 *           comparable company arrived at credits in the same year (Uiverse
 *           $4.99 for 500k tokens, 21st.dev $15, Envato's tiers priced by
 *           credit count, UI8 selling Persona packs). Credits read as fuel;
 *           a subscription to a catalog reads as rent.
 *
 *           Sold as an add-on rather than a tier because it is one: it
 *           grants no catalog rights Pro does not already grant, and a
 *           five-column pricing table makes the licence decision harder to
 *           serve a product that is really a meter.
 *
 *           Credits started out buying one endpoint, which made $9/month a
 *           subscription to a button. They now buy three actions at
 *           different prices — vary/edit an effect (1), recolour one onto
 *           your brand (1), compose a section from a brief (3) — because a
 *           meter is only worth paying for monthly if it measures
 *           something used weekly. See `ACTION_COSTS` in ./credits.
 *
 *   Studio — ONE-TIME, ten seats. The same license as Pro, bought once for a
 *           whole team. This exists because the comparable market sells
 *           teams a seat-COUNT license rather than a subscription — Preline
 *           $459/15 devs, Tailkit $549/10, Aceternity $1,590/10, Tailwind
 *           Plus for 25 — and a team that priced our $12/seat/month against
 *           buying Pro n times did the arithmetic and bought Pro n times.
 *
 *   Renewal — ONE-TIME, and not a licence at all. It buys another twelve
 *           months of catalog updates on a licence already held. Two of
 *           them, priced off the plan they renew (~40%), because a Studio
 *           holder renewing at the Pro price would be a mispricing bug
 *           rather than a discount.
 *
 *           These have no card on the pricing page and never will. Nobody
 *           shops for a renewal; it is offered on /account to the specific
 *           person whose window is running out, which is the only context
 *           where the word means anything.
 *
 *   Team  — RECURRING per-seat. Companies pay for seats and shared state
 *           (brand tokens, shared collections); individuals don't. This is
 *           where recurring revenue actually comes from. Studio does not
 *           replace it: Studio sells the license, Team sells the shared
 *           workspace, and a Studio buyer who wants shared brand tokens
 *           still upgrades.
 *
 * Prices are declared here for display only — Polar is authoritative at
 * checkout, and the webhook records the amount actually charged. Changing
 * a number here never changes what a customer is billed.
 */

export type PlanId =
  | 'free'
  | 'pro'
  | 'plus'
  | 'studio'
  | 'team'
  | 'renewal'
  | 'renewal-studio'
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
  /** Per-seat pricing (Team) vs a single purchase (Pro, Studio). */
  perSeat: boolean
  /**
   * Months of catalog updates a purchase includes, or null when updates
   * run for as long as the subscription does.
   *
   * A one-time licence previously included "all future updates" forever,
   * which is a promise that gets more expensive every week it is kept: the
   * catalog grows, and every artifact added after a purchase is value
   * delivered to a past buyer against no revenue. Three years of that is
   * how a lifetime deal stops paying for the work that sustains it.
   *
   * Twelve months is what this market does — Preline, Tailwind Plus and
   * Untitled UI all sell a perpetual licence with a bounded update window
   * and a discounted renewal.
   *
   * Read this carefully, because it is narrower than it sounds. What
   * expires is the entitlement to artifacts published AFTER the window,
   * and nothing else. The licence to ship what you already have is
   * perpetual and irrevocable, nothing stops working, and nothing checks
   * this at runtime — see `lib/license.ts`. It is a term, not a lock.
   */
  updateWindowMonths: number | null
  /**
   * Seats a one-time license covers, or null when seats don't apply.
   *
   * Distinct from `perSeat`, which asks whether the customer picks a
   * quantity at checkout. Studio is not per-seat — nobody chooses 7 — but it
   * does cover ten people, and that number has to be somewhere the webhook
   * can read it when it provisions the workspace.
   */
  includedSeats: number | null
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
    // The free licence covers what is in the catalog whenever you look at
    // it. There is no purchase for updates to run from.
    updateWindowMonths: null,
    includedSeats: null,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    // $79 one-time.
    //
    // Was $59, which was under the floor of every comparable product —
    // React Bits' entry tier is $99, Shadcnblocks $149, Aceternity and
    // Magic UI $199, Preline $249, Tailwind Plus and React Bits' top tier
    // $299 — while Hoverlab ships more surface than any of them (the whole
    // effect catalog, blocks, pages, runnable templates, the tools, the CLI
    // and the MCP server). A price that far below the band reads as a
    // cheaper substitute rather than a better product.
    //
    // Deliberately not $99: without a consumable tier to justify it, $79 is
    // still a decision a solo developer makes without a spreadsheet. Revisit
    // when Pro+ credits ship.
    priceCents: 7900,
    // ₹7,500 — the dollar price at roughly ₹95/$, so the rupee ladder tracks
    // the dollar one rather than becoming a second pricing strategy to
    // maintain.
    priceInrPaise: 750000,
    interval: 'one_time',
    polarProductId: process.env.POLAR_PRODUCT_ID_PRO ?? null,
    perSeat: false,
    updateWindowMonths: 12,
    includedSeats: 1,
  },
  plus: {
    id: 'plus',
    name: 'Pro+',
    // $9 per month.
    //
    // Under Team's $12/seat so the two are never confused for each other,
    // and in the band this market has settled on for a credit allowance:
    // Uiverse asks $4.99 for its metered tier and $19.99 for unlimited,
    // 21st.dev $15, Magic Patterns $17. Cheap enough to be an impulse on
    // top of a licence already bought.
    priceCents: 900,
    /** ₹850. */
    priceInrPaise: 85000,
    interval: 'month',
    polarProductId: process.env.POLAR_PRODUCT_ID_PLUS ?? null,
    perSeat: false,
    // A subscription. Credits arrive monthly for as long as it is live;
    // there is no separate update window to run out.
    updateWindowMonths: null,
    includedSeats: 1,
  },
  studio: {
    id: 'studio',
    name: 'Studio',
    // $299 one-time for ten seats — $29.90 a head, against $79 each buying
    // Pro individually. Priced under Preline's $459/15 and Tailkit's
    // $549/10 for the same reason Pro is priced where it is, and far under
    // Aceternity's $1,590/10.
    priceCents: 29900,
    /** ₹28,000. */
    priceInrPaise: 2800000,
    interval: 'one_time',
    polarProductId: process.env.POLAR_PRODUCT_ID_STUDIO ?? null,
    perSeat: false,
    updateWindowMonths: 12,
    includedSeats: 10,
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
    // Updates run with the subscription, which is the point of paying
    // monthly. Nothing to bound.
    updateWindowMonths: null,
    includedSeats: null,
  },
  renewal: {
    id: 'renewal',
    name: 'Pro updates renewal',
    // $32 — roughly 40% of Pro's $79, which is where this market puts a
    // renewal. It has to be well under the licence price or nobody renews
    // and everybody just re-buys at a discount sale; it has to be well
    // above nothing or the update window is theatre.
    priceCents: 3200,
    /** ₹3,000 — 40% of Pro's ₹7,500, tracking the dollar ladder. */
    priceInrPaise: 300000,
    interval: 'one_time',
    polarProductId: process.env.POLAR_PRODUCT_ID_RENEWAL ?? null,
    perSeat: false,
    // Buys another twelve months. The webhook extends from whichever is
    // later — today, or the window still running — so renewing early
    // never costs the customer the time they had left.
    updateWindowMonths: 12,
    // Renews a licence; grants no seats of its own.
    includedSeats: null,
  },
  'renewal-studio': {
    id: 'renewal-studio',
    name: 'Studio updates renewal',
    /** $120 — 40% of Studio's $299, same ratio as the Pro renewal. */
    priceCents: 12000,
    /** ₹11,200 — 40% of Studio's ₹28,000. */
    priceInrPaise: 1120000,
    interval: 'one_time',
    polarProductId: process.env.POLAR_PRODUCT_ID_RENEWAL_STUDIO ?? null,
    perSeat: false,
    updateWindowMonths: 12,
    includedSeats: null,
  },
}

/**
 * The renewal that extends a given licence, or null when the plan has no
 * window to renew.
 *
 * Subscriptions return null: their updates run with the plan, so selling
 * them a renewal would be selling something they already have.
 */
export function renewalFor(plan: PlanId): PlanId | null {
  if (plan === 'pro') return 'renewal'
  if (plan === 'studio') return 'renewal-studio'
  return null
}

/** True when this plan is a renewal rather than a licence. */
export function isRenewal(plan: PlanId): boolean {
  return plan === 'renewal' || plan === 'renewal-studio'
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
 * India: $79 is roughly 20% of a junior Indian developer's monthly take-home
 * — the same burden a ~$1,300 purchase would be to a US developer. The World
 * Bank PPP conversion factor for India sits near ₹23 per international dollar
 * against a ~₹96 market rate, which puts honest parity for Pro at $23-27.
 * Tailwind Plus reaches for the same ratio from the other direction, listing
 * India at roughly a third of its dollar price.
 *
 * Team is discounted too, but expect it to convert poorly regardless: RBI's
 * e-mandate rules make recurring cross-border card charges unreliable from
 * Indian cards, so renewals fail for reasons no price fixes. If Team-for-India
 * matters, sell it as a one-time annual license rather than a subscription.
 */
const REGIONAL: Record<Exclude<Region, 'default'>, Partial<Record<PlanId, RegionalOverride>>> = {
  IN: {
    pro: {
      priceCents: 2500,
      discountId: process.env.POLAR_DISCOUNT_ID_IN_PRO ?? null,
      // ₹2,400 — $25 at the same ~₹95/$ the list price uses.
      priceInrPaise: 240000,
      discountIdInr: process.env.POLAR_DISCOUNT_ID_IN_PRO_INR ?? null,
    },
    plus: {
      priceCents: 300,
      discountId: process.env.POLAR_DISCOUNT_ID_IN_PLUS ?? null,
      /** ₹290 per month. */
      priceInrPaise: 29000,
      discountIdInr: process.env.POLAR_DISCOUNT_ID_IN_PLUS_INR ?? null,
    },
    studio: {
      priceCents: 9900,
      discountId: process.env.POLAR_DISCOUNT_ID_IN_STUDIO ?? null,
      /** ₹9,500 — $99 at the same ~₹95/$ the list price uses. */
      priceInrPaise: 950000,
      discountIdInr: process.env.POLAR_DISCOUNT_ID_IN_STUDIO_INR ?? null,
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
  return value === 'free' ||
    value === 'pro' ||
    value === 'plus' ||
    value === 'studio' ||
    value === 'team' ||
    value === 'renewal' ||
    value === 'renewal-studio'
    ? value
    : null
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
