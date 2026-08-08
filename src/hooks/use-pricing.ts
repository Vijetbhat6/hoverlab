'use client'

/**
 * Prices, buyability and display currency for the current visitor.
 *
 * Shared by every surface that sells: the landing pricing section and the
 * upgrade panel on /account. Both need the same two facts the browser
 * cannot work out for itself —
 *
 *   Region. Decided from an edge geolocation header on the request, which
 *   is why it arrives via /api/billing/pricing rather than being computed
 *   here.
 *
 *   Purchasability. `isPurchasable()` reads POLAR_PRODUCT_ID_*, server-only
 *   env vars Next does not inline into the client bundle; called in the
 *   browser it is always false. The route also folds in `billingEnabled()`,
 *   so a plan reported buyable here will not dead-end at a 503.
 *
 * Everything this returns is advisory. The amount charged is decided by
 * /api/billing/checkout from the same header, so a visitor who fakes their
 * way to a cheaper-looking page still checks out at list price.
 *
 * The currency choice changes the currency a price is WRITTEN IN, never
 * which price applies — letting a visitor pick their pricing region would
 * either hand the India discount to everyone who clicks it, or show a price
 * the server then refuses to honor.
 */

import * as React from 'react'
import { track } from '@/lib/analytics'
import {
  PLANS,
  formatPrice,
  formatPriceInr,
  formatPricePaise,
  type PlanId,
  type Region,
} from '@/lib/billing/plans'

/** Shape of GET /api/billing/pricing. */
interface PricingResponse {
  region: Region
  plans: Record<
    string,
    {
      priceCents: number
      priceInrPaise: number
      chargedInInr: boolean
      purchasable: boolean
    }
  >
}

/** Currency a price is displayed in. Never what it is charged in — see above. */
export type Currency = 'USD' | 'INR'

const CURRENCY_KEY = 'hl:pricing-currency'

export interface UsePricing {
  region: Region | null
  currency: Currency
  chooseCurrency: (next: Currency) => void
  /** Cents to display — regional price once known, list price until then. */
  centsFor: (id: PlanId) => number
  /** True when the visitor's regional price undercuts list price. */
  isDiscounted: (id: PlanId) => boolean
  /** Headline figure for a plan, in whichever currency is selected. */
  headlineFor: (id: PlanId) => string
  /** The same plan's list price, for the struck-through comparison. */
  listHeadlineFor: (id: PlanId) => string
  /** The other currency, shown underneath as a reference. */
  secondaryFor: (id: PlanId) => string
  /**
   * True when this plan is charged in rupees, so its rupee figure is the
   * exact amount rather than a conversion. Drives whether the page says
   * "approximately" — the difference between an estimate and a promise.
   */
  chargedInInr: (id: PlanId) => boolean
  /**
   * Whether a plan can actually be bought — null until the server has said.
   * Callers render a disabled CTA while it is null: guessing "buyable"
   * dead-ends at a 503, guessing "unavailable" flashes the wrong CTA at
   * every visitor on a correctly configured deployment.
   */
  purchasableFor: (id: PlanId) => boolean | null
}

export function usePricing(): UsePricing {
  const [pricing, setPricing] = React.useState<PricingResponse | null>(null)
  // null = the visitor hasn't chosen, so fall back to the regional default.
  const [currency, setCurrency] = React.useState<Currency | null>(null)

  React.useEffect(() => {
    let cancelled = false
    fetch('/api/billing/pricing')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PricingResponse | null) => {
        if (!cancelled && data) setPricing(data)
      })
      .catch(() => {
        // Leave `pricing` null: list prices stay on screen and the paid CTAs
        // stay disabled. Better than offering a checkout we can't confirm.
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Restore a previous choice. Read on mount rather than in useState's
  // initializer so the server and first client render agree — reading
  // localStorage during render would hydrate-mismatch every visitor who has
  // ever touched the toggle.
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CURRENCY_KEY)
      if (stored === 'USD' || stored === 'INR') setCurrency(stored)
    } catch {
      // Private mode / storage disabled — the regional default is fine.
    }
  }, [])

  /**
   * Explicit choice wins; otherwise default from the region. Someone browsing
   * from India almost certainly wants to read rupees, and someone elsewhere
   * almost certainly doesn't — but either can override, which is the point of
   * the toggle (NRIs, agencies billing abroad, anyone comparing).
   */
  const activeCurrency: Currency =
    currency ?? (pricing?.region === 'IN' ? 'INR' : 'USD')

  const chooseCurrency = React.useCallback(
    (next: Currency) => {
      setCurrency(next)
      try {
        window.localStorage.setItem(CURRENCY_KEY, next)
      } catch {
        // Not worth surfacing — the toggle still works for this page view.
      }
      track('pricing_currency_toggled', {
        currency: next,
        region: pricing?.region ?? 'unknown',
      })
    },
    [pricing?.region],
  )

  const centsFor = React.useCallback(
    (id: PlanId): number => pricing?.plans[id]?.priceCents ?? PLANS[id].priceCents,
    [pricing],
  )

  const isDiscounted = React.useCallback(
    (id: PlanId): boolean => centsFor(id) < PLANS[id].priceCents,
    [centsFor],
  )

  const chargedInInr = React.useCallback(
    (id: PlanId): boolean => pricing?.plans[id]?.chargedInInr ?? false,
    [pricing],
  )

  /**
   * Rupee figure for a plan.
   *
   * An exact INR price when the plan is actually charged in rupees, and a
   * conversion of the dollar price otherwise. Both render as "₹5,600", so
   * which one this is decides whether the surrounding copy may call it a
   * price or must call it an estimate — see `chargedInInr`.
   */
  const rupeesFor = React.useCallback(
    (id: PlanId, cents: number): string => {
      if (chargedInInr(id)) {
        return formatPricePaise(
          pricing?.plans[id]?.priceInrPaise ?? PLANS[id].priceInrPaise,
        )
      }
      return formatPriceInr(cents)
    },
    [chargedInInr, pricing],
  )

  const headlineFor = React.useCallback(
    (id: PlanId): string =>
      activeCurrency === 'INR'
        ? rupeesFor(id, centsFor(id))
        : formatPrice(centsFor(id)),
    [activeCurrency, centsFor, rupeesFor],
  )

  const listHeadlineFor = React.useCallback(
    (id: PlanId): string =>
      activeCurrency === 'INR'
        ? // The list price in rupees is PLANS[id].priceInrPaise for a plan
          // charged in rupees; formatPriceInr's conversion would contradict
          // the exact headline sitting next to it.
          chargedInInr(id)
          ? formatPricePaise(PLANS[id].priceInrPaise)
          : formatPriceInr(PLANS[id].priceCents)
        : formatPrice(PLANS[id].priceCents),
    [activeCurrency, chargedInInr],
  )

  const secondaryFor = React.useCallback(
    (id: PlanId): string =>
      activeCurrency === 'INR'
        ? formatPrice(centsFor(id))
        : rupeesFor(id, centsFor(id)),
    [activeCurrency, centsFor, rupeesFor],
  )

  const purchasableFor = React.useCallback(
    (id: PlanId): boolean | null =>
      id === 'free' ? true : (pricing?.plans[id]?.purchasable ?? null),
    [pricing],
  )

  return {
    region: pricing?.region ?? null,
    currency: activeCurrency,
    chooseCurrency,
    centsFor,
    isDiscounted,
    headlineFor,
    listHeadlineFor,
    secondaryFor,
    chargedInInr,
    purchasableFor,
  }
}
