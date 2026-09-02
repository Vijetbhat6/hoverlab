'use client'

/**
 * <EmptyFilteredResults> — nothing found, and the filters that caused it.
 *
 * The catalog has an empty state with a call to action and a "no search
 * results" pattern inside the search block. Neither covers the case that
 * actually happens most: a list that is empty because of four filters the
 * user set twenty minutes ago and has forgotten about.
 *
 * WHY THAT DESERVES ITS OWN BLOCK
 *
 * The generic empty state says "No results — try a different search", which
 * is advice, and unhelpful advice at that. The user does not need to be
 * told to change something; they need to be told *what is currently
 * excluding everything*, and given a one-click way to remove it. Those are
 * different components with different content, and shipping the first where
 * the second belongs is why people abandon filtered views.
 *
 * THE NARROWEST FILTER IS OFFERED FIRST
 *
 * Removing filters one at a time in the order they were applied is guessing.
 * When the caller knows how many results each filter would restore, the
 * chips are ordered by that number, so the first thing offered is the one
 * most likely to fix it. That ordering is the entire value of this block
 * over a list of chips with an × on each.
 *
 * "CLEAR ALL" IS NOT THE PRIMARY ACTION. It is available and it is second,
 * because clearing everything throws away work the user did on purpose —
 * and after clearing they are looking at an unfiltered list they never
 * asked for.
 *
 * ACCESSIBILITY: the region is `role="status"` so the transition into
 * emptiness is announced; each chip's button names the filter it removes
 * rather than being an unlabelled ×.
 */

import * as React from 'react'
import { FilterX, RotateCcw, SearchX, X } from 'lucide-react'

export interface ActiveFilter {
  id: string
  /** Facet name, e.g. "Status". */
  field: string
  /** Chosen value, e.g. "Archived". */
  value: string
  /**
   * Results that would come back if this one filter were removed.
   *
   * Optional because a caller that cannot cheaply compute it should not be
   * forced to lie — when it is absent the chips keep their given order and
   * no count is shown.
   */
  restores?: number
}

export interface EmptyFilteredResultsProps {
  filters?: ActiveFilter[]
  /** Total rows before any filtering. */
  totalUnfiltered?: number
  query?: string
  className?: string
}

const DEFAULT_FILTERS: ActiveFilter[] = [
  { id: 'status', field: 'Status', value: 'Archived', restores: 148 },
  { id: 'owner', field: 'Owner', value: 'Jordan Lee', restores: 12 },
  { id: 'plan', field: 'Plan', value: 'Enterprise', restores: 31 },
  { id: 'created', field: 'Created', value: 'Last 7 days', restores: 96 },
]

export function EmptyFilteredResults({
  filters = DEFAULT_FILTERS,
  totalUnfiltered = 1_284,
  query = 'renewal',
  className = '',
}: EmptyFilteredResultsProps) {
  const [active, setActive] = React.useState(filters)

  const remove = (id: string) => setActive((current) => current.filter((f) => f.id !== id))

  /*
   * Sorted by what each removal would bring back, biggest first. `restores`
   * is optional, so anything without a count keeps its position at the end
   * rather than sorting as zero and jumping to the front.
   */
  const ordered = [...active].sort((a, b) => (b.restores ?? -1) - (a.restores ?? -1))
  const best = ordered.find((filter) => filter.restores !== undefined)

  return (
    <section
      role="status"
      className={`rounded-2xl border border-border bg-card p-8 text-center text-card-foreground sm:p-12 ${className}`}
    >
      <span
        aria-hidden
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted"
      >
        <SearchX className="h-5 w-5 text-muted-foreground" />
      </span>

      <h2 className="mt-5 text-lg font-semibold">No results match these filters</h2>

      <p className="mx-auto mt-2 max-w-md text-pretty text-sm text-muted-foreground">
        {query ? (
          <>
            Nothing matched <span className="font-medium text-foreground">“{query}”</span> with{' '}
          </>
        ) : (
          'Nothing matched with '
        )}
        {active.length} {active.length === 1 ? 'filter' : 'filters'} applied.{' '}
        {totalUnfiltered.toLocaleString('en-US')} records exist in total.
      </p>

      {/* The filters themselves, which is the content the generic empty
          state does not have. */}
      {active.length > 0 ? (
        <>
          <ul className="mx-auto mt-6 flex max-w-lg flex-wrap justify-center gap-2">
            {ordered.map((filter) => (
              <li key={filter.id}>
                <button
                  type="button"
                  onClick={() => remove(filter.id)}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-background py-1 ps-3 pe-1.5 text-sm transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="text-muted-foreground">{filter.field}:</span>
                  <span className="font-medium">{filter.value}</span>
                  {filter.restores !== undefined ? (
                    <span className="text-xs text-muted-foreground">
                      +{filter.restores.toLocaleString('en-US')}
                    </span>
                  ) : null}
                  <span
                    aria-hidden
                    className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors group-hover:bg-muted group-hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </span>
                  <span className="sr-only">
                    Remove the {filter.field} filter
                    {filter.restores !== undefined
                      ? `, which would show ${filter.restores} results`
                      : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {best ? (
              <button
                type="button"
                onClick={() => remove(best.id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <FilterX aria-hidden className="h-4 w-4" />
                Remove “{best.field}: {best.value}”
                <span className="font-normal opacity-80">
                  — {best.restores?.toLocaleString('en-US')} results
                </span>
              </button>
            ) : null}

            {/* Second, deliberately. Clearing everything discards work. */}
            <button
              type="button"
              onClick={() => setActive([])}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RotateCcw aria-hidden className="h-4 w-4" />
              Clear all filters
            </button>
          </div>
        </>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          All filters cleared — showing every record.
        </p>
      )}
    </section>
  )
}
