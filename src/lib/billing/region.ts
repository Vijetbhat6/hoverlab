import type { Region } from './plans'

/**
 * Country → pricing band.
 *
 * The list is short on purpose. A country earns a row here when it clears
 * two bars at once: enough of this category's traffic that the discount is
 * worth twenty-four dashboard-created Polar discounts, and enough of a gap
 * between local and US software purchasing power that list price is what
 * stops the sale rather than the product. Somewhere with the first and not
 * the second gets list price, which is the correct answer for it.
 *
 * Band A is the deepest (~68% off). India is not in this map because it has
 * a region of its own — same depth, charged in rupees. See `plans.ts`.
 *
 * The ordering inside each band is by this category's traffic share, so the
 * first few entries are the ones the decision was actually made for and the
 * tail is the ones that come along for free once the band exists.
 */
const COUNTRY_BAND: Record<string, Exclude<Region, 'default' | 'IN'>> = {
  // Band A — South Asia, Southeast Asia, Africa, and the parts of Latin
  // America where per-capita income sits closest to India's.
  PK: 'ppp-a',
  BD: 'ppp-a',
  NG: 'ppp-a',
  EG: 'ppp-a',
  VN: 'ppp-a',
  ID: 'ppp-a',
  PH: 'ppp-a',
  LK: 'ppp-a',
  NP: 'ppp-a',
  KE: 'ppp-a',
  GH: 'ppp-a',
  TZ: 'ppp-a',
  UG: 'ppp-a',
  ET: 'ppp-a',
  MM: 'ppp-a',
  KH: 'ppp-a',
  UZ: 'ppp-a',
  BO: 'ppp-a',
  HN: 'ppp-a',
  NI: 'ppp-a',
  VE: 'ppp-a',

  // Band B — the large middle-income developer markets. Brazil is the
  // second-biggest single share in this category after India.
  BR: 'ppp-b',
  MX: 'ppp-b',
  TR: 'ppp-b',
  ZA: 'ppp-b',
  AR: 'ppp-b',
  CO: 'ppp-b',
  PE: 'ppp-b',
  TH: 'ppp-b',
  UA: 'ppp-b',
  MA: 'ppp-b',
  TN: 'ppp-b',
  DZ: 'ppp-b',
  JO: 'ppp-b',
  EC: 'ppp-b',
  DO: 'ppp-b',
  GT: 'ppp-b',
  PY: 'ppp-b',
  RS: 'ppp-b',
  BA: 'ppp-b',
  MK: 'ppp-b',
  AL: 'ppp-b',
  MD: 'ppp-b',
  GE: 'ppp-b',
  AM: 'ppp-b',
  AZ: 'ppp-b',
  KZ: 'ppp-b',
  KG: 'ppp-b',

  // Band C — a nudge, not a discount. Central and Eastern Europe, and the
  // upper-middle-income parts of Asia and Latin America.
  PL: 'ppp-c',
  RO: 'ppp-c',
  BG: 'ppp-c',
  HU: 'ppp-c',
  HR: 'ppp-c',
  SK: 'ppp-c',
  LT: 'ppp-c',
  LV: 'ppp-c',
  EE: 'ppp-c',
  GR: 'ppp-c',
  PT: 'ppp-c',
  MY: 'ppp-c',
  CL: 'ppp-c',
  UY: 'ppp-c',
  CR: 'ppp-c',
  PA: 'ppp-c',
  CN: 'ppp-c',
  MN: 'ppp-c',
}

/**
 * The bands, in depth order, for anything that has to enumerate them.
 *
 * Exported so `region.test.ts` can assert the map only ever names a band
 * that exists, and so a fourth band cannot be added to `plans.ts` without
 * something here failing.
 */
export const PPP_BANDS = ['ppp-a', 'ppp-b', 'ppp-c'] as const

/**
 * Every country this map prices, for tests and for the pricing page's
 * "we price for N countries" line.
 *
 * A duplicate key in the literal above would be silently resolved by object
 * ordering — last one wins, with nothing to read that says so. The test
 * suite counts these against the source text to catch exactly that.
 */
export function pricedCountries(): string[] {
  return Object.keys(COUNTRY_BAND)
}

/**
 * Visitor → pricing region.
 *
 * The country comes from the edge proxy's IP geolocation header, which is
 * set before the request reaches us and cannot be spoofed by the client the
 * way a cookie or query parameter could. `x-vercel-ip-country` is what
 * Vercel set; `cf-ipcountry` is what a Cloudflare front sets.
 *
 * Off Vercel, neither is guaranteed. Firebase App Hosting's CDN does not pass
 * geolocation headers to the backend, and Netlify exposes geolocation through
 * its own mechanism, not through either of these — so after deploying, check
 * `/api/billing/pricing` from a non-US network. Where no header arrives,
 * every request resolves to 'default' — list price, in dollars, for
 * everyone. That is the safe failure (a missing header can never advertise a
 * discount the checkout will not honour), but it means regional pricing is
 * OFF until something sets one of these headers.
 *
 * Locally neither header exists, so everything resolves to 'default' — list
 * price. To exercise a regional path in dev, send the header by hand:
 *   curl -H 'x-vercel-ip-country: BR' localhost:3007/api/billing/pricing
 *
 * VPN arbitrage is deliberately not defended against. Enforcing a match
 * between IP country and billing country blocks more legitimate buyers
 * (Indians paying with a foreign card, NRIs, anyone behind a corporate VPN)
 * than it stops arbitrage, and at these amounts the arbitrage is not worth
 * engineering against. Band C exists partly because of this: a 30% gap is
 * not worth anyone's time to route around, which is the whole design.
 */
export function regionFromCountry(country: string | null | undefined): Region {
  const code = country?.trim().toUpperCase()
  if (!code) return 'default'
  if (code === 'IN') return 'IN'
  return COUNTRY_BAND[code] ?? 'default'
}

/**
 * The geolocation header, but only where the platform in front of us is the
 * one that wrote it.
 *
 * A header is proof of location only when something between the visitor and
 * this code overwrites whatever the visitor sent. Vercel's edge does that for
 * `x-vercel-ip-country`; Cloudflare does it for `cf-ipcountry`. Anywhere
 * else, both are just headers, and `curl -H 'x-vercel-ip-country: IN'` was
 * enough to see (and be charged) the Indian price on the Netlify deployment.
 * Checkout picks its discount from this value, so a spoofable one is a
 * discount code printed on the front door.
 *
 * So each header is honoured only when its platform is known to be present:
 * Vercel sets VERCEL in its runtime, and a deployment behind Cloudflare opts
 * in with TRUST_CF_IPCOUNTRY=1. Neither is true on Netlify, which yields null
 * — list price for everyone — until a header there can be trusted.
 */
function trustedCountryHeader(headers: Headers): string | null {
  if (process.env.VERCEL) {
    const vercel = headers.get('x-vercel-ip-country')
    if (vercel) return vercel
  }
  if (process.env.TRUST_CF_IPCOUNTRY === '1') return headers.get('cf-ipcountry')
  return null
}

/**
 * The ISO country code an incoming request geolocates to, or null.
 *
 * Separate from `regionFromHeaders` because the band is a lossy read of
 * this: twenty-one countries collapse into 'ppp-a', and the banner has to
 * be able to say "Nigeria" rather than "band A". Nothing prices off this —
 * `regionFromHeaders` is still the only input to a discount — so a wrong or
 * spoofed value here changes a flag and a country name, never an amount.
 *
 * Returns the raw code even when it is not a priced country, so a caller
 * that wants to say "we don't price for your country yet" can. Callers that
 * only care about the band should keep using `regionFromHeaders`.
 */
export function countryFromHeaders(headers: Headers): string | null {
  /*
    Dev-only override. No edge proxy runs locally, so every request resolves
    to 'default' and the regional paths — a discount, and in India's case a
    rupee checkout — cannot be exercised end to end without hand-crafting a
    header, which is impossible for a checkout the browser initiates.

    Guarded on NODE_ENV rather than on the variable alone: a production
    deployment must not be able to set its way into handing every visitor
    the deepest regional discount.

    Read here rather than in `regionFromHeaders` so the override moves the
    flag and the price together. Split across the two functions, setting
    DEV_PRICING_REGION=BR would have shown a Brazilian discount under
    whatever flag the machine's real IP resolved to.
  */
  const raw =
    process.env.NODE_ENV !== 'production' && process.env.DEV_PRICING_REGION
      ? process.env.DEV_PRICING_REGION
      : trustedCountryHeader(headers)

  const code = raw?.trim().toUpperCase()
  // Vercel sends "XX" for an address it cannot place — a value that would
  // otherwise reach `Intl.DisplayNames` and come back as the literal "XX".
  if (!code || !/^[A-Z]{2}$/.test(code) || code === 'XX') return null
  return code
}

/** Pricing region for an incoming request. */
export function regionFromHeaders(headers: Headers): Region {
  return regionFromCountry(countryFromHeaders(headers))
}
