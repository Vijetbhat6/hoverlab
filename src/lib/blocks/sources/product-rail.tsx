/**
 * <ProductRail> — a horizontally scrolling "you might also like" row.
 *
 * Built on native overflow scrolling with CSS scroll-snap rather than a
 * carousel library. That buys touch swiping, momentum, keyboard arrow keys
 * and a real scrollbar for free — all of which a JavaScript carousel has to
 * reimplement, usually incompletely.
 *
 * `scroll-snap-align: start` on each card and `scroll-padding-inline` on
 * the track together stop a snapped card from sitting flush against the
 * viewport edge, which is what makes a rail look like it was cropped rather
 * than designed.
 *
 * Server component.
 */

import * as React from 'react'

export interface RailProduct {
  id: string
  name: string
  /** Price in minor units — 1999 is £19.99. Never a float. */
  price: number
  /** Tailwind gradient classes standing in for the product image. */
  swatch?: string
}

/**
 * Minor units → a formatted price.
 *
 * Deliberately duplicated from `product-grid` rather than imported from it.
 * Every block in this catalog is copied on its own, and a cross-block
 * import is an invisible dependency: the file compiles here, and breaks the
 * moment someone takes this rail without also taking the grid. Three lines
 * of duplication is the cheaper mistake.
 */
function formatPrice(minor: number, currency = 'GBP', locale = 'en-GB'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minor / 100)
}

export interface ProductRailProps {
  products?: RailProduct[]
  heading?: string
  subheading?: string
  currency?: string
  locale?: string
  viewAllHref?: string
  className?: string
}

const DEFAULT_PRODUCTS: RailProduct[] = [
  { id: '1', name: 'Lambswool Scarf', price: 4500, swatch: 'from-rose-200 to-rose-400' },
  { id: '2', name: 'Cable Knit Jumper', price: 9800, swatch: 'from-amber-200 to-amber-500' },
  { id: '3', name: 'Corduroy Trousers', price: 7900, swatch: 'from-emerald-200 to-emerald-500' },
  { id: '4', name: 'Suede Chelsea Boots', price: 16500, swatch: 'from-stone-300 to-stone-600' },
  { id: '5', name: 'Linen Pocket Square', price: 2400, swatch: 'from-sky-200 to-sky-400' },
  { id: '6', name: 'Wool Overcoat', price: 28000, swatch: 'from-indigo-300 to-indigo-700' },
]

export function ProductRail({
  products = DEFAULT_PRODUCTS,
  heading = 'You might also like',
  subheading,
  currency = 'GBP',
  locale = 'en-GB',
  viewAllHref,
  className = '',
}: ProductRailProps) {
  return (
    <section className={`w-full ${className}`}>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{heading}</h2>
          {subheading ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{subheading}</p>
          ) : null}
        </div>

        {viewAllHref ? (
          <a
            href={viewAllHref}
            className="shrink-0 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
          </a>
        ) : null}
      </div>

      {/*
        Native scroller. `scroll-padding-inline` keeps a snapped card off
        the edge; without it the first card looks clipped at every stop.
      */}
      <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 [scroll-padding-inline:0.25rem]">
        {products.map((product) => (
          <li
            key={product.id}
            className="w-40 shrink-0 snap-start sm:w-48"
          >
            <a href={`/products/${product.id}`} className="group block">
              <div className="aspect-[4/5] overflow-hidden rounded-xl border border-border/60 bg-muted">
                <div
                  aria-hidden
                  className={`h-full w-full bg-gradient-to-br ${product.swatch ?? 'from-muted to-muted-foreground/20'} transition-transform duration-500 group-hover:scale-105`}
                />
              </div>

              <p className="mt-2 truncate text-sm font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatPrice(product.price, currency, locale)}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
