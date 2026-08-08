/**
 * The post-purchase screen.
 *
 * Navigation comes back here — the opposite of the checkout. The sale is
 * done, and the useful next action is browsing again, so the header returns
 * and the confirmation block ends with a link back into the shop.
 *
 * The product rail below is "you might also like" rather than "recently
 * viewed": showing someone the item they just bought, three seconds after
 * buying it, is the most common own-goal on this screen.
 */

import * as React from 'react'
import { OrderConfirmation } from '@/lib/blocks/sources/order-confirmation'
import { ProductRail } from '@/lib/blocks/sources/product-rail'

export default function OrderConfirmationPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
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
          <nav aria-label="Main" className="flex items-center gap-5 text-sm">
            <a href="/" className="text-muted-foreground transition-colors hover:text-foreground">
              Shop
            </a>
            <a
              href="/account/orders"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Orders
            </a>
          </nav>
        </div>
      </header>

      <main>
        <OrderConfirmation />

        <div className="mx-auto w-full max-w-5xl border-t border-border/60 px-4 py-12 sm:px-6">
          {/* Not "recently viewed" — they just bought that. */}
          <ProductRail heading="You might also like" />
        </div>
      </main>
    </div>
  )
}
