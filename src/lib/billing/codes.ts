import {
  PLANS,
  discountForRegion,
  presentmentCurrencyFor,
  priceForRegion,
  priceInrForRegion,
  formatPrice,
  formatPricePaise,
  type Region,
} from './plans'

/**
 * Discount codes we advertise in public, and the one rule about when we may.
 *
 * WHY A PUBLIC CODE AT ALL, GIVEN REGIONAL PRICING ALREADY EXISTS
 *
 * `plans.ts` already prices four regions, and `checkout/route.ts` already
 * applies the right discount from an edge geolocation header without anyone
 * typing anything. That machinery is better than a coupon in every respect
 * but one: it is invisible until the checkout page. Somebody in Delhi reading
 * $79 on /pricing closes the tab, and the ₹2,400 they would actually have
 * been charged never gets to argue with them.
 *
 * India is the single largest country at every catalog in this category that
 * publishes numbers, and it is the one whose visitors are most reliably
 * filtered out by a dollar price read six clicks before the discount lands.
 * React Bits answers that with a code in a banner on every page. This is the
 * same answer, with the difference that our banner has to be able to say
 * nothing.
 *
 * THE RULE: NEVER ADVERTISE A DISCOUNT THAT CHECKOUT WILL NOT HONOUR
 *
 * That is the whole reason this file is more than a string constant. There
 * are two ways a region can end up cheaper, they are mutually exclusive at
 * Polar, and which one is live is a property of the dashboard rather than of
 * this repo:
 *
 *   AUTO   `POLAR_DISCOUNT_ID_<BAND>_<PLAN>` is set, so the checkout route
 *          applies the discount itself and sets `allowDiscountCodes: false`
 *          — a code typed on top of it would be rejected. The banner must
 *          therefore advertise the PRICE and no code at all.
 *
 *   CODE   The discount ids are not set, so checkout charges list price and
 *          leaves `allowDiscountCodes` on. A percentage coupon created by
 *          hand in Polar is the only way the regional price is reachable,
 *          and the banner must print it or nobody will ever type it.
 *
 * Advertising a code in the AUTO case gets it rejected at the till. Printing
 * a regional price in neither case charges list to exactly the buyers the
 * regional price exists for. Both are the same mistake `priceForRegion` is
 * already guarded against, one surface further out, so the guard is the same
 * shape: read what is configured, and say nothing when nothing is.
 *
 * WHICH IS WHY THIS DEPLOYMENT MAY RENDER NO BANNER
 *
 * With neither the discount ids nor a coupon code set, `publicOfferFor`
 * returns null and the banner renders nothing, on every page, in every
 * country. That is the correct output for a Polar organization that has not
 * been configured, not a bug to route around — see `components/landing/
 * community-band.tsx` for the same decision about social links, and
 * `billing/support.ts` for it about support channels.
 *
 * CONFIGURING ONE
 *
 * Create a percentage discount in Polar, restricted to nothing (a public
 * code has to work on whichever plan the buyer picks), then set the pair:
 *
 *   POLAR_PPP_CODE_IN=INDIA68        POLAR_PPP_PERCENT_IN=68
 *   POLAR_PPP_CODE_A=…               POLAR_PPP_PERCENT_A=…
 *   POLAR_PPP_CODE_B=…               POLAR_PPP_PERCENT_B=…
 *   POLAR_PPP_CODE_C=…               POLAR_PPP_PERCENT_C=…
 *   POLAR_STUDENT_CODE=…             POLAR_STUDENT_PERCENT=…
 *
 * Both halves or neither. A code with no percentage cannot be described
 * truthfully in a banner, and a percentage with no code cannot be typed, so
 * a half-configured pair is treated as unconfigured rather than rendered
 * with a hole in it.
 *
 * These are server-only on purpose — no NEXT_PUBLIC_ prefix. The banner is a
 * client component and reads them through /api/billing/pricing, which
 * resolves the region from the request header. A build-time inlined code
 * would ship every region's discount to every visitor's bundle, which is a
 * worse leak than it sounds: band A is 68% off.
 */

/** Env infix for each discountable region, matching `bandOverrides` in plans.ts. */
const REGION_INFIX: Record<Exclude<Region, 'default'>, string> = {
  IN: 'IN',
  'ppp-a': 'A',
  'ppp-b': 'B',
  'ppp-c': 'C',
}

/** How a region's discount actually reaches the buyer. */
export type OfferKind =
  /** Applied by the checkout route from the request's country. Nothing to type. */
  | 'automatic'
  /** A percentage coupon the buyer types. The only kind with a `code`. */
  | 'code'

export interface PublicOffer {
  kind: OfferKind
  /** The coupon to type, for `kind: 'code'` only. */
  code: string | null
  /** Percent off, for `kind: 'code'` only — it is what the coupon is worth. */
  percentOff: number | null
  /**
   * The entry price this offer produces, already formatted, in the currency
   * the buyer will actually be charged in.
   *
   * Present for `kind: 'automatic'` and null for `kind: 'code'`, and the
   * asymmetry is not an oversight. An automatic discount has one exact
   * outcome per plan and we know it. A hand-made percentage coupon's outcome
   * is whatever the person in the Polar dashboard typed, and a banner that
   * computed `list × (1 - percent)` would be publishing a price nothing in
   * this repo can hold anyone to.
   */
  entryPrice: string | null
  /** List price of the same plan, for the struck-through comparison. */
  listPrice: string
}

/**
 * Whether this region's discount is applied for the buyer without a code.
 *
 * Tested against Pro specifically rather than against the region in general.
 * Pro is the plan the banner quotes and the one most first purchases are,
 * and `bandOverrides` reads one env var per plan per band — so a region can
 * genuinely be half-configured, and "is there a discount here" has no single
 * answer. The plan being advertised is the one whose answer matters.
 */
function autoApplies(region: Region): boolean {
  return discountForRegion('pro', region, presentmentCurrencyFor('pro', region)) !== null
}

/** A configured code/percent pair for a region, or null if either half is missing. */
function codeFor(region: Exclude<Region, 'default'>): { code: string; percentOff: number } | null {
  const infix = REGION_INFIX[region]
  const code = process.env[`POLAR_PPP_CODE_${infix}`]?.trim()
  const percent = Number(process.env[`POLAR_PPP_PERCENT_${infix}`])
  if (!code) return null
  // A percentage outside (0, 100) cannot describe a discount. Rejected rather
  // than clamped: the banner would otherwise announce "0% off" to a whole
  // country because somebody left the variable empty.
  if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) return null
  return { code, percentOff: Math.round(percent) }
}

/**
 * Pro's price in a region, written the way the buyer will be charged it.
 *
 * Rupees for India once the rupee discount exists, dollars everywhere else,
 * for the same reason `presentmentCurrencyFor` decides the checkout currency:
 * a banner quoting dollars to somebody whose card is about to be charged in
 * rupees has quoted the wrong number twice over — the figure and the symbol.
 */
function entryPriceFor(region: Region): string {
  return presentmentCurrencyFor('pro', region) === 'inr'
    ? formatPricePaise(priceInrForRegion('pro', region))
    : formatPrice(priceForRegion('pro', region))
}

/** Pro's list price, in the currency the regional figure beside it is written in. */
function listPriceFor(region: Region): string {
  return presentmentCurrencyFor('pro', region) === 'inr'
    ? formatPricePaise(PLANS.pro.priceInrPaise)
    : formatPrice(PLANS.pro.priceCents)
}

/**
 * What, if anything, to tell a visitor from this region before they reach
 * the checkout page.
 *
 * Returns null for the default region, null for a discountable region that
 * this deployment has not configured either way, and null for one whose
 * configuration is live but self-contradictory (see the equal-price guard
 * below). All three mean the same thing to the banner — render nothing —
 * but they mean different things to whoever is looking at the deploy, which
 * is why `autoApplies` is checked first and separately rather than folded
 * into one truthiness test.
 */
export function publicOfferFor(region: Region): PublicOffer | null {
  if (region === 'default') return null

  if (autoApplies(region)) {
    const entryPrice = entryPriceFor(region)
    const listPrice = listPriceFor(region)
    /*
      A configured discount id that produces no saving is not an offer.

      `autoApplies` asks whether Polar will apply something; `priceForRegion`
      and `priceInrForRegion` ask what it is worth, and they read different
      inputs — an id from the environment, a figure from `BAND_CENTS` /
      `IN_PAISE` in the source. They can disagree. Set
      POLAR_DISCOUNT_ID_IN_PRO_INR while `IN_PAISE` has no `pro` row and
      `priceInrForRegion` falls back to list, which is correct and safe at
      checkout — but reaches the banner as "Pro is ₹7,500 ₹7,500 here",
      two identical figures with a line through one of them.

      Returning null there is the same answer this file gives to every other
      half-configured state: say nothing rather than something that has to
      be squinted at. It also fails in the direction that costs nothing —
      the regional price is still applied at checkout either way, because
      the discount id really is set. Only the advertisement is withheld.
    */
    if (entryPrice === listPrice) return null

    return {
      kind: 'automatic',
      code: null,
      percentOff: null,
      entryPrice,
      listPrice,
    }
  }

  const coupon = codeFor(region)
  if (!coupon) return null

  return {
    kind: 'code',
    code: coupon.code,
    percentOff: coupon.percentOff,
    entryPrice: null,
    listPrice: listPriceFor(region),
  }
}

/**
 * The student code, which is a region-independent version of the same thing.
 *
 * No `kind: 'automatic'` branch, because there is no header that says anybody
 * is a student. Verification is a human reading an email (see /students), and
 * what they hand back is a code — so this is the one discount on the site
 * that only ever has the typed shape.
 */
export function studentOffer(): { code: string; percentOff: number } | null {
  const code = process.env.POLAR_STUDENT_CODE?.trim()
  const percent = Number(process.env.POLAR_STUDENT_PERCENT)
  if (!code) return null
  if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) return null
  return { code, percentOff: Math.round(percent) }
}

/**
 * Whether the student programme is open at all on this deployment.
 *
 * Separate from `studentOffer()` because /students has something to say
 * either way: with a code configured it prints the code, and without one it
 * still explains the programme and says to write in. The page is not
 * conditional on the code; only the code is.
 */
export function studentProgrammeOpen(): boolean {
  return studentOffer() !== null
}
