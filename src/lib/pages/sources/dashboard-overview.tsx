/**
 * The dashboard landing screen — shell, header, metrics, chart, feed.
 *
 * The composition is the lesson: the shell owns the chrome and the scroll,
 * and everything else is content passed as `children`. Nesting it the other
 * way — each panel drawing its own sidebar — is how dashboards end up with
 * three slightly different navigations.
 *
 * The information order is deliberate. Numbers first, because that is what
 * the screen is opened for; the chart second, to give the numbers shape;
 * the feed last, because "what changed" only means something once you know
 * "where things stand".
 */

import * as React from 'react'
import { DashboardShell } from '@/lib/blocks/sources/dashboard-shell'
import { DashboardPageHeader } from '@/lib/blocks/sources/dashboard-page-header'
import { DashboardStatCards } from '@/lib/blocks/sources/dashboard-stat-cards'
import { BarChartPanel } from '@/lib/blocks/sources/bar-chart-panel'
import { DashboardActivityFeed } from '@/lib/blocks/sources/dashboard-activity-feed'

export default function DashboardOverview() {
  return (
    <DashboardShell activeLabel="Overview">
      <DashboardPageHeader
        title="Overview"
        description="How the business is doing, as of a minute ago."
        crumbs={[{ label: 'Dashboard' }]}
        tabs={[]}
        secondaryAction={undefined}
      />

      <div className="mt-6 space-y-6">
        <DashboardStatCards />

        {/* Chart takes two thirds; the feed is a companion, not a peer. */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <BarChartPanel />
          </div>
          <DashboardActivityFeed viewAllHref="#" />
        </div>
      </div>
    </DashboardShell>
  )
}
