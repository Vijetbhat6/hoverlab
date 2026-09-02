'use client'

/**
 * <ProductFilterSidebar> — faceted filters for a collection page.
 *
 * Each facet group is a <fieldset> with a <legend>, which is what makes a
 * screen reader announce "Size, group" before reading the options instead
 * of reciting twelve unattached checkboxes. It is the single most-skipped
 * bit of markup in filter UIs.
 *
 * Colour swatches carry a visible label as well as the colour. A swatch row
 * that conveys its options by hue alone is unusable for anyone who cannot
 * distinguish them, and "Sage" is more precise than a green square anyway.
 *
 * The applied count and the Clear control are pinned at the top rather than
 * the bottom: after selecting four facets the user is at the top of the
 * panel, and that is where they look to undo it.
 */

import * as React from 'react'
import { X } from 'lucide-react'

export interface FacetOption {
  value: string
  label: string
  count?: number
  /** Tailwind background class, for colour facets. */
  swatch?: string
}

export interface Facet {
  id: string
  legend: string
  type: 'checkbox' | 'swatch'
  options: FacetOption[]
}

export interface ProductFilterSidebarProps {
  facets?: Facet[]
  maxPrice?: number
  currency?: string
  onChange?: (selected: Record<string, string[]>) => void
  className?: string
}

const DEFAULT_FACETS: Facet[] = [
  {
    id: 'category',
    legend: 'Category',
    type: 'checkbox',
    options: [
      { value: 'knitwear', label: 'Knitwear', count: 24 },
      { value: 'shirts', label: 'Shirts', count: 31 },
      { value: 'outerwear', label: 'Outerwear', count: 12 },
      { value: 'accessories', label: 'Accessories', count: 47 },
    ],
  },
  {
    id: 'size',
    legend: 'Size',
    type: 'checkbox',
    options: [
      { value: 's', label: 'Small', count: 62 },
      { value: 'm', label: 'Medium', count: 88 },
      { value: 'l', label: 'Large', count: 74 },
      { value: 'xl', label: 'Extra large', count: 29 },
    ],
  },
  {
    id: 'colour',
    legend: 'Colour',
    type: 'swatch',
    options: [
      { value: 'stone', label: 'Stone', swatch: 'bg-stone-400' },
      { value: 'navy', label: 'Navy', swatch: 'bg-indigo-800' },
      { value: 'sage', label: 'Sage', swatch: 'bg-emerald-600' },
      { value: 'rust', label: 'Rust', swatch: 'bg-orange-700' },
      { value: 'black', label: 'Black', swatch: 'bg-zinc-900' },
    ],
  },
]

export function ProductFilterSidebar({
  facets = DEFAULT_FACETS,
  maxPrice = 250,
  currency = '£',
  onChange,
  className = '',
}: ProductFilterSidebarProps) {
  const [selected, setSelected] = React.useState<Record<string, string[]>>({})
  const [price, setPrice] = React.useState(maxPrice)

  const appliedCount = Object.values(selected).reduce((n, list) => n + list.length, 0)

  function toggle(facetId: string, value: string) {
    setSelected((prev) => {
      const current = prev[facetId] ?? []
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]

      const updated = { ...prev, [facetId]: next }
      if (next.length === 0) delete updated[facetId]

      onChange?.(updated)
      return updated
    })
  }

  function clearAll() {
    setSelected({})
    setPrice(maxPrice)
    onChange?.({})
  }

  return (
    <aside className={`w-full ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
        <h2 className="font-semibold tracking-tight">
          Filters
          {appliedCount > 0 ? (
            <span className="ms-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
              {appliedCount}
            </span>
          ) : null}
        </h2>

        {appliedCount > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <X aria-hidden className="h-3.5 w-3.5" />
            Clear
          </button>
        ) : null}
      </div>

      <div className="divide-y divide-border/40">
        {facets.map((facet) => (
          <fieldset key={facet.id} className="py-4">
            <legend className="mb-2.5 text-sm font-medium">{facet.legend}</legend>

            {facet.type === 'swatch' ? (
              <div className="flex flex-wrap gap-2">
                {facet.options.map((option) => {
                  const checked = selected[facet.id]?.includes(option.value) ?? false
                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-colors ${
                        checked
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border/60 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(facet.id, option.value)}
                        className="sr-only"
                      />
                      <span aria-hidden className={`h-3.5 w-3.5 rounded-full ring-1 ring-border ${option.swatch}`} />
                      {/* The name, not just the colour. */}
                      {option.label}
                    </label>
                  )
                })}
              </div>
            ) : (
              <ul className="space-y-2">
                {facet.options.map((option) => {
                  const checked = selected[facet.id]?.includes(option.value) ?? false
                  return (
                    <li key={option.value}>
                      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(facet.id, option.value)}
                          className="h-4 w-4 rounded border-border/60 accent-primary"
                        />
                        <span className="flex-1 text-muted-foreground">{option.label}</span>
                        {typeof option.count === 'number' ? (
                          <span className="text-xs text-muted-foreground/60">{option.count}</span>
                        ) : null}
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </fieldset>
        ))}

        <fieldset className="py-4">
          <legend className="mb-2.5 text-sm font-medium">Maximum price</legend>
          <input
            type="range"
            min={0}
            max={maxPrice}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            aria-label="Maximum price"
            className="w-full accent-primary"
          />
          <p className="mt-1.5 text-sm text-muted-foreground">
            Up to{' '}
            <span className="font-medium text-foreground">
              {currency}
              {price}
            </span>
          </p>
        </fieldset>
      </div>
    </aside>
  )
}
