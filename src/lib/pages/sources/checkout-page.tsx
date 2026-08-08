/**
 * The checkout screen.
 *
 * Two things this does that ordinary page layouts do not, both aimed at
 * completion rate:
 *
 *  - **No site navigation.** A checkout keeps a minimal header with the
 *    logo and a security note, and nothing else. Every link out of this
 *    page is a way to lose the sale, which is why every large retailer
 *    strips the nav here.
 *  - **The summary comes first on mobile.** `order-first lg:order-last`
 *    puts what they are paying above the form on a phone, then moves it
 *    beside the form on desktop. A shopper filling in eight fields without
 *    the total in sight is a shopper who abandons at the payment step.
 */

import * as React from 'react'
import { CheckoutForm } from '@/lib/blocks/sources/checkout-form'
import { OrderSummaryPanel } from '@/lib/blocks/sources/order-summary-panel'

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Minimal chrome — no navigation out of a checkout. */}
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground"
            >
              A
            </span>
            Acme
          </a>
          <p className="text-xs text-muted-foreground">Secure checkout</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="sr-only">Checkout</h1>

        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          <div className="order-last lg:order-first">
            <CheckoutForm />
          </div>

          {/* First on mobile: the total belongs above the form. */}
          <div className="order-first lg:order-last lg:sticky lg:top-6 lg:self-start">
            <OrderSummaryPanel ctaLabel="Pay now" />
          </div>
        </div>
      </main>
    </div>
  )
}
