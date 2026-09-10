'use client'

/**
 * The section picker for /builder.
 *
 * ── WHY THIS ONE IS A CLIENT COMPONENT WHEN THE PAGE IS NOT ─────────────
 *
 * Everything else on /builder is a server component driven by the URL,
 * deliberately. Filtering is the exception: typing in a search box that
 * round-trips to the server per keystroke is the one interaction where the
 * URL-as-state design would be felt as lag rather than as a feature.
 *
 * So the filter lives in local state and the RESULT of choosing still does
 * not — each block is a `<Link>` to the next composition. The picker never
 * holds the page's contents, only the view over the catalog. That keeps the
 * back-button-as-undo property intact: filtering is not an edit, and does
 * not end up in history.
 *
 * ── WHY IT TAKES METADATA AND NOT THE REGISTRY ──────────────────────────
 *
 * `BLOCK_INDEX` is names, categories and tags. `BLOCK_REGISTRY` is 250
 * rendered React trees and everything they import. Importing the registry
 * from a `'use client'` module would drag the entire block catalog into the
 * client bundle to draw a list of names — the exact hazard registry.tsx's
 * own docblock describes. The previews on this page are server-rendered for
 * that reason, and this list is text.
 */

import * as React from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'

import { BLOCK_INDEX } from '@/lib/blocks/block-index'
import { BLOCK_CATEGORIES } from '@/lib/blocks/block-types'
import { appendBlock, builderHref } from '@/lib/builder/compose'
import { cn } from '@/lib/utils'

/** Categories that actually contain blocks, in taxonomy order. */
const POPULATED = BLOCK_CATEGORIES.filter((c) => BLOCK_INDEX.some((b) => b.category === c))

export function BlockPicker({
  current,
  atCapacity,
}: {
  /** The composition as it stands — what each link appends to. */
  current: string[]
  /** True when the page is full; links become inert rather than lying. */
  atCapacity: boolean
}) {
  const [query, setQuery] = React.useState('')
  const [category, setCategory] = React.useState<string>('All')

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return BLOCK_INDEX.filter((b) => {
      if (category !== 'All' && b.category !== category) return false
      if (!q) return true
      return (
        b.name.toLowerCase().includes(q) ||
        b.id.includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [query, category])

  return (
    <div className="mt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sections"
            aria-label="Search sections"
            className="h-10 w-full rounded-lg border border-border/60 bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="sr-only sm:not-sr-only">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            className="h-10 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="All">All categories</option>
            {POPULATED.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <span className="text-sm text-muted-foreground" aria-live="polite">
          {results.length} section{results.length === 1 ? '' : 's'}
        </span>
      </div>

      {atCapacity && (
        <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
          This page is full. Remove a section from the outline to add another.
        </p>
      )}

      {results.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Nothing matches “{query}”. Try a shorter word, or clear the category
          filter.
        </p>
      ) : (
        <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((b) => {
            const inPage = current.filter((id) => id === b.id).length

            const label = (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{b.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {b.category}
                    {inPage > 0 && ` · in the page${inPage > 1 ? ` ${inPage}×` : ''}`}
                  </span>
                </span>
                <Plus
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </>
            )

            const shape =
              'flex w-full items-center gap-3 rounded-xl border border-border/60 p-3 text-left'

            /*
             * At capacity the row stays visible and stops being a link. A
             * disabled-looking anchor that still navigates is worse than
             * either alternative, and hiding the catalog when the page is
             * full would read as a bug.
             */
            return (
              <li key={b.id}>
                {atCapacity ? (
                  <span className={cn(shape, 'cursor-not-allowed opacity-50')}>{label}</span>
                ) : (
                  <Link
                    href={builderHref(appendBlock(current, b.id))}
                    scroll={false}
                    className={cn(
                      shape,
                      'bg-card/40 transition-colors hover:border-border hover:bg-muted/60',
                      inPage > 0 && 'border-primary/40',
                    )}
                  >
                    {label}
                    <span className="sr-only">Add {b.name} to the page</span>
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
