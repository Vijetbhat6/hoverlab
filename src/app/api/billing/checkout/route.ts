import { NextResponse } from 'next/server'
import { getPolar, billingEnabled } from '@/lib/billing/polar'
import {
  PLANS,
  parsePlanId,
  isPurchasable,
  discountForRegion,
} from '@/lib/billing/plans'
import { regionFromHeaders } from '@/lib/billing/region'
import { getCurrentUser } from '@/lib/session'
import { absoluteUrl } from '@/lib/site'

/**
 * Create a Polar checkout session and return its hosted URL.
 *
 * POST { plan: 'pro' | 'team', seats?: number } → { url }
 *
 * Requires a signed-in user: the webhook needs a local user to attach the
 * resulting entitlement to, and `externalCustomerId` is what lets it find
 * them reliably even if they pay with a different email than they signed
 * up with.
 *
 * This route never grants anything. It only starts a checkout — the
 * entitlement is written by /api/billing/webhook after Polar confirms
 * payment. A client that fakes a success redirect gets nothing.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!billingEnabled()) {
    return NextResponse.json(
      { error: 'Billing is not configured on this deployment.' },
      { status: 503 },
    )
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: 'You must be signed in to check out.' },
      { status: 401 },
    )
  }

  let body: { plan?: unknown; seats?: unknown }
  try {
    body = (await request.json()) as { plan?: unknown; seats?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const planId = parsePlanId(body.plan)
  if (!planId || planId === 'free') {
    return NextResponse.json(
      { error: 'plan must be "pro" or "team"' },
      { status: 400 },
    )
  }

  const plan = PLANS[planId]
  if (!isPurchasable(plan)) {
    return NextResponse.json(
      { error: `The ${plan.name} plan is not available yet.` },
      { status: 503 },
    )
  }

  // Seats only apply to the per-seat Team plan. Clamp to a sane range so a
  // crafted request can't create a 10,000-seat checkout.
  const seats = plan.perSeat
    ? Math.min(Math.max(Number(body.seats) || 1, 1), 500)
    : 1

  // Region comes from the edge geolocation header on THIS request, never
  // from the client. The pricing UI reads the same header via
  // /api/billing/pricing, but what it displays has no bearing on what is
  // charged — the discount is decided here, server-side.
  const region = regionFromHeaders(request.headers)
  const discountId = discountForRegion(planId, region)

  try {
    const checkout = await getPolar().checkouts.create({
      products: [plan.polarProductId as string],
      customerEmail: user.email,
      // Our own user id, echoed back on every webhook for this customer.
      externalCustomerId: user.id,
      successUrl: absoluteUrl('/account?checkout=success'),
      // Seat count has to reach Polar here. It used to live only in
      // metadata, so the subscription was created with Polar's default
      // quantity and the webhook — which reads `data.quantity` — provisioned
      // one seat no matter how many were bought and paid for.
      ...(plan.perSeat ? { seats } : {}),
      ...(discountId ? { discountId } : {}),
      // A regional price is already a large discount; stacking a public
      // coupon on top of it is not intended.
      allowDiscountCodes: !discountId,
      metadata: {
        userId: user.id,
        plan: plan.id,
        interval: plan.interval,
        seats: String(seats),
        region,
      },
    })

    return NextResponse.json({ url: checkout.url })
  } catch (err) {
    console.error('[billing/checkout] Polar checkout creation failed:', err)
    return NextResponse.json(
      { error: 'Could not start checkout. Please try again.' },
      { status: 502 },
    )
  }
}
