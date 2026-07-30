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
    // $24 per seat / month.
    priceCents: 2400,
    interval: 'month',
    polarProductId: process.env.POLAR_PRODUCT_ID_TEAM ?? null,
    perSeat: true,
  },
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
 * True when a plan is fully configured and can actually be checked out.
 * The pricing UI uses this to avoid offering a buy button that would dead-end
 * at a 500 because POLAR_PRODUCT_ID_* wasn't set in the environment.
 */
export function isPurchasable(plan: Plan): boolean {
  return plan.polarProductId !== null
}
