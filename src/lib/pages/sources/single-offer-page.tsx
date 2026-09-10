/**
 * One thing, one price, named above the fold.
 *
 * The whole catalog's other pricing surfaces assume a subscription with
 * tiers. This is the other shape: a course, a consultation, a one-time
 * licence, a workshop — where there is nothing to compare against because
 * there is only one thing to buy.
 *
 * That changes the first decision. <HeroPriceAnchor> puts the number above
 * the fold, with the former price in a real `<s>` element rather than a
 * struck-through span, because a single-offer page that hides its price
 * behind a scroll is answering the visitor's only question last. The tiered
 * pages can defer the number; this one cannot.
 *
 *   price        first, and it is the headline
 *   value        what the number buys, once the number is known
 *   reviews      the distribution rather than a cherry-picked average, so
 *                the two-star column is visible. A page with one product
 *                and no dissent reads as a page with no reviews
 *   booking      the conversion, with a time zone the visitor can change —
 *                a slot list with no zone on it books the wrong hour and
 *                produces a refund rather than a customer
 *   consent      per-category, refusing exactly as easy as accepting
 *
 * <CookieConsent> is here rather than on the app screens because this is a
 * public page reached from an ad, which is where consent actually has to
 * work — and where a dark-patterned banner is both a legal problem and a
 * first impression.
 */

import * as React from 'react'
import { NavbarSimple } from '@/lib/blocks/sources/navbar-simple'
import { HeroPriceAnchor } from '@/lib/blocks/sources/hero-price-anchor'
import { PricingValueSplit } from '@/lib/blocks/sources/pricing-value-split'
import { ReviewDistributionBand } from '@/lib/blocks/sources/review-distribution-band'
import { BookingScheduler } from '@/lib/blocks/sources/booking-scheduler'
import { FooterMinimal } from '@/lib/blocks/sources/footer-minimal'
import { CookieConsent } from '@/lib/blocks/sources/cookie-consent'

export default function SingleOfferPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <NavbarSimple />
      <HeroPriceAnchor />

      <PricingValueSplit />
      <ReviewDistributionBand />
      <BookingScheduler />

      <FooterMinimal />

      {/* A public page reached from an ad is where consent has to work. */}
      <CookieConsent />
    </main>
  )
}
