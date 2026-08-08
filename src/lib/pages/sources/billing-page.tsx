/**
 * The billing screen — plan, usage, invoices.
 *
 * Ordered by the question a user arrived with. "What am I paying" comes
 * first; "why" comes second, because usage only means something once the
 * plan's limits are on screen; "what have I paid before" comes last, since
 * history is a lookup rather than a check.
 *
 * The usage panel is given the upgrade link rather than the plan panel.
 * Upgrade prompts land when a user is looking at a bar that is nearly full,
 * not when they are looking at a card that says what they already chose.
 */

import * as React from 'react'
import { DashboardShell } from '@/lib/blocks/sources/dashboard-shell'
import { DashboardPageHeader } from '@/lib/blocks/sources/dashboard-page-header'
import { BillingPlanSummary } from '@/lib/blocks/sources/billing-plan-summary'
import { UsageMeterPanel } from '@/lib/blocks/sources/usage-meter-panel'
import { InvoiceHistoryTable } from '@/lib/blocks/sources/invoice-history-table'

export default function BillingPage() {
  return (
    <DashboardShell activeLabel="Settings">
      <DashboardPageHeader
        title="Billing"
        description="Your plan, what you have used, and everything you have been charged."
        crumbs={[{ label: 'Settings', href: '#' }, { label: 'Billing' }]}
        tabs={[]}
        primaryAction={undefined}
        secondaryAction={{ label: 'Download all invoices' }}
      />

      <div className="mt-6 space-y-6">
        <BillingPlanSummary />

        {/* Upgrade prompt lives here — beside a bar that is nearly full. */}
        <UsageMeterPanel upgradeHref="/pricing" />

        <InvoiceHistoryTable />
      </div>
    </DashboardShell>
  )
}
