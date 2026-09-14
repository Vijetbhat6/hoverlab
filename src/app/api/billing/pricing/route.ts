import { NextResponse } from 'next/server'
import {
  PLANS,
  isPurchasable,
  priceForRegion,
  priceInrForRegion,
  presentmentCurrencyFor,
  type PlanId,
} from '@/lib/billing/plans'
import { countryFromHeaders, regionFromHeaders } from '@/lib/billing/region'
import { publicOfferFor } from '@/lib/billing/codes'
import { billingEnabled } from '@/lib/billing/polar'

/**
 * Prices and buyability for the visitor's region.
 *
 * GET → { region, country, offer, plans: { pro: { priceCents, priceInrPaise,
 *         chargedInInr, purchasable }, studio: {…}, team: {…} } }
 *
 * This exists because the pricing UI is a client component and needs three
 * things the browser cannot work out for itself:
 *
 *  1. The region. It comes from an edge geolocation header on the request.
 *
 *  2. Whether a plan can actually be bought. `isPurchasable()` tests
 *     `polarProductId`, which is read from POLAR_PRODUCT_ID_* — server-only
 *     env vars that are NOT inlined into the client bundle. Called in the
 *     browser it always returned false, so every tier rendered the waitlist
 *     CTA and the buy button was unreachable however Polar was configured.
 *
 *  3. Whether the charge itself will be in rupees. India is presented a real
 *     INR price rather than a conversion of the dollar one — but only once
 *     the rupee discount exists, so "is this figure exact or an estimate" is
 *     a server-side fact, and the wording on the page has to follow it.
 *
 *  4. Whether there is anything to say about the visitor's region before
 *     they get to checkout, and in which of the two mutually exclusive
 *     shapes — a price applied automatically, or a coupon to type. That is
 *     `offer`, and it reads server-only env vars for the same reason as (2):
 *     a code inlined at build time would ship band A's 68% to every bundle.
 *     See `lib/billing/codes.ts`.
 *
 * Response is per-visitor (it varies by IP country), so it must never be
 * cached by a shared cache.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 'team-annual' is here rather than only in the plan catalog because the
// pricing page reads its regional price and purchasability from this
// response — a plan absent from this list renders no price and no live buy
// button, however completely it is configured everywhere else.
const PAID_PLANS: PlanId[] = ['pro', 'studio', 'enterprise', 'team', 'team-annual']

export async function GET(request: Request) {
  const region = regionFromHeaders(request.headers)
  const country = countryFromHeaders(request.headers)

  // A configured product id is not on its own enough to sell. /api/billing/
  // checkout refuses with a 503 unless billingEnabled() — which also requires
  // POLAR_WEBHOOK_SECRET, since without it a payment would succeed at Polar
  // and never grant anything here. Both conditions have to agree, or the
  // pricing page offers a buy button that dead-ends.
  const configured = billingEnabled()

  return NextResponse.json(
    {
      region,
      // The country the region was derived from, for the banner's flag and
      // for naming the place in its sentence. Presentational only: `region`
      // above is what every price on this response was computed from, and
      // nothing downstream may price off this field — twenty-one countries
      // share 'ppp-a' and none of them is the band.
      country,
      // null on a deployment with no regional discount configured, and null
      // for every visitor outside the priced countries. The banner renders
      // nothing for null rather than inventing a fallback offer.
      offer: publicOfferFor(region),
      plans: Object.fromEntries(
        PAID_PLANS.map((id) => [
          id,
          {
            priceCents: priceForRegion(id, region),
            priceInrPaise: priceInrForRegion(id, region),
            // True when this plan's checkout will be presented and charged in
            // rupees, making priceInrPaise the exact amount rather than a
            // conversion of priceCents.
            chargedInInr: presentmentCurrencyFor(id, region) === 'inr',
            purchasable: configured && isPurchasable(PLANS[id]),
          },
        ]),
      ),
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
