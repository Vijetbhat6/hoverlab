/**
 * A product collection screen — filters, toolbar, grid.
 *
 * The layout decision that matters: the filter sidebar is `hidden lg:block`
 * and the toolbar carries its own Filters button below that width. Stacking
 * a dozen facets above the products on a phone means the first thing a
 * shopper sees on a shopping page is a form.
 *
 * On desktop the sidebar is `sticky` so it stays in reach while the grid
 * scrolls. A filter panel that scrolls away at product forty is a filter
 * panel nobody uses twice.
 */

import * as React from 'react'
import { ProductFilterSidebar } from '@/lib/blocks/sources/product-filter-sidebar'
import { CollectionToolbar } from '@/lib/blocks/sources/collection-toolbar'
import { ProductGrid } from '@/lib/blocks/sources/product-grid'
import { ProductRail } from '@/lib/blocks/sources/product-rail'

export default function CollectionPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Autumn / Winter
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">Knitwear</h1>
          <p className="mt-3 text-pretty text-muted-foreground">
            Fully fashioned merino and lambswool, knitted in Scotland. Made to
            keep its shape rather than to hit a price.
          </p>
        </header>

        <div className="flex gap-10">
          {/* Sticky on desktop; below lg the toolbar's own button opens it. */}
          <div className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-6">
              <ProductFilterSidebar />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <CollectionToolbar />

            <div className="mt-6">
              <ProductGrid />
            </div>

            <nav aria-label="Pagination" className="mt-10 flex justify-center">
              <button
                type="button"
                className="rounded-xl border border-border/60 bg-background px-6 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                Load more
              </button>
            </nav>
          </div>
        </div>

        <div className="mt-16 border-t border-border/60 pt-10">
          <ProductRail heading="Recently viewed" viewAllHref="/history" />
        </div>
      </div>
    </main>
  )
}
