/**
 * <ProductGrid> — a responsive grid of product cards.
 *
 * Two things worth taking rather than rewriting:
 *
 *  - Prices are integer minor units (cents), formatted with `Intl`. Storing
 *    money as a float is how `19.99 * 3` becomes `59.97000000000001` in a
 *    cart total, and it is always found in production.
 *  - The whole card is one link via an overlay pseudo-element, but the
 *    wishlist button sits above it on `z-10`. Nesting a button inside an
 *    anchor is invalid HTML and browsers resolve it by making one of them
 *    unclickable — usually the one you needed.
 *
 * Images are gradient placeholders, not remote URLs: a block that fetches
 * from a CDN is a block that breaks offline, in a sandbox, and in the
 * preview here. Swap the placeholder for `next/image` when you wire it up.
 *
 * Server component.
 */

import * as React from 'react'
import { Heart, Star } from 'lucide-react'

export interface Product {
  id: string
  name: string
  /** Price in minor units — 1999 is £19.99. Never a float. */
  price: number
  compareAt?: number
  rating?: number
  reviewCount?: number
  badge?: string
  soldOut?: boolean
  /** Tailwind gradient classes standing in for the product image. */
  swatch?: string
}

export interface ProductGridProps {
  products?: Product[]
  currency?: string
  locale?: string
  className?: string
}

const DEFAULT_PRODUCTS: Product[] = [
  { id: '1', name: 'Merino Crew Sweater', price: 8900, compareAt: 12000, rating: 4.8, reviewCount: 212, badge: 'Sale', swatch: 'from-stone-300 to-stone-500' },
  { id: '2', name: 'Selvedge Denim Jacket', price: 14500, rating: 4.6, reviewCount: 88, swatch: 'from-indigo-300 to-indigo-600' },
  { id: '3', name: 'Cotton Oxford Shirt', price: 6500, rating: 4.9, reviewCount: 431, badge: 'Bestseller', swatch: 'from-sky-200 to-sky-400' },
  { id: '4', name: 'Waxed Canvas Holdall', price: 19900, rating: 4.7, reviewCount: 56, swatch: 'from-amber-300 to-amber-600' },
  { id: '5', name: 'Ribbed Wool Beanie', price: 3200, rating: 4.5, reviewCount: 140, soldOut: true, swatch: 'from-rose-300 to-rose-500' },
  { id: '6', name: 'Leather Card Holder', price: 4800, rating: 4.8, reviewCount: 97, swatch: 'from-emerald-300 to-emerald-600' },
]

/** Minor units → a formatted price. Never divides before formatting. */
export function formatPrice(minor: number, currency = 'GBP', locale = 'en-GB'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minor / 100)
}

export function ProductGrid({
  products = DEFAULT_PRODUCTS,
  currency = 'GBP',
  locale = 'en-GB',
  className = '',
}: ProductGridProps) {
  return (
    <div
      className={`grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 ${className}`}
    >
      {products.map((product) => (
        <article
          key={product.id}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="relative aspect-[4/5] overflow-hidden bg-muted">
            {/* Placeholder, not a remote image — see the file header. */}
            <div
              aria-hidden
              className={`h-full w-full bg-gradient-to-br ${product.swatch ?? 'from-muted to-muted-foreground/20'} transition-transform duration-500 group-hover:scale-105`}
            />

            {product.badge ? (
              <span className="absolute left-3 top-3 rounded-full bg-foreground px-2.5 py-1 text-xs font-semibold text-background">
                {product.badge}
              </span>
            ) : null}

            {product.soldOut ? (
              <span className="absolute inset-x-0 bottom-0 bg-background/90 py-2 text-center text-xs font-semibold backdrop-blur">
                Sold out
              </span>
            ) : null}

            {/* Above the card link, or the anchor swallows the click. */}
            <button
              type="button"
              aria-label={`Save ${product.name}`}
              className="absolute right-3 top-3 z-10 rounded-full bg-background/80 p-2 text-muted-foreground backdrop-blur transition-colors hover:text-rose-500"
            >
              <Heart aria-hidden className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-1 flex-col p-3.5">
            <h3 className="text-sm font-medium leading-snug">
              <a
                href={`/products/${product.id}`}
                className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
              >
                {product.name}
              </a>
            </h3>

            {product.rating ? (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Star aria-hidden className="h-3 w-3 fill-amber-400 text-amber-400" />
                {product.rating}
                <span className="text-muted-foreground/60">({product.reviewCount})</span>
              </p>
            ) : null}

            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-sm font-semibold">
                {formatPrice(product.price, currency, locale)}
              </span>
              {product.compareAt ? (
                <>
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(product.compareAt, currency, locale)}
                  </span>
                  <span className="sr-only">
                    reduced from {formatPrice(product.compareAt, currency, locale)}
                  </span>
                </>
              ) : null}
            </p>
          </div>
        </article>
      ))}
    </div>
  )
}
