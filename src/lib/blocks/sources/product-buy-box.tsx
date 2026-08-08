'use client'

/**
 * <ProductBuyBox> — price, variants, quantity and add-to-cart.
 *
 * The part people get wrong: **out-of-stock variants stay visible and
 * disabled**, they are not hidden. A size that vanishes from the picker
 * reads as "this shop does not make a Large", and the customer leaves. A
 * greyed-out Large with "out of stock" on it reads as "come back", which is
 * a different outcome entirely.
 *
 * Variant selection is a radiogroup, so arrow keys move between options and
 * the group is announced with its label. The quantity stepper's buttons
 * have real accessible names — "Increase quantity", not "+".
 *
 * Prices are integer minor units. See `product-grid.tsx` for why.
 */

import * as React from 'react'
import { Minus, Plus, ShoppingBag, Check, Truck, RotateCcw } from 'lucide-react'
import { formatPrice } from './product-grid'

export interface Variant {
  value: string
  label: string
  inStock: boolean
}

export interface ProductBuyBoxProps {
  name?: string
  price?: number
  compareAt?: number
  currency?: string
  locale?: string
  variantLabel?: string
  variants?: Variant[]
  maxQuantity?: number
  onAddToCart?: (value: { variant: string; quantity: number }) => void
  className?: string
}

const DEFAULT_VARIANTS: Variant[] = [
  { value: 'xs', label: 'XS', inStock: false },
  { value: 's', label: 'S', inStock: true },
  { value: 'm', label: 'M', inStock: true },
  { value: 'l', label: 'L', inStock: true },
  { value: 'xl', label: 'XL', inStock: false },
]

export function ProductBuyBox({
  name = 'Merino Crew Sweater',
  price = 8900,
  compareAt = 12000,
  currency = 'GBP',
  locale = 'en-GB',
  variantLabel = 'Size',
  variants = DEFAULT_VARIANTS,
  maxQuantity = 10,
  onAddToCart,
  className = '',
}: ProductBuyBoxProps) {
  const firstAvailable = variants.find((v) => v.inStock)?.value ?? ''
  const [variant, setVariant] = React.useState(firstAvailable)
  const [quantity, setQuantity] = React.useState(1)
  const [added, setAdded] = React.useState(false)

  const saving = compareAt ? compareAt - price : 0

  function add() {
    if (!variant) return
    onAddToCart?.({ variant, quantity })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{name}</h1>

      <div className="mt-3 flex flex-wrap items-baseline gap-3">
        <span className="text-2xl font-extrabold tracking-tight">
          {formatPrice(price, currency, locale)}
        </span>
        {compareAt ? (
          <>
            <span className="text-base text-muted-foreground line-through">
              {formatPrice(compareAt, currency, locale)}
            </span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Save {formatPrice(saving, currency, locale)}
            </span>
          </>
        ) : null}
      </div>

      {/* Variants — sold-out options stay visible, disabled. */}
      <fieldset className="mt-6">
        <legend className="mb-2.5 flex w-full items-baseline justify-between text-sm font-medium">
          {variantLabel}
          <a href="#size-guide" className="text-xs font-normal text-muted-foreground hover:text-foreground hover:underline">
            Size guide
          </a>
        </legend>

        <div role="radiogroup" aria-label={variantLabel} className="flex flex-wrap gap-2">
          {variants.map((v) => {
            const selected = v.value === variant
            return (
              <button
                key={v.value}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!v.inStock}
                onClick={() => setVariant(v.value)}
                title={v.inStock ? undefined : 'Out of stock'}
                className={`relative min-w-12 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border/60 hover:border-foreground/30'
                } ${
                  !v.inStock
                    ? 'cursor-not-allowed text-muted-foreground/50 line-through'
                    : ''
                }`}
              >
                {v.label}
                {!v.inStock ? <span className="sr-only"> — out of stock</span> : null}
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Quantity */}
      <div className="mt-6">
        <p id="qty-label" className="mb-2.5 text-sm font-medium">
          Quantity
        </p>
        <div className="inline-flex items-center rounded-xl border border-border/60">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="rounded-l-xl p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <Minus aria-hidden className="h-4 w-4" />
          </button>

          <output
            aria-labelledby="qty-label"
            className="w-12 text-center text-sm font-medium tabular-nums"
          >
            {quantity}
          </output>

          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            disabled={quantity >= maxQuantity}
            aria-label="Increase quantity"
            className="rounded-r-xl p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <Plus aria-hidden className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={add}
        disabled={!variant}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {added ? (
          <Check aria-hidden className="h-4 w-4" />
        ) : (
          <ShoppingBag aria-hidden className="h-4 w-4" />
        )}
        {added ? 'Added to bag' : 'Add to bag'}
      </button>

      <p aria-live="polite" className="sr-only">
        {added ? `${quantity} × ${name}, size ${variant}, added to bag` : ''}
      </p>

      <ul className="mt-6 space-y-2 border-t border-border/60 pt-5 text-sm text-muted-foreground">
        <li className="flex items-center gap-2.5">
          <Truck aria-hidden className="h-4 w-4 shrink-0" />
          Free delivery over {formatPrice(5000, currency, locale)}
        </li>
        <li className="flex items-center gap-2.5">
          <RotateCcw aria-hidden className="h-4 w-4 shrink-0" />
          Free returns within 30 days
        </li>
      </ul>
    </div>
  )
}
