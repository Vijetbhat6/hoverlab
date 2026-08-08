import type { Region } from './plans'

/**
 * Visitor → pricing region.
 *
 * The country comes from the edge proxy's IP geolocation header, which is
 * set before the request reaches us and cannot be spoofed by the client the
 * way a cookie or query parameter could. `x-vercel-ip-country` is what
 * Vercel sets; `cf-ipcountry` covers a Cloudflare front if one is ever put
 * in place.
 *
 * Locally neither header exists, so everything resolves to 'default' — list
 * price. To exercise the India path in dev, send the header by hand:
 *   curl -H 'x-vercel-ip-country: IN' localhost:3002/api/billing/pricing
 *
 * VPN arbitrage is deliberately not defended against. Enforcing a match
 * between IP country and billing country blocks more legitimate buyers
 * (Indians paying with a foreign card, NRIs, anyone behind a corporate VPN)
 * than it stops arbitrage, and at these amounts the arbitrage is not worth
 * engineering against.
 */
export function regionFromCountry(country: string | null | undefined): Region {
  return country?.trim().toUpperCase() === 'IN' ? 'IN' : 'default'
}

/** Pricing region for an incoming request. */
export function regionFromHeaders(headers: Headers): Region {
  /*
    Dev-only override. No edge proxy runs locally, so every request resolves
    to 'default' and the India path — regional discount and a rupee checkout
    — cannot be exercised end to end without hand-crafting a header, which
    is impossible for a checkout the browser initiates.

    Guarded on NODE_ENV rather than on the variable alone: a production
    deployment must not be able to set its way into handing every visitor
    the regional discount.
  */
  if (process.env.NODE_ENV !== 'production' && process.env.DEV_PRICING_REGION) {
    return regionFromCountry(process.env.DEV_PRICING_REGION)
  }

  return regionFromCountry(
    headers.get('x-vercel-ip-country') ?? headers.get('cf-ipcountry'),
  )
}
