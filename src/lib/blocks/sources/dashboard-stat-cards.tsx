/**
 * <DashboardStatCards> — a KPI row with period-over-period deltas.
 *
 * Two things this gets right that hand-rolled versions usually do not:
 *
 *  - Direction is an arrow *and* a colour, and "up" is not assumed to be
 *    good. Churn rising is red while revenue rising is green, so each stat
 *    declares whether an increase is positive via `higherIsBetter`.
 *  - The delta reads "+12.5% vs last month", not a bare "+12.5%". A
 *    percentage with no baseline is the most common lie on a dashboard.
 *
 * Server component — nothing here holds state.
 */

import * as React from 'react'
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, UserMinus } from 'lucide-react'

export interface Stat {
  label: string
  value: string
  /** Signed percentage change, e.g. `-2.4`. */
  delta: number
  /** False for metrics where a rise is bad — churn, latency, cost. */
  higherIsBetter?: boolean
  icon?: React.ReactNode
  /** Baseline the delta is measured against. */
  comparedTo?: string
}

export interface DashboardStatCardsProps {
  stats?: Stat[]
  className?: string
}

const DEFAULT_STATS: Stat[] = [
  {
    label: 'Monthly revenue',
    value: '$48,290',
    delta: 12.5,
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    label: 'Active users',
    value: '2,847',
    delta: 8.2,
    icon: <Users className="h-4 w-4" />,
  },
  {
    label: 'Avg. session',
    value: '4m 32s',
    delta: -3.1,
    icon: <Activity className="h-4 w-4" />,
  },
  {
    label: 'Churn rate',
    value: '1.8%',
    delta: -0.4,
    higherIsBetter: false,
    icon: <UserMinus className="h-4 w-4" />,
  },
]

export function DashboardStatCards({
  stats = DEFAULT_STATS,
  className = '',
}: DashboardStatCardsProps) {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {stats.map((stat) => {
        const rising = stat.delta >= 0
        const higherIsBetter = stat.higherIsBetter ?? true
        const good = rising === higherIsBetter

        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              {stat.icon ? (
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  {stat.icon}
                </span>
              ) : null}
            </div>

            <div className="mt-3 text-3xl font-extrabold tracking-tight">{stat.value}</div>

            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span
                className={`inline-flex items-center gap-0.5 font-semibold ${
                  good ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {rising ? (
                  <TrendingUp aria-hidden className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown aria-hidden className="h-3.5 w-3.5" />
                )}
                {rising ? '+' : ''}
                {stat.delta}%
              </span>
              <span className="text-muted-foreground">
                vs {stat.comparedTo ?? 'last month'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
