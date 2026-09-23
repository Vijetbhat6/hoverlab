'use client'

/**
 * <SidebarAppGrouped> — the application sidebar most products converge on:
 * a brand header, a search trigger, labelled groups of links and a user row.
 *
 *  - Each group is a real heading plus a list, and the list points back at its
 *    heading with `aria-labelledby`. A screen reader announces "Platform,
 *    list, 3 items" instead of reading eight links as one undifferentiated
 *    run.
 *  - The active link carries `aria-current="page"`. The tint is only a
 *    second cue: a colour-blind user and a screen reader both get the first.
 *  - Every id is rooted in `useId()`, so two sidebars on one page (a desktop
 *    one and a drawer copy, say) never collide on a label reference.
 *  - Logical properties throughout (`ps-`, `border-e`, `ms-auto`), so the
 *    sidebar flips to the right edge in an RTL document with no extra work.
 */

import * as React from 'react'
import {
  LayoutDashboard,
  FolderKanban,
  Rocket,
  Users,
  CreditCard,
  Plug,
  Search,
  ChevronsUpDown,
} from 'lucide-react'

export interface SidebarLink {
  id: string
  label: string
  icon: React.ReactNode
  href?: string
  badge?: string
}

export interface SidebarGroup {
  label: string
  links: SidebarLink[]
}

export interface SidebarAppGroupedProps {
  brand?: string
  groups?: SidebarGroup[]
  /** Uncontrolled starting point; clicking a link moves it. */
  defaultActiveId?: string
  user?: { name: string; email: string }
  onNavigate?: (id: string) => void
  children?: React.ReactNode
  className?: string
}

const icon = 'h-4 w-4 shrink-0'

const DEFAULT_GROUPS: SidebarGroup[] = [
  {
    label: 'Platform',
    links: [
      { id: 'overview', label: 'Overview', icon: <LayoutDashboard aria-hidden className={icon} /> },
      { id: 'projects', label: 'Projects', icon: <FolderKanban aria-hidden className={icon} />, badge: '8' },
      { id: 'deployments', label: 'Deployments', icon: <Rocket aria-hidden className={icon} /> },
    ],
  },
  {
    label: 'Workspace',
    links: [
      { id: 'members', label: 'Members', icon: <Users aria-hidden className={icon} /> },
      { id: 'billing', label: 'Billing', icon: <CreditCard aria-hidden className={icon} /> },
      { id: 'integrations', label: 'Integrations', icon: <Plug aria-hidden className={icon} /> },
    ],
  },
]

export function SidebarAppGrouped({
  brand = 'Acme Inc',
  groups = DEFAULT_GROUPS,
  defaultActiveId = 'projects',
  user = { name: 'Ada Lovelace', email: 'ada@acme.com' },
  onNavigate,
  children,
  className = '',
}: SidebarAppGroupedProps) {
  const uid = React.useId()
  const [activeId, setActiveId] = React.useState(defaultActiveId)

  const go = (id: string) => {
    setActiveId(id)
    onNavigate?.(id)
  }

  return (
    <div
      className={`flex h-[32rem] overflow-hidden rounded-2xl border border-border/60 bg-background ${className}`}
    >
      <aside
        aria-label="Application"
        className="flex w-[256px] shrink-0 flex-col border-e border-border/60 bg-card/40"
      >
        <div className="flex items-center gap-2 px-4 pt-4">
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
          >
            {brand.slice(0, 1)}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">{brand}</span>
          <ChevronsUpDown aria-hidden className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="px-3 pt-4">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Search aria-hidden className="h-4 w-4" />
            <span className="flex-1 text-start">Search</span>
            <kbd className="rounded border border-border/60 px-1.5 text-[11px] font-medium">⌘K</kbd>
          </button>
        </div>

        <nav aria-label="Main" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {groups.map((group, gi) => {
            const headingId = `${uid}-group-${gi}`
            return (
              <div key={group.label}>
                <h2
                  id={headingId}
                  className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {group.label}
                </h2>
                <ul aria-labelledby={headingId} className="space-y-0.5">
                  {group.links.map((link) => {
                    const active = link.id === activeId
                    return (
                      <li key={link.id}>
                        <a
                          href={link.href ?? '#'}
                          aria-current={active ? 'page' : undefined}
                          onClick={(e) => {
                            if (!link.href) e.preventDefault()
                            go(link.id)
                          }}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            active
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          {link.icon}
                          <span className="min-w-0 flex-1 truncate">{link.label}</span>
                          {link.badge ? (
                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                              {link.badge}
                            </span>
                          ) : null}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </nav>

        <div className="border-t border-border/60 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold"
            >
              {user.name
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
            </span>
          </div>
        </div>
      </aside>

      <main className="hidden min-w-0 flex-1 p-6 sm:block">
        {children ?? (
          <div className="flex h-full min-w-0 items-center justify-center break-words rounded-xl border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
            Your page content goes here
          </div>
        )}
      </main>
    </div>
  )
}
