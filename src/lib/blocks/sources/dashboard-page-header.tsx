/**
 * <DashboardPageHeader> — title, breadcrumb, tabs and page actions.
 *
 * The strip that sits above every inner page of an admin tool. Worth having
 * as one block because the alignment is fiddly: the title and the action
 * buttons share a baseline on wide screens and must stack cleanly on
 * narrow ones, and the tab row has to sit flush with the bottom border so
 * the active indicator lands on the rule rather than floating above it.
 *
 * The active tab uses `aria-current="page"`, not just a colour change.
 */

import * as React from 'react'
import { ChevronRight, Plus, Download } from 'lucide-react'

export interface Crumb {
  label: string
  href?: string
}

export interface HeaderTab {
  label: string
  href?: string
  count?: number
}

export interface DashboardPageHeaderProps {
  title?: string
  description?: string
  crumbs?: Crumb[]
  tabs?: HeaderTab[]
  activeTab?: string
  primaryAction?: { label: string; icon?: React.ReactNode }
  secondaryAction?: { label: string; icon?: React.ReactNode }
  className?: string
}

const DEFAULT_CRUMBS: Crumb[] = [
  { label: 'Dashboard', href: '#' },
  { label: 'Customers' },
]

const DEFAULT_TABS: HeaderTab[] = [
  { label: 'All', count: 2847 },
  { label: 'Active', count: 2401 },
  { label: 'Trialing', count: 312 },
  { label: 'Churned', count: 134 },
]

export function DashboardPageHeader({
  title = 'Customers',
  description = 'Everyone who has ever signed up, and where they stand today.',
  crumbs = DEFAULT_CRUMBS,
  tabs = DEFAULT_TABS,
  activeTab = 'All',
  primaryAction = { label: 'Add customer', icon: <Plus className="h-4 w-4" /> },
  secondaryAction = { label: 'Export', icon: <Download className="h-4 w-4" /> },
  className = '',
}: DashboardPageHeaderProps) {
  return (
    <header className={`border-b border-border/60 ${className}`}>
      {crumbs.length > 0 ? (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            {crumbs.map((crumb, i) => {
              const last = i === crumbs.length - 1
              return (
                <li key={crumb.label} className="flex items-center gap-1">
                  {crumb.href && !last ? (
                    <a href={crumb.href} className="transition-colors hover:text-foreground">
                      {crumb.label}
                    </a>
                  ) : (
                    <span aria-current={last ? 'page' : undefined} className={last ? 'text-foreground' : ''}>
                      {crumb.label}
                    </span>
                  )}
                  {!last ? <ChevronRight aria-hidden className="h-3.5 w-3.5" /> : null}
                </li>
              )
            })}
          </ol>
        </nav>
      ) : null}

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {secondaryAction ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              {secondaryAction.icon}
              {secondaryAction.label}
            </button>
          ) : null}

          {primaryAction ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {primaryAction.icon}
              {primaryAction.label}
            </button>
          ) : null}
        </div>
      </div>

      {tabs.length > 0 ? (
        <nav aria-label="Views" className="-mb-px mt-5 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const active = tab.label === activeTab
            return (
              <a
                key={tab.label}
                href={tab.href ?? '#'}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                {tab.label}
                {typeof tab.count === 'number' ? (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs ${
                      active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {tab.count.toLocaleString('en-US')}
                  </span>
                ) : null}
              </a>
            )
          })}
        </nav>
      ) : null}
    </header>
  )
}
