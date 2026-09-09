/**
 * A full search screen, including the state it is in most of the time.
 *
 * Search pages are designed around results and then spend most of their
 * life showing none — the visitor arrives with an empty box. So the recent
 * queries sit at the top, which is the only part of this page that is
 * useful before anything is typed, and the applied-filter bar and results
 * fill in underneath once there is a query.
 *
 * The obvious wrong answer is a hero search box on an empty canvas. It
 * looks clean in a mockup and it is the least useful arrangement in
 * practice, because it discards the one piece of context the product
 * already has: what this person searched last time.
 *
 * Facets are in a sidebar rather than above the results. A horizontal
 * filter row is fine for four facets and unusable at twelve, and the
 * direction a real product grows is always toward twelve.
 */

import * as React from 'react'
import { RecentSearchList } from '@/lib/blocks/sources/recent-search-list'
import { AppliedFiltersBar } from '@/lib/blocks/sources/applied-filters-bar'
import { SearchFacetPanel } from '@/lib/blocks/sources/search-facet-panel'
import { SearchResultsPanel } from '@/lib/blocks/sources/search-results-panel'

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* The empty state, which is the common state. */}
      <RecentSearchList />

      <AppliedFiltersBar />

      {/*
        Sidebar and results as one grid rather than two stacked sections,
        so the facets stay beside the results on a wide screen and fall
        above them on a narrow one — which is the correct order on mobile,
        where filtering happens before scrolling.
      */}
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 pb-16 lg:grid-cols-[280px_1fr]">
        <SearchFacetPanel />
        <SearchResultsPanel />
      </div>
    </main>
  )
}
