'use client'

/**
 * <SearchFacetedResults> — the whole faceted search, assembled.
 *
 * This catalog already ships the parts: `search-facet-panel` (options with
 * counts, zeroes included), `applied-filters-bar` (what is on, removable),
 * `search-results-panel`, `empty-filtered-results`. Every one of them is
 * correct in isolation, and a visitor holding four correct parts still has to
 * work out how they compose. This is the composition, and composing them
 * raises three questions none of the parts can answer alone.
 *
 * ONE: WHERE DOES THE RESULT COUNT LIVE
 *
 * Above the results, beside the sort, phrased as a sentence with the query in
 * it — not in the page title and not inside the facet rail. It is the answer
 * to "did that filter do anything", so it must sit where the eye lands after
 * a click, and it must be a live region because refining does not reload.
 *
 * TWO: WHAT HAPPENS ON A NARROW SCREEN
 *
 * The rail becomes a button that says how many filters are on, and the panel
 * opens over the results. Collapsing the rail into an accordion above the
 * results is the common alternative and it is worse: it pushes the results
 * off the screen, so refining and seeing the effect become two scrolls apart.
 *
 * THREE: WHAT ORDERING MEANS ONCE FILTERS EXIST
 *
 * Relevance is meaningless with no query, so the sort defaults to relevance
 * only while there is one and falls back to newest otherwise. A sort control
 * offering "Relevance" against an empty query is offering to rank by nothing.
 *
 * THE RESULTS ARE FILTERED FOR REAL. The demo does the intersection —
 * OR within a facet, AND across facets — because a faceted-search block whose
 * chips do not change the list is a picture of a faceted search.
 *
 * ACCESSIBILITY: the rail is a `<nav>`-less `<aside>` of `<fieldset>`s (a
 * filter is a form control, not navigation); the count is `aria-live="polite"`;
 * removing a chip returns focus to the results heading rather than nowhere,
 * which is what happens when the focused element is removed from the DOM.
 */

import * as React from 'react'
import { Search, SlidersHorizontal, Star, X } from 'lucide-react'

export interface FacetGroup {
  id: string
  label: string
  options: { id: string; label: string }[]
}

export interface FacetedItem {
  id: string
  title: string
  vendor: string
  price: string
  rating: number
  reviews: number
  added: number
  /** facet id → option id */
  attrs: Record<string, string>
}

export interface SearchFacetedResultsProps {
  facets?: FacetGroup[]
  items?: FacetedItem[]
  className?: string
}

const DEFAULT_FACETS: FacetGroup[] = [
  {
    id: 'type',
    label: 'Type',
    options: [
      { id: 'chair', label: 'Task chairs' },
      { id: 'desk', label: 'Sit-stand desks' },
      { id: 'light', label: 'Task lighting' },
    ],
  },
  {
    id: 'material',
    label: 'Material',
    options: [
      { id: 'mesh', label: 'Mesh' },
      { id: 'oak', label: 'Solid oak' },
      { id: 'steel', label: 'Powder-coated steel' },
    ],
  },
  {
    id: 'lead',
    label: 'Lead time',
    options: [
      { id: 'stock', label: 'In stock' },
      { id: 'two', label: '2 weeks' },
      { id: 'six', label: '6 weeks' },
    ],
  },
]

const DEFAULT_ITEMS: FacetedItem[] = [
  { id: '1', title: 'Meridian task chair', vendor: 'Northwind', price: '£420', rating: 4.6, reviews: 128, added: 3, attrs: { type: 'chair', material: 'mesh', lead: 'stock' } },
  { id: '2', title: 'Meridian chair, oak base', vendor: 'Northwind', price: '£515', rating: 4.4, reviews: 41, added: 12, attrs: { type: 'chair', material: 'oak', lead: 'two' } },
  { id: '3', title: 'Kestrel sit-stand desk', vendor: 'Contoso', price: '£790', rating: 4.8, reviews: 302, added: 1, attrs: { type: 'desk', material: 'oak', lead: 'six' } },
  { id: '4', title: 'Kestrel desk, steel frame', vendor: 'Contoso', price: '£690', rating: 4.2, reviews: 87, added: 22, attrs: { type: 'desk', material: 'steel', lead: 'stock' } },
  { id: '5', title: 'Halo task lamp', vendor: 'Fabrikam', price: '£145', rating: 4.1, reviews: 56, added: 8, attrs: { type: 'light', material: 'steel', lead: 'stock' } },
  { id: '6', title: 'Halo lamp, mesh shade', vendor: 'Fabrikam', price: '£165', rating: 3.9, reviews: 18, added: 30, attrs: { type: 'light', material: 'mesh', lead: 'two' } },
]

type Selection = Record<string, string[]>

export function SearchFacetedResults({
  facets = DEFAULT_FACETS,
  items = DEFAULT_ITEMS,
  className = '',
}: SearchFacetedResultsProps) {
  const uid = React.useId()
  const [query, setQuery] = React.useState('chair')
  const [selection, setSelection] = React.useState<Selection>({ material: ['mesh'] })
  const [sort, setSort] = React.useState<'relevance' | 'newest' | 'rating'>('relevance')
  const [railOpen, setRailOpen] = React.useState(false)
  const headingRef = React.useRef<HTMLHeadingElement>(null)

  // OR within a facet, AND across facets — the standard, and the reason the
  // counts inside one facet do not sum to the result total.
  const matched = React.useMemo(
    () =>
      items.filter((item) => {
        if (query && !item.title.toLowerCase().includes(query.toLowerCase())) return false
        return Object.entries(selection).every(
          ([facet, chosen]) => chosen.length === 0 || chosen.includes(item.attrs[facet] ?? ''),
        )
      }),
    [items, query, selection],
  )

  const results = React.useMemo(() => {
    const copy = [...matched]
    if (sort === 'newest') return copy.sort((a, b) => a.added - b.added)
    if (sort === 'rating') return copy.sort((a, b) => b.rating - a.rating)
    return copy
  }, [matched, sort])

  // Counts are computed against every OTHER facet, which is what makes a
  // count a promise rather than a guess.
  function countFor(facetId: string, optionId: string) {
    return items.filter((item) => {
      if (query && !item.title.toLowerCase().includes(query.toLowerCase())) return false
      if (item.attrs[facetId] !== optionId) return false
      return Object.entries(selection).every(
        ([f, chosen]) => f === facetId || chosen.length === 0 || chosen.includes(item.attrs[f] ?? ''),
      )
    }).length
  }

  const chips = Object.entries(selection).flatMap(([facetId, chosen]) =>
    chosen.map((optionId) => ({
      facetId,
      optionId,
      label:
        facets
          .find((f) => f.id === facetId)
          ?.options.find((o) => o.id === optionId)?.label ?? optionId,
    })),
  )

  function toggle(facetId: string, optionId: string) {
    setSelection((s) => {
      const current = s[facetId] ?? []
      return {
        ...s,
        [facetId]: current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      }
    })
  }

  function removeChip(facetId: string, optionId: string) {
    toggle(facetId, optionId)
    // The chip that had focus is gone; without this, focus falls to <body>.
    headingRef.current?.focus()
  }

  const rail = (
    <div className="space-y-5">
      {facets.map((facet) => (
        <fieldset key={facet.id} className="border-0 p-0">
          <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {facet.label}
          </legend>
          <div className="mt-2 space-y-1.5">
            {facet.options.map((option) => {
              const count = countFor(facet.id, option.id)
              const checked = (selection[facet.id] ?? []).includes(option.id)
              const id = `${uid}-${facet.id}-${option.id}`
              return (
                <div key={option.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={id}
                    checked={checked}
                    disabled={count === 0 && !checked}
                    onChange={() => toggle(facet.id, option.id)}
                    className="h-4 w-4 rounded border-border accent-primary disabled:opacity-40"
                  />
                  <label
                    htmlFor={id}
                    className={`flex flex-1 items-center justify-between gap-2 text-sm ${
                      count === 0 && !checked ? 'text-muted-foreground/60' : ''
                    }`}
                  >
                    {option.label}
                    <span className="text-xs text-muted-foreground">{count}</span>
                  </label>
                </div>
              )
            })}
          </div>
        </fieldset>
      ))}
    </div>
  )

  return (
    <section className={`bg-background px-4 py-10 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-5xl">
        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className="relative"
        >
          <label htmlFor={`${uid}-q`} className="sr-only">
            Search the catalogue
          </label>
          {/* start-3, not left-3: the input reserves its room with ps-9, and
              in Arabic that room is on the other side. */}
          <Search
            aria-hidden
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id={`${uid}-q`}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 6 products"
            className="w-full rounded-xl border border-border bg-card py-2.5 pe-3 ps-9 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
          />
        </form>

        <div className="mt-6 grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <aside aria-label="Refine results" className="hidden lg:block">
            {rail}
          </aside>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2
                ref={headingRef}
                tabIndex={-1}
                aria-live="polite"
                className="text-sm outline-none"
              >
                <span className="font-semibold">{results.length}</span>{' '}
                {results.length === 1 ? 'result' : 'results'}
                {query ? (
                  <>
                    {' '}
                    for <span className="font-semibold">&ldquo;{query}&rdquo;</span>
                  </>
                ) : null}
              </h2>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRailOpen((v) => !v)}
                  aria-expanded={railOpen}
                  aria-controls={`${uid}-rail`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <SlidersHorizontal aria-hidden className="h-3.5 w-3.5" />
                  Filters
                  {chips.length > 0 ? (
                    <span className="rounded bg-primary/15 px-1 text-primary">
                      {chips.length}
                    </span>
                  ) : null}
                </button>

                <label htmlFor={`${uid}-sort`} className="sr-only">
                  Sort results
                </label>
                <select
                  id={`${uid}-sort`}
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {/* Relevance is only offered while there is a query to be
                      relevant to. */}
                  {query ? <option value="relevance">Relevance</option> : null}
                  <option value="newest">Newest</option>
                  <option value="rating">Best rated</option>
                </select>
              </div>
            </div>

            {chips.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <li key={`${chip.facetId}-${chip.optionId}`}>
                    <button
                      type="button"
                      onClick={() => removeChip(chip.facetId, chip.optionId)}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-1 pe-1.5 ps-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {chip.label}
                      <X aria-hidden className="h-3 w-3" />
                      <span className="sr-only">Remove filter</span>
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setSelection({})
                      headingRef.current?.focus()
                    }}
                    className="rounded-full px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Clear all
                  </button>
                </li>
              </ul>
            ) : null}

            {railOpen ? (
              <div
                id={`${uid}-rail`}
                className="mt-4 rounded-xl border border-border bg-card p-4 lg:hidden"
              >
                {rail}
              </div>
            ) : null}

            {results.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
                <p className="text-sm font-medium">Nothing matches all of those.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Remove a filter above — the counts show which one is doing it.
                </p>
              </div>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {results.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <h3 className="text-sm font-semibold">
                      <a href="#" className="outline-none focus-visible:underline">
                        {item.title}
                      </a>
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.vendor}</p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{item.price}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Star aria-hidden className="h-3.5 w-3.5 fill-current text-amber-500" />
                        {item.rating.toFixed(1)}
                        <span className="sr-only"> out of 5, </span>
                        <span aria-hidden>·</span>
                        {item.reviews} reviews
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
