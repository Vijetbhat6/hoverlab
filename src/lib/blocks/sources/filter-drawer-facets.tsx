'use client'

/**
 * <FilterDrawerFacets> — faceted filters, with the two things that make
 * them usable at scale.
 *
 *  - Counts on every option, and zero-result options disabled rather than
 *    hidden. Hiding them makes the list jump as selections change, so a
 *    user loses the option they were reaching for; disabling keeps the
 *    layout still and says why the option is unavailable.
 *
 *  - Pending vs applied. On a small list, filtering as you click is right.
 *    On a slow query it is four round trips and three discarded result
 *    sets, so this drawer keeps a pending selection and applies it on a
 *    button — with the count of what changed on the button itself, which
 *    is the affordance that makes the delay feel deliberate rather than
 *    broken.
 *
 * The applied set is a `Record<string, string[]>` rather than a flat list,
 * because filters within one facet are OR and filters across facets are
 * AND. That is what every faceted search means and it cannot be expressed
 * by a flat array of selected ids.
 */

import * as React from 'react'
import { X, Check, SlidersHorizontal } from 'lucide-react'

export interface FacetOption {
  id: string
  label: string
  /** Matching records. 0 disables the option — see the note above. */
  count: number
}

export interface Facet {
  id: string
  label: string
  options: FacetOption[]
}

export type Selection = Record<string, string[]>

export interface FilterDrawerFacetsProps {
  facets?: Facet[]
  /** Currently applied filters. The drawer edits a copy until Apply. */
  applied?: Selection
  onApply?: (next: Selection) => void
  onClose?: () => void
  className?: string
}

const DEFAULT_FACETS: Facet[] = [
  {
    id: 'status',
    label: 'Status',
    options: [
      { id: 'active', label: 'Active', count: 128 },
      { id: 'paused', label: 'Paused', count: 34 },
      { id: 'archived', label: 'Archived', count: 9 },
      { id: 'draft', label: 'Draft', count: 0 },
    ],
  },
  {
    id: 'plan',
    label: 'Plan',
    options: [
      { id: 'free', label: 'Free', count: 96 },
      { id: 'pro', label: 'Pro', count: 51 },
      { id: 'team', label: 'Team', count: 18 },
      { id: 'studio', label: 'Studio', count: 6 },
    ],
  },
  {
    id: 'region',
    label: 'Region',
    options: [
      { id: 'na', label: 'North America', count: 74 },
      { id: 'eu', label: 'Europe', count: 62 },
      { id: 'apac', label: 'Asia Pacific', count: 29 },
      { id: 'latam', label: 'Latin America', count: 11 },
    ],
  },
]

function countSelected(selection: Selection): number {
  return Object.values(selection).reduce((n, ids) => n + ids.length, 0)
}

/**
 * How many individual choices differ between two selections.
 *
 * Symmetric difference, not "pending minus applied": removing a filter is a
 * change the Apply button should count, and a one-directional diff reports
 * "Apply" with no number when the only edit was a deselection.
 */
export function pendingChanges(applied: Selection, pending: Selection): number {
  const keys = new Set([...Object.keys(applied), ...Object.keys(pending)])
  let changes = 0
  for (const key of keys) {
    const a = new Set(applied[key] ?? [])
    const b = new Set(pending[key] ?? [])
    for (const id of a) if (!b.has(id)) changes++
    for (const id of b) if (!a.has(id)) changes++
  }
  return changes
}

export function FilterDrawerFacets({
  facets = DEFAULT_FACETS,
  applied = { status: ['active'] },
  onApply,
  onClose,
  className,
}: FilterDrawerFacetsProps) {
  const [pending, setPending] = React.useState<Selection>(applied)

  /*
    Re-seed when the applied set changes underneath us — a filter cleared
    from a chip outside this drawer, or a saved view loaded. Without it the
    drawer keeps editing a copy of a selection that no longer exists and
    Apply silently reinstates it.
  */
  React.useEffect(() => setPending(applied), [applied])

  const toggle = (facetId: string, optionId: string) => {
    setPending((current) => {
      const ids = current[facetId] ?? []
      const next = ids.includes(optionId)
        ? ids.filter((id) => id !== optionId)
        : [...ids, optionId]
      // Drop the key entirely when it empties, so an untouched facet and a
      // fully-deselected one are the same value rather than `[]` vs absent.
      const out = { ...current }
      if (next.length) out[facetId] = next
      else delete out[facetId]
      return out
    })
  }

  const changes = pendingChanges(applied, pending)
  const selected = countSelected(pending)

  return (
    <aside
      className={`flex w-full max-w-sm flex-col rounded-2xl border border-border/60 bg-card ${className ?? ''}`}
      aria-label="Filters"
    >
      <header className="flex items-center gap-2 border-b border-border/60 px-5 py-3.5">
        <SlidersHorizontal aria-hidden className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold tracking-tight">Filters</h2>
        {selected ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {selected}
          </span>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close filters"
          className="ml-auto rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
        {facets.map((facet) => (
          <fieldset key={facet.id}>
            {/*
              A real <fieldset>/<legend>. The grouping is the semantics —
              "Status: Active, Paused" — and a <p> above a list of
              checkboxes conveys none of it to a screen reader.
            */}
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {facet.label}
            </legend>
            <div className="space-y-0.5">
              {facet.options.map((option) => {
                const checked = (pending[facet.id] ?? []).includes(option.id)
                const empty = option.count === 0
                return (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                      empty
                        ? 'cursor-not-allowed opacity-45'
                        : 'hover:bg-muted/60'
                    }`}
                    title={empty ? 'No results match this with your other filters' : undefined}
                  >
                    <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={empty}
                        onChange={() => toggle(facet.id, option.id)}
                        className="peer h-4 w-4 appearance-none rounded border border-border bg-background checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed"
                      />
                      <Check
                        aria-hidden
                        className="pointer-events-none absolute h-3 w-3 text-primary-foreground opacity-0 peer-checked:opacity-100"
                      />
                    </span>
                    <span className="flex-1">{option.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {option.count.toLocaleString('en-US')}
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <footer className="flex items-center gap-2 border-t border-border/60 px-5 py-3.5">
        <button
          type="button"
          onClick={() => setPending({})}
          disabled={!selected}
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Clear all
        </button>
        {/*
          The count is on the button. It is what makes a deliberate Apply
          read as deliberate rather than as a filter that failed to fire.
        */}
        <button
          type="button"
          onClick={() => onApply?.(pending)}
          disabled={changes === 0}
          className="ml-auto rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {changes === 0 ? 'Apply' : `Apply ${changes} change${changes === 1 ? '' : 's'}`}
        </button>
      </footer>
    </aside>
  )
}
