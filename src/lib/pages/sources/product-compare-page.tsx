/**
 * Deciding between three of a thing — the page between a listing and a
 * product detail.
 *
 * Comparison pages get built as a table and stop there, which loses the
 * two questions that actually decide the purchase: will it fit, and can I
 * have it. Both are here.
 *
 *   story        an editorial opener with a real tablist for the thumbnail
 *                strip, so arrow keys work. A comparison that opens on a
 *                grid of specs assumes the reader already knows what they
 *                are looking at
 *   table        three side by side, row labels pinned through the
 *                horizontal scroll, and an "only show differences" toggle
 *                that turns forty rows into the six that matter
 *   specs        the detail behind the row that made someone pause
 *   sizing       what the model is wearing and what previous buyers did —
 *                the panel that decides whether the parcel comes back
 *   stock        per-variant, because "in stock" for a product is not a
 *                fact about the size you want
 *   back in      and the form for when it is not
 *
 * The stock pair at the end is the part most comparison pages omit
 * entirely, and it is the one that costs money in both directions: a
 * reader who chooses the item that is unavailable buys nothing, and a
 * reader told it is unavailable with no way to be notified is a lost sale
 * that never appears in any funnel.
 */

import * as React from 'react'
import { CollectionStorySplit } from '@/lib/blocks/sources/collection-story-split'
import { ProductCompareTable } from '@/lib/blocks/sources/product-compare-table'
import { ProductSpecSplit } from '@/lib/blocks/sources/product-spec-split'
import { ProductSizeGuide } from '@/lib/blocks/sources/product-size-guide'
import { StockAvailabilityList } from '@/lib/blocks/sources/stock-availability-list'
import { BackInStockForm } from '@/lib/blocks/sources/back-in-stock-form'

export default function ProductComparePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <CollectionStorySplit />

      <ProductCompareTable />
      <ProductSpecSplit />
      <ProductSizeGuide />

      {/* The two blocks a comparison page usually forgets. */}
      <StockAvailabilityList />
      <BackInStockForm />
    </main>
  )
}
