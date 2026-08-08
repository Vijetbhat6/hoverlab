/**
 * A list screen — header, toolbar, table, pagination.
 *
 * The canonical CRUD page, and the one worth assembling once and reusing
 * for every resource in an app. Only the columns and the copy change
 * between "Customers", "Invoices" and "Projects"; the arrangement does not.
 *
 * Toolbar and pagination sit *outside* the table's own border so the three
 * read as one panel rather than three stacked cards — which is why the
 * table is given a borderless class here and the wrapper draws the frame.
 */

import * as React from 'react'
import { DashboardShell } from '@/lib/blocks/sources/dashboard-shell'
import { DashboardPageHeader } from '@/lib/blocks/sources/dashboard-page-header'
import { DataTableToolbar } from '@/lib/blocks/sources/data-table-toolbar'
import { DataTableSortable } from '@/lib/blocks/sources/data-table-sortable'
import { DataTablePagination } from '@/lib/blocks/sources/data-table-pagination'

export default function CustomersTablePage() {
  return (
    <DashboardShell activeLabel="Customers">
      <DashboardPageHeader />

      <div className="mt-6 space-y-4">
        <DataTableToolbar />

        {/* One frame around table + pagination, not two. */}
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60">
          <DataTableSortable className="rounded-none border-0 bg-transparent" />
          <DataTablePagination totalItems={2847} />
        </div>
      </div>
    </DashboardShell>
  )
}
