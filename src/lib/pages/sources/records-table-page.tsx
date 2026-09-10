/**
 * The table screen, with the five things that happen to a table once real
 * people use it.
 *
 * `customers-table-page` next door is a table that works. This is the one
 * that has been lived in: columns someone rearranged, rows someone selected
 * a thousand of, groups with subtotals, cells edited in place, and a filter
 * set that returned nothing.
 *
 * The order follows a session rather than a taxonomy: shape the table,
 * act on it, read it, edit it, then look at one row closely.
 *
 *   column manager   reordering that works from the keyboard, not only by
 *                    drag — the accessibility failure most grids ship with
 *   bulk actions     and the question most selection bars skip: this page,
 *                    or all 1,284 rows the filter matched?
 *   grouped rows     subtotals that survive collapsing, so a folded group
 *                    still says something
 *   inline edit      staged changes with the original kept beside the new
 *   expandable       a row opened into a full-width panel
 *   empty            what the same table looks like when the filters have
 *                    excluded everything
 *
 * The empty state sits between the table and its filters on purpose. A list
 * emptied by its own filters is the one empty state that must not offer
 * "create your first record" — the records exist, the filters are hiding
 * them — and putting it directly above <FilterDrawerFacets> makes the
 * relationship the argument rather than a caption.
 *
 * <DrawerRecordDetail> is last because it is the one surface here that is
 * not the table: a non-modal drawer keeps the list on screen, and its
 * previous/next controls mean a person reviewing thirty records never
 * returns to the grid at all.
 */

import * as React from 'react'
import { DataTableColumnManager } from '@/lib/blocks/sources/data-table-column-manager'
import { DataTableBulkActions } from '@/lib/blocks/sources/data-table-bulk-actions'
import { DataTableGroupedRows } from '@/lib/blocks/sources/data-table-grouped-rows'
import { DataTableInlineEdit } from '@/lib/blocks/sources/data-table-inline-edit'
import { DataTableExpandable } from '@/lib/blocks/sources/data-table-expandable'
import { EmptyFilteredResults } from '@/lib/blocks/sources/empty-filtered-results'
import { FilterDrawerFacets } from '@/lib/blocks/sources/filter-drawer-facets'
import { DrawerRecordDetail } from '@/lib/blocks/sources/drawer-record-detail'

export default function RecordsTablePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-6xl px-6 pb-2 pt-12">
        <h1 className="text-2xl font-bold tracking-tight">Records</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A table after it has been lived in — reordered, selected, grouped,
          edited, and filtered down to nothing.
        </p>
      </section>

      <DataTableColumnManager />
      <DataTableBulkActions />
      <DataTableGroupedRows />
      <DataTableInlineEdit />
      <DataTableExpandable />

      {/* Empty, then the filters that emptied it. */}
      <EmptyFilteredResults />
      <FilterDrawerFacets />

      <DrawerRecordDetail />
    </main>
  )
}
