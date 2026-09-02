'use client'

/**
 * <DataTableToolbar> — search, filter chips and a view switch.
 *
 * The row that sits above a table and does the work nobody budgets for.
 *
 * Active filters render as removable chips rather than staying hidden
 * inside dropdowns. A filtered table that looks identical to an unfiltered
 * one is how users conclude their data has vanished — the chips, and the
 * "Clear all" beside them, are the fix.
 *
 * The search input is `type="search"` with a label, so it gets the native
 * clear affordance and is announced as a search field.
 */

import * as React from 'react'
import { Search, SlidersHorizontal, X, LayoutGrid, List, Plus } from 'lucide-react'

export interface FilterChip {
  id: string
  label: string
  value: string
}

export interface DataTableToolbarProps {
  placeholder?: string
  initialFilters?: FilterChip[]
  resultCount?: number
  onSearch?: (term: string) => void
  onFiltersChange?: (filters: FilterChip[]) => void
  className?: string
}

const DEFAULT_FILTERS: FilterChip[] = [
  { id: 'status', label: 'Status', value: 'Active' },
  { id: 'plan', label: 'Plan', value: 'Pro or Team' },
]

export function DataTableToolbar({
  placeholder = 'Search customers',
  initialFilters = DEFAULT_FILTERS,
  resultCount = 2847,
  onSearch,
  onFiltersChange,
  className = '',
}: DataTableToolbarProps) {
  // Per-instance ids. A literal id in a reusable component is a
  // collision waiting for the second copy on the page — and a <label>
  // then resolves to whichever input rendered first.
  const uid = React.useId()
  const [term, setTerm] = React.useState('')
  const [filters, setFilters] = React.useState<FilterChip[]>(initialFilters)
  const [view, setView] = React.useState<'list' | 'grid'>('list')

  function updateFilters(next: FilterChip[]) {
    setFilters(next)
    onFiltersChange?.(next)
  }

  function handleSearch(value: string) {
    setTerm(value)
    onSearch?.(value)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <label htmlFor={`${uid}-table-search`} className="sr-only">
            {placeholder}
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id={`${uid}-table-search`}
            type="search"
            value={term}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-border/60 bg-background py-2 ps-9 pe-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <SlidersHorizontal aria-hidden className="h-4 w-4" />
            Filters
            {filters.length > 0 ? (
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-xs font-semibold text-primary">
                {filters.length}
              </span>
            ) : null}
          </button>

          {/* View switch — a radio group, since the options are exclusive. */}
          <div
            role="radiogroup"
            aria-label="View mode"
            className="flex rounded-xl border border-border/60 bg-background p-0.5"
          >
            {(
              [
                { id: 'list', icon: <List className="h-4 w-4" />, label: 'List' },
                { id: 'grid', icon: <LayoutGrid className="h-4 w-4" />, label: 'Grid' },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={view === option.id}
                aria-label={`${option.label} view`}
                onClick={() => setView(option.id)}
                className={`rounded-lg p-1.5 transition-colors ${
                  view === option.id
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {option.icon}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus aria-hidden className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      {/* Active filters — never leave a filtered table looking unfiltered. */}
      {filters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtered by</span>

          {filters.map((filter) => (
            <span
              key={filter.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs"
            >
              <span className="text-muted-foreground">{filter.label}:</span>
              <span className="font-medium">{filter.value}</span>
              <button
                type="button"
                onClick={() => updateFilters(filters.filter((f) => f.id !== filter.id))}
                aria-label={`Remove ${filter.label} filter`}
                className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X aria-hidden className="h-3 w-3" />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={() => updateFilters([])}
            className="text-xs font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            Clear all
          </button>

          <span aria-live="polite" className="ms-auto text-xs text-muted-foreground">
            {resultCount.toLocaleString('en-US')} results
          </span>
        </div>
      ) : null}
    </div>
  )
}
