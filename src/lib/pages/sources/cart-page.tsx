/**
 * The basket screen.
 *
 * Lines on the left, summary on the right and sticky. The summary holds the
 * total and the Checkout button, and it must not scroll away while someone
 * is adjusting quantities four lines down — that is the moment they decide
 * whether to continue.
 *
 * The product rail at the bottom is deliberately "recently viewed" rather
 * than "you might also like". At this point the shopper has decided; the
 * useful prompt is the thing they looked at and did not add, not a fresh
 * distraction between them and the checkout button.
 */

import * as React from 'react'
import { CartLineItems } from '@/lib/blocks/sources/cart-line-items'
import { OrderSummaryPanel } from '@/lib/blocks/sources/order-summary-panel'
import { ProductRail } from '@/lib/blocks/sources/product-rail'

export default function CartPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Your bag</h1>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
          <CartLineItems />

          {/* Total and CTA stay in view while quantities change. */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <OrderSummaryPanel />
          </div>
        </div>

        <div className="mt-16 border-t border-border/60 pt-10">
          <ProductRail heading="Recently viewed" />
        </div>
      </div>
    </main>
  )
}
