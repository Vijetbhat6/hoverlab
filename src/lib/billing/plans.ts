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
  | 'team-annual'
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
  /**
   * Team, bought outright for a year instead of billed monthly.
   *
   * Same product as `team` — shared brand tokens, shared collections,
   * workspace theming, seat management — sold as a one-time per-seat charge
   * covering twelve months.
   *
   * It exists because of the payment rail, not the price. RBI's e-mandate
   * rules make recurring cross-border card charges unreliable from Indian
   * cards, and Brazilian domestic cards frequently decline international
   * recurring charges outright. India is the single largest source of
   * traffic in this category and Brazil is in the top five, so `team` is a
   * plan our two biggest non-US audiences cannot reliably hold: the first
   * charge succeeds, the renewal fails, and the workspace dies for a reason
   * no discount fixes. A one-time charge has no renewal to fail.
   *
   * $120 per seat against $144 for twelve months of `team` — ten months'
   * price for twelve months' term, which is the ordinary annual-vs-monthly
   * discount and also compensation for paying up front.
   *
   * Sold everywhere rather than gated to the affected regions. Gating would
   * mean a plan that appears and disappears by IP, and US buyers with
   * procurement that prefers one invoice a year want the same thing for
   * unrelated reasons.
   */
  'team-annual': {
    id: 'team-annual',
    name: 'Team, annual',
    /** $120 per seat, once, covering twelve months. */
    priceCents: 12000,
    /** ₹4,750 per seat, once — ten times band A's monthly seat price. */
    priceInrPaise: 475000,
    // The whole point of the plan. Polar creates an order rather than a
    // subscription, so nothing is ever re-presented to the card.
    interval: 'one_time',
    polarProductId: process.env.POLAR_PRODUCT_ID_TEAM_ANNUAL ?? null,
    // Per-seat like `team`: the buyer picks a quantity at checkout, and it
    // reaches Polar as `seats` on the checkout and comes back as the order
    // quantity on the webhook.
    perSeat: true,
    // Twelve months, and here the window bounds the WORKSPACE and not just
    // the update entitlement — unlike Pro and Studio, which are perpetual
    // licences with a bounded update window. That is why the webhook writes
    // a `term` status with a real `currentPeriodEnd` instead of `lifetime`.
    updateWindowMonths: 12,
    // Seats are chosen, not included. Same as `team`.
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
  // 'team-annual' deliberately has no renewal SKU. Pro and Studio are
  // perpetual licences where a renewal buys back only the update window, so
  // it is worth ~40% of the licence. An annual term is not that: when it
  // lapses the workspace stops, and the thing that restarts it is the term
  // again at the term price. A discounted 'renewal-team' would be a second
  // product that resolves to the same entitlement as re-buying this one.
  return null
}

/** True when this plan is a renewal rather than a licence. */
export function isRenewal(plan: PlanId): boolean {
  return plan === 'renewal' || plan === 'renewal-studio'
}

/**
 * Pricing regions.
 *
 * 'default' is the USD list price. Every other region is a DISCOUNT off that
 * list price, never a separate product — Polar settles in USD and a second
 * product would mean a second set of ids, webhooks and entitlement paths to
 * keep in sync for no gain.
 *
 * A region is a PURCHASING-POWER BAND, not a country. Three bands cover the
 * places this catalog's traffic actually comes from, and a fourth region
 * exists only because India is also charged in rupees:
 *
 *   IN     band A depth, presented and charged in INR
 *   ppp-a  band A depth, charged in USD
 *   ppp-b  band B depth, charged in USD
 *   ppp-c  band C depth, charged in USD
 *
 * Bands rather than per-country prices because the alternative does not
 * survive contact with Polar: every distinct price is a fixed discount that
 * has to be created in the dashboard and pasted back here as an id, so forty
 * countries would be two hundred and forty ids and forty chances to
 * advertise a number that nothing charges. Three bands are twenty-four.
 *
 * India keeps a region of its own rather than folding into `ppp-a` because
 * the rupee checkout is not a price, it is a currency: a fixed Polar
 * discount belongs to the currency it is denominated in, so India needs a
 * second discount id per plan that no dollar-charged country has any use
 * for. Its dollar figures still come from band A below, so the two cannot
 * drift apart.
 */
export type Region = 'default' | 'IN' | 'ppp-a' | 'ppp-b' | 'ppp-c'

/** The purchasing-power bands, before India's currency is layered on. */
export type Band = 'a' | 'b' | 'c'

interface RegionalOverride {
  /** Price after the regional discount, in cents. Display only. */
  priceCents: number
  /** Polar discount id that actually produces `priceCents` at checkout. */
  discountId: string | null
  /**
   * Price after the regional discount, in paise, for rupee checkouts.
   *
   * Only India has one. Everywhere else is charged in dollars, so there is
   * no rupee price to advertise and no rupee discount to reach it with —
   * `null` here and `presentmentCurrencyFor` returning null are the same
   * fact said twice, once for display and once for checkout.
   */
  priceInrPaise: number | null
  /**
   * Polar discount id that produces `priceInrPaise` at a rupee checkout.
   *
   * A separate id, not an oversight: Polar scopes a fixed discount to the
   * currency it is denominated in, and offering the dollar one on a rupee
   * checkout fails with "Discount does not exist". Two exact discounts also
   * beat one shared percentage, which would round ₹7,500 down to something
   * like ₹2,412.75 instead of a round ₹2,400.
   */
  discountIdInr: string | null
}

/**
 * What each band charges, in cents, per plan.
 *
 * Band A is roughly 68% off list, B is 50%, C is 30%. The depths are not
 * arrived at from a PPP table alone — a strict World Bank conversion factor
 * would put India nearer 25% of list, which is below the price at which this
 * reads as a product rather than a leak. They are the shallowest discount at
 * which the price stops being the reason someone does not buy.
 *
 * Band A: $79 is roughly 20% of a junior Indian developer's monthly
 * take-home — the same burden a ~$1,300 purchase would be to a US developer.
 * $25 is the ~$400 equivalent, which is a considered purchase rather than an
 * impossible one. Tailwind Plus reaches for the same ratio from the other
 * direction, listing India at roughly a third of its dollar price.
 *
 * Band B: Brazil, Mexico, Türkiye and South Africa sit near half of US
 * software purchasing power, and each has a developer population large
 * enough that the discount is worth the dashboard work.
 *
 * Band C: Europe's and Asia's lower-cost markets. Thirty percent is small
 * enough to be a nudge rather than an arbitrage target — the gap between $55
 * and $79 is not worth a VPN to anyone, which is the point.
 *
 * Renewals are banded too. Someone who bought Pro at $25 being asked $32 to
 * keep receiving updates is a price rise wearing a renewal's clothes, and it
 * is what this table did before it had bands.
 */
export const BAND_CENTS: Record<Band, Partial<Record<PlanId, number>>> = {
  a: {
    pro: 2500,
    plus: 300,
    studio: 9900,
    team: 500,
    'team-annual': 5000,
    renewal: 1000,
    'renewal-studio': 3900,
  },
  b: {
    pro: 3900,
    plus: 500,
    studio: 14900,
    team: 700,
    'team-annual': 7000,
    renewal: 1600,
    'renewal-studio': 5900,
  },
  c: {
    pro: 5500,
    plus: 700,
    studio: 20900,
    team: 900,
    'team-annual': 9000,
    renewal: 2200,
    'renewal-studio': 8400,
  },
}

/**
 * India's rupee prices, in paise.
 *
 * A real second price, not a conversion of band A: Polar does not convert
 * between currencies, so the rupee figure is what the card is charged and
 * has to be a round number in its own right. These track band A at roughly
 * ₹95/$ so the two ladders stay recognisably the same offer.
 */
export const IN_PAISE: Partial<Record<PlanId, number>> = {
  pro: 240000,
  plus: 29000,
  studio: 950000,
  team: 47500,
  'team-annual': 475000,
  renewal: 95000,
  'renewal-studio': 370000,
}

/**
 * Build a region's overrides from a band and an env-var infix.
 *
 * The infix is what appears in POLAR_DISCOUNT_ID_<INFIX>_<PLAN>, so adding a
 * band is one call here plus the ids `scripts/provision-polar.mts` prints.
 *
 * Ids are read from `process.env` at module load rather than inside the
 * accessors. One read makes a missing id a boot-time fact instead of a
 * per-request one, and nothing here can pick up a variable that arrives
 * after the process starts either way.
 */
function bandOverrides(
  band: Band,
  infix: string,
  paise: Partial<Record<PlanId, number>> = {},
): Partial<Record<PlanId, RegionalOverride>> {
  const out: Partial<Record<PlanId, RegionalOverride>> = {}
  for (const [plan, cents] of Object.entries(BAND_CENTS[band]) as [PlanId, number][]) {
    const key = plan.toUpperCase().replace('-', '_')
    out[plan] = {
      priceCents: cents,
      discountId: process.env[`POLAR_DISCOUNT_ID_${infix}_${key}`] ?? null,
      priceInrPaise: paise[plan] ?? null,
      discountIdInr: process.env[`POLAR_DISCOUNT_ID_${infix}_${key}_INR`] ?? null,
    }
  }
  return out
}

/**
 * Region-specific pricing.
 *
 * Team is discounted in every band, but expect India to convert poorly
 * regardless: RBI's e-mandate rules make recurring cross-border card charges
 * unreliable from Indian cards, so renewals fail for reasons no price fixes.
 * Brazil has a milder version of the same problem — domestic cards often
 * decline international recurring charges — which is part of why the
 * one-time tiers are the ones worth discounting hardest.
 *
 * That is what 'team-annual' is for, and it is banded here alongside the
 * monthly plan so the two are the same offer in every region. Where the
 * recurring rail is unreliable the annual term is the one to lead with.
 */
const REGIONAL: Record<Exclude<Region, 'default'>, Partial<Record<PlanId, RegionalOverride>>> = {
  IN: bandOverrides('a', 'IN', IN_PAISE),
  'ppp-a': bandOverrides('a', 'PPP_A'),
  'ppp-b': bandOverrides('b', 'PPP_B'),
  'ppp-c': bandOverrides('c', 'PPP_C'),
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
 * The other bands do not, and that is a decision rather than an omission.
 * Each additional presentment currency is a second price on every product
 * plus a second discount id on every plan in that band, and it only pays for
 * itself where card-level friction is costing sales. India is the one place
 * in this table where that is demonstrably true. Adding BRL later is a row
 * here, a map shaped like `IN_PAISE`, and the ids the provisioning script
 * prints.
 *
 * Polar converts at its own rate at the moment of payment, which is why
 * every rupee figure we render stays labelled approximate: ours comes from
 * the pinned USD_TO_INR below and will not match to the rupee.
 *
 * null means "present in the product's own currency" (USD).
 */
export type PresentmentCurrency = 'inr'

const REGION_PRESENTMENT: Record<
  Exclude<Region, 'default'>,
  PresentmentCurrency | null
> = {
  IN: 'inr',
  'ppp-a': null,
  'ppp-b': null,
  'ppp-c': null,
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
  // Most regions are charged in dollars, so there is nothing to present in
  // and no discount to look for. Checked first because the alternative reads
  // as "no INR discount configured" — the same null for a different reason,
  // and the reason is what tells a deploy whether something is missing.
  if (!REGION_PRESENTMENT[region]) return null
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
  return override?.discountIdInr && override.priceInrPaise !== null
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
    value === 'team-annual' ||
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
