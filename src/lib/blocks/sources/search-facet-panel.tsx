'use client'

/**
 * <SearchFacetPanel> — refinement with counts, including the zeroes.
 *
 * The catalog has a product filter sidebar and an applied-filters bar. This
 * is the third piece and the one that makes faceted search usable rather
 * than merely present: the panel that shows how many results each option
 * would leave, before it is clicked.
 *
 * THE ZERO-COUNT DECISION
 *
 * Every faceted search has to choose what to do with an option that would
 * return nothing. Hiding it makes the list shorter and makes the facet
 * *look different every time you refine*, which is disorienting — options
 * vanish and reappear as you click around. Showing it disabled keeps the
 * list stable and tells you the option exists but is excluded by something
 * else. This shows them, greyed and unclickable, and that is a deliberate
 * choice rather than an oversight.
 *
 * MULTI-SELECT WITHIN A FACET, AND WHY THE COUNTS LOOK ODD
 *
 * Within one facet the options are OR-ed — picking Blue and Green shows
 * both — while separate facets are AND-ed. That is what every good search
 * does and what makes the counts within a facet not sum to the result
 * total. A note says so, because the alternative is a support ticket.
 *
 * COLLAPSING REMEMBERS. A facet the user collapsed stays collapsed as they
 * refine; nothing here springs back open on re-render.
 *
 * ACCESSIBILITY: each facet is a `<fieldset>` with a `<legend>` inside a
 * disclosure whose button carries both `aria-expanded` and `aria-controls`
 * — the audit flags the first without the second. Counts are inside each
 * checkbox's label so they are announced with the option.
 */

import * as React from 'react'
import { ChevronDown, RotateCcw } from 'lucide-react'

export interface FacetOption {
  id: string
  label: string
  /** Results remaining if this option were selected. Zero renders disabled. */
  count: number
}

export interface Facet {
  id: string
  label: string
  options: FacetOption[]
  /** Options beyond this are behind a "Show all". */
  visibleLimit?: number
}

export interface SearchFacetPanelProps {
  facets?: Facet[]
  resultCount?: number
  className?: string
}

const DEFAULT_FACETS: Facet[] = [
  {
    id: 'type',
    label: 'Type',
    options: [
      { id: 'effect', label: 'Effects', count: 973 },
      { id: 'block', label: 'Blocks', count: 194 },
      { id: 'page', label: 'Pages', count: 21 },
      { id: 'template', label: 'Templates', count: 7 },
    ],
  },
  {
    id: 'framework',
    label: 'Framework',
    options: [
      { id: 'react', label: 'React', count: 222 },
      { id: 'html', label: 'HTML + CSS', count: 973 },
      { id: 'vue', label: 'Vue', count: 973 },
      { id: 'svelte', label: 'Svelte', count: 973 },
      { id: 'angular', label: 'Angular', count: 0 },
    ],
  },
  {
    id: 'category',
    label: 'Category',
    visibleLimit: 4,
    options: [
      { id: 'buttons', label: 'Buttons', count: 59 },
      { id: 'loaders', label: 'Loaders', count: 39 },
      { id: 'cards', label: 'Cards', count: 36 },
      { id: 'text', label: 'Text', count: 38 },
      { id: 'backgrounds', label: 'Backgrounds', count: 37 },
      { id: 'nav', label: 'Navigation', count: 30 },
      { id: 'charts', label: 'Charts', count: 31 },
    ],
  },
  {
    id: 'licence',
    label: 'Licence',
    options: [
      { id: 'free', label: 'Free', count: 1_188 },
      { id: 'pro', label: 'Pro', count: 6 },
    ],
  },
]

export function SearchFacetPanel({
  facets = DEFAULT_FACETS,
  resultCount = 1_195,
  className = '',
}: SearchFacetPanelProps) {
  const [selected, setSelected] = React.useState<Record<string, string[]>>({
    type: ['block'],
  })
  const [collapsed, setCollapsed] = React.useState<string[]>([])
  const [expandedLists, setExpandedLists] = React.useState<string[]>([])

  const totalSelected = Object.values(selected).flat().length

  function toggleOption(facetId: string, optionId: string) {
    setSelected((current) => {
      const existing = current[facetId] ?? []
      const next = existing.includes(optionId)
        ? existing.filter((id) => id !== optionId)
        : [...existing, optionId]

      // An empty array and an absent key mean the same thing; keeping only
      // one of the two representations stops `totalSelected` drifting.
      const copy = { ...current }
      if (next.length === 0) delete copy[facetId]
      else copy[facetId] = next
      return copy
    })
  }

  return (
    <aside
      className={`w-full max-w-xs rounded-2xl border border-border bg-card text-card-foreground ${className}`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <h2 className="text-sm font-semibold">Refine</h2>
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {resultCount.toLocaleString('en-US')} results
          </p>
        </div>
        {totalSelected > 0 ? (
          <button
            type="button"
            onClick={() => setSelected({})}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw aria-hidden className="h-3 w-3" />
            Clear {totalSelected}
          </button>
        ) : null}
      </header>

      <div className="divide-y divide-border">
        {facets.map((facet) => {
          const open = !collapsed.includes(facet.id)
          const listId = `facet-${facet.id}`
          const limit = facet.visibleLimit ?? facet.options.length
          const showingAll = expandedLists.includes(facet.id)
          const options = showingAll ? facet.options : facet.options.slice(0, limit)
          const chosen = selected[facet.id] ?? []

          return (
            <fieldset key={facet.id} className="p-4">
              <legend className="sr-only">{facet.label}</legend>

              <button
                type="button"
                aria-expanded={open}
                aria-controls={listId}
                onClick={() =>
                  setCollapsed((current) =>
                    current.includes(facet.id)
                      ? current.filter((id) => id !== facet.id)
                      : [...current, facet.id],
                  )
                }
                className="flex w-full items-center justify-between gap-2 text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span aria-hidden>{facet.label}</span>
                <span className="sr-only">
                  {facet.label}
                  {chosen.length > 0 ? `, ${chosen.length} selected` : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  {chosen.length > 0 ? (
                    <span className="rounded-full bg-primary/10 px-1.5 text-[11px] font-semibold text-primary">
                      {chosen.length}
                    </span>
                  ) : null}
                  <ChevronDown
                    aria-hidden
                    className={`h-4 w-4 text-muted-foreground transition-transform ${open ? '' : '-rotate-90'}`}
                  />
                </span>
              </button>

              <div id={listId} hidden={!open} className="mt-3 space-y-1.5">
                {options.map((option) => {
                  const empty = option.count === 0
                  return (
                    <label
                      key={option.id}
                      className={`flex items-center gap-2.5 text-sm ${
                        empty ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={empty}
                        checked={chosen.includes(option.id)}
                        onChange={() => toggleOption(facet.id, option.id)}
                        className="h-3.5 w-3.5 accent-primary"
                      />
                      <span className="flex-1">{option.label}</span>
                      <span className="tabular-nums text-xs text-muted-foreground">
                        {option.count.toLocaleString('en-US')}
                      </span>
                    </label>
                  )
                })}

                {facet.options.length > limit ? (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedLists((current) =>
                        current.includes(facet.id)
                          ? current.filter((id) => id !== facet.id)
                          : [...current, facet.id],
                      )
                    }
                    className="pt-1 text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {showingAll ? 'Show fewer' : `Show all ${facet.options.length}`}
                  </button>
                ) : null}
              </div>
            </fieldset>
          )
        })}
      </div>

      {/* The sentence that prevents the "these numbers do not add up" ticket. */}
      <p className="border-t border-border p-4 text-xs text-muted-foreground">
        Options within one group are combined with OR; separate groups are combined
        with AND. Counts show what each option alone would leave, so they do not sum
        to the total.
      </p>
    </aside>
  )
}
