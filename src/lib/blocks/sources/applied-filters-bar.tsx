'use client'

/**
 * <AppliedFiltersBar> — what is currently being filtered, and how to undo it.
 *
 * Command & Search had the palette, the grouped results and the shortcuts
 * sheet. <FilterDrawerFacets> has the checkboxes. What nothing here had is
 * the strip that sits above a result set and answers the question people
 * actually ask, which is not "what can I filter by" but "why am I only
 * seeing four things".
 *
 * THE BUG THIS BLOCK EXISTS TO PREVENT
 *
 * A filter set inside a drawer, on a previous page, or from a URL someone
 * pasted is invisible once the drawer closes. The user sees an empty or
 * absurdly short result list and concludes the product has no data. They do
 * not think "I must have a filter on", because from where they are sitting
 * there is no evidence of one. Support tickets from this are indistinguishable
 * from real outages.
 *
 * So every active constraint is a chip, always visible, each removable on its
 * own, with one clear-all. Nothing else in the interface is allowed to be the
 * only place a filter is visible.
 *
 * THE COUNT IS PART OF THE ANSWER
 *
 * "12 of 840" says both what survived and how much was excluded. A bare "12
 * results" hides the size of the cut, which is exactly the number that tells
 * someone whether to loosen a filter or accept the answer.
 *
 * SORT IS NOT A FILTER AND IS NOT A CHIP
 *
 * A chip means "removing this shows you more". Sort changes order, never
 * membership, so putting it in the same row teaches people that removing a
 * chip might reorder their results. It sits on the other side of the bar.
 *
 * ACCESSIBILITY
 *
 * The strip is a labelled `<ul>` — "active filters, 3 items" tells someone
 * using a screen reader the state of the page in one announcement, which is
 * the same thing the chips do visually. Each remove button names its own
 * filter ("Remove filter: Status is Active") rather than saying "remove",
 * because a list of nine identical "remove" buttons is not navigable. The
 * count is a live region so it is heard as chips come off.
 */

import * as React from 'react'
import { SlidersHorizontal, X } from 'lucide-react'

export interface ActiveFilter {
  id: string
  /** The facet: "Status", "Owner", "Updated". */
  field: string
  /** The chosen value, already formatted for reading. */
  value: string
  /**
   * Whether this one can be taken off.
   *
   * Some constraints are structural — a workspace scope, a permission
   * boundary — and rendering those as removable chips promises something
   * the product cannot deliver. Shown, greyed, without an X.
   */
  locked?: boolean
}

export interface AppliedFiltersBarProps {
  filters?: ActiveFilter[]
  matched?: number
  total?: number
  sortOptions?: { value: string; label: string }[]
  onOpenFilters?: () => void
  onChange?: (remaining: ActiveFilter[]) => void
  className?: string
}

const DEFAULT_FILTERS: ActiveFilter[] = [
  { id: 'workspace', field: 'Workspace', value: 'Northwind', locked: true },
  { id: 'status', field: 'Status', value: 'Active' },
  { id: 'owner', field: 'Owner', value: 'Priya Raman' },
  { id: 'updated', field: 'Updated', value: 'Last 30 days' },
  { id: 'tag', field: 'Tag', value: 'billing' },
]

const DEFAULT_SORTS = [
  { value: 'recent', label: 'Recently updated' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'created', label: 'Newest first' },
]

export function AppliedFiltersBar({
  filters = DEFAULT_FILTERS,
  matched = 12,
  total = 840,
  sortOptions = DEFAULT_SORTS,
  onOpenFilters,
  onChange,
  className = '',
}: AppliedFiltersBarProps) {
  const [active, setActive] = React.useState(filters)
  const [sort, setSort] = React.useState(sortOptions[0]?.value ?? '')

  const removable = active.filter((f) => !f.locked)

  function remove(id: string) {
    const next = active.filter((f) => f.id !== id)
    setActive(next)
    onChange?.(next)
  }

  function clearAll() {
    const next = active.filter((f) => f.locked)
    setActive(next)
    onChange?.(next)
  }

  /*
    A stand-in count that grows as filters come off, so the demo responds
    instead of sitting still while the chips change.

    Deliberately a guess and deliberately derived rather than stored: in a
    real implementation this is the number the query returned, and nothing
    else in the component depends on it.
  */
  const removed = filters.filter((f) => !f.locked).length - removable.length
  const shown = Math.min(total, Math.round(matched * Math.pow(2.4, removed)))

  return (
    <section
      aria-labelledby="filters-bar-heading"
      className={`mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
    >
      <h2 id="filters-bar-heading" className="sr-only">
        Active filters and sorting
      </h2>

      <div className="rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={onOpenFilters}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <SlidersHorizontal aria-hidden className="h-4 w-4" />
            Filters
            {removable.length > 0 ? (
              <span className="ml-0.5 rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                {removable.length}
              </span>
            ) : null}
          </button>

          {/* Live: the number is the answer to "why so few", and it changes
              under the reader's hands. */}
          <p role="status" className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {shown.toLocaleString('en-US')}
            </span>{' '}
            of {total.toLocaleString('en-US')} projects
          </p>

          {/* Sort lives on the other side of the bar. It is not a chip
              because removing it would not show you more. */}
          <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <span className="sr-only">Sort results by</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="h-8 rounded-lg border border-field bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {active.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            <ul
              aria-label={`Active filters, ${active.length}`}
              className="flex flex-wrap items-center gap-2"
            >
              {active.map((filter) => (
                <li key={filter.id}>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg py-1 pl-2.5 text-sm ${
                      filter.locked
                        ? 'pr-2.5 bg-muted/60 text-muted-foreground'
                        : 'pr-1 bg-muted text-foreground'
                    }`}
                  >
                    <span className="text-muted-foreground">{filter.field}:</span>
                    <span className="font-medium">{filter.value}</span>
                    {filter.locked ? null : (
                      <button
                        type="button"
                        onClick={() => remove(filter.id)}
                        className="rounded p-0.5 text-muted-foreground transition hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <X aria-hidden className="h-3.5 w-3.5" />
                        {/* Named, because nine "remove" buttons are not
                            navigable. */}
                        <span className="sr-only">
                          Remove filter: {filter.field} is {filter.value}
                        </span>
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {removable.length > 0 ? (
              <button
                type="button"
                onClick={clearAll}
                className="ml-1 rounded text-sm font-medium text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Clear all
              </button>
            ) : null}
          </div>
        ) : (
          <p className="px-4 py-3 text-sm text-muted-foreground">
            No filters applied — you are seeing everything.
          </p>
        )}
      </div>
    </section>
  )
}
