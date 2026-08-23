'use client'

/**
 * <CollectionToolbar> — result count, sort and density for a product grid.
 *
 * The result count is `aria-live="polite"`. When a filter changes, the grid
 * silently re-renders; for a screen-reader user the count is the only
 * signal anything happened, and without the live region they are left
 * arrowing through a list to find out whether it worked.
 *
 * Sort is a native <select>, not a custom dropdown. It is one of the few
 * controls where the platform version is better on every axis that matters:
 * keyboard, mobile, screen reader, and the amount of code you maintain.
 */

import * as React from 'react'
import { SlidersHorizontal, LayoutGrid, Rows3 } from 'lucide-react'

export interface SortOption {
  value: string
  label: string
}

export interface CollectionToolbarProps {
  total?: number
  sortOptions?: SortOption[]
  onSort?: (value: string) => void
  onDensity?: (density: 'comfortable' | 'compact') => void
  /** Shown on small screens to open the filter drawer. */
  onOpenFilters?: () => void
  className?: string
}

const DEFAULT_SORT: SortOption[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
]

export function CollectionToolbar({
  total = 114,
  sortOptions = DEFAULT_SORT,
  onSort,
  onDensity,
  onOpenFilters,
  className = '',
}: CollectionToolbarProps) {
  // Per-instance ids. A literal id in a reusable component is a
  // collision waiting for the second copy on the page — and a <label>
  // then resolves to whichever input rendered first.
  const uid = React.useId()
  const [density, setDensity] = React.useState<'comfortable' | 'compact'>('comfortable')

  function changeDensity(next: 'comfortable' | 'compact') {
    setDensity(next)
    onDensity?.(next)
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-3 border-b border-border/60 pb-4 ${className}`}
    >
      {/* The only feedback a filter change gives some users. */}
      <p aria-live="polite" className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{total.toLocaleString('en-GB')}</span>{' '}
        {total === 1 ? 'product' : 'products'}
      </p>

      <button
        type="button"
        onClick={onOpenFilters}
        className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted lg:hidden"
      >
        <SlidersHorizontal aria-hidden className="h-4 w-4" />
        Filters
      </button>

      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor={`${uid}-collection-sort`} className="text-sm text-muted-foreground">
            Sort
          </label>
          {/* Native select — better than any custom dropdown here. */}
          <select
            id={`${uid}-collection-sort`}
            onChange={(e) => onSort?.(e.target.value)}
            className="rounded-xl border border-border/60 bg-background px-2.5 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div
          role="radiogroup"
          aria-label="Grid density"
          className="hidden rounded-xl border border-border/60 bg-background p-0.5 sm:flex"
        >
          {(
            [
              { id: 'comfortable', icon: <LayoutGrid className="h-4 w-4" />, label: 'Comfortable' },
              { id: 'compact', icon: <Rows3 className="h-4 w-4" />, label: 'Compact' },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={density === option.id}
              aria-label={`${option.label} density`}
              onClick={() => changeDensity(option.id)}
              className={`rounded-lg p-1.5 transition-colors ${
                density === option.id
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {option.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
