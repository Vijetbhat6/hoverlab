/**
 * A product detail screen.
 *
 * Ordered by what a shopper needs before they can decide: see it, choose a
 * size and price it, then read the detail, then check whether other people
 * regretted it.
 *
 * The gallery and buy box are a two-column grid on desktop with the buy box
 * `sticky`, so the price and Add to bag stay on screen while the images and
 * the description scroll. On a long product page that is the difference
 * between a purchase and a scroll back to the top.
 *
 * In a real project this file lives at `app/products/[slug]/page.tsx` and
 * takes `params` — fetch the product there and pass it down as props. Every
 * block below already accepts the fields it needs.
 */

import * as React from 'react'
import { ProductGallery } from '@/lib/blocks/sources/product-gallery'
import { ProductBuyBox } from '@/lib/blocks/sources/product-buy-box'
import { ProductInfoAccordion } from '@/lib/blocks/sources/product-info-accordion'
import { ProductReviewSummary } from '@/lib/blocks/sources/product-review-summary'
import { ReviewList } from '@/lib/blocks/sources/review-list'
import { ProductRail } from '@/lib/blocks/sources/product-rail'

export default function ProductDetailPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <a href="/" className="transition-colors hover:text-foreground">
                Shop
              </a>
            </li>
            <li aria-hidden>/</li>
            <li>
              <a href="/knitwear" className="transition-colors hover:text-foreground">
                Knitwear
              </a>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-foreground">
              Merino Crew Sweater
            </li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <ProductGallery />

          {/* Sticky, so price and Add to bag survive a long scroll. */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <ProductBuyBox />
          </div>
        </div>

        <div className="mt-14">
          <ProductInfoAccordion />
        </div>

        <div className="mt-14 space-y-8">
          <ProductReviewSummary />
          <ReviewList />
        </div>

        <div className="mt-16 border-t border-border/60 pt-10">
          <ProductRail viewAllHref="/knitwear" />
        </div>
      </div>
    </main>
  )
}
