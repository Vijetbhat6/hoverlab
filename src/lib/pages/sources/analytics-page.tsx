/**
 * The analytics screen, arranged so the controls that change every number
 * on it come before the numbers.
 *
 * `dashboard-overview` is the glanceable version — cards, a feed, a header.
 * This is the one someone actually works in, and the difference is entirely
 * about the two controls at the top.
 *
 * <DashboardSavedViews> and <DashboardComparisonPeriod> are first because
 * every chart below them is meaningless without knowing which window is
 * being shown and what it is being compared against. A dashboard that puts
 * its date picker in a corner produces a specific, repeatable mistake:
 * someone reads a 40% rise, screenshots it, and finds out later they were
 * comparing four weeks against three.
 *
 * Then the numbers, in decreasing altitude:
 *
 *   kpi band      the four figures the meeting is about
 *   sparklines    the same figures with their direction
 *   line chart    one metric over a year, with the axis printed
 *   donut         where a single total went
 *   funnel        where people fell out, led by the step-to-step rate
 *   heatmap       a year of days, so seasonality is visible at all
 *
 * The funnel is deliberately after the donut even though both are
 * breakdowns. A donut answers "of the whole, how much"; a funnel answers
 * "between two steps, how many survived", and the second question only
 * makes sense once someone has the total in their head.
 *
 * Nothing here loads a charting library. Every chart on this page is inline
 * SVG or a conic gradient, which is the reason a page with six of them is
 * still a page and not a bundle.
 */

import * as React from 'react'
import { DashboardSavedViews } from '@/lib/blocks/sources/dashboard-saved-views'
import { DashboardComparisonPeriod } from '@/lib/blocks/sources/dashboard-comparison-period'
import { KpiSummaryBand } from '@/lib/blocks/sources/kpi-summary-band'
import { MetricSparklineCards } from '@/lib/blocks/sources/metric-sparkline-cards'
import { LineChartPanel } from '@/lib/blocks/sources/line-chart-panel'
import { DonutBreakdown } from '@/lib/blocks/sources/donut-breakdown'
import { FunnelConversionPanel } from '@/lib/blocks/sources/funnel-conversion-panel'
import { ActivityHeatmap } from '@/lib/blocks/sources/activity-heatmap'

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-6xl px-6 pb-2 pt-12">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The window and the comparison first, because every figure below
          them depends on both.
        </p>
      </section>

      <DashboardSavedViews />
      <DashboardComparisonPeriod />

      <KpiSummaryBand />
      <MetricSparklineCards />
      <LineChartPanel />
      <DonutBreakdown />
      <FunnelConversionPanel />
      <ActivityHeatmap />
    </main>
  )
}
