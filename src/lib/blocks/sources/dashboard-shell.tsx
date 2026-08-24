'use client'

/**
 * <DashboardShell> — sidebar, top bar and a content slot.
 *
 * The layout every internal tool needs and nobody enjoys rebuilding.
 *
 *  - The sidebar is a real <nav> with `aria-current="page"` on the active
 *    item, which is what a screen reader uses to answer "where am I".
 *  - Below `lg` it becomes a drawer over a backdrop, with `aria-expanded`
 *    on the trigger. Escape closes it — a drawer you can only dismiss by
 *    finding the exact backdrop pixel is a trap on a phone.
 *  - The main region scrolls independently of the sidebar, so a long table
 *    never carries the navigation off the top of the screen.
 */

import * as React from 'react'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  Search,
  Bell,
} from 'lucide-react'

export interface NavItem {
  label: string
  icon: React.ReactNode
  href?: string
  badge?: string
}

export interface DashboardShellProps {
  brand?: string
  nav?: NavItem[]
  activeLabel?: string
  user?: { name: string; email: string }
  children?: React.ReactNode
  className?: string
}

const DEFAULT_NAV: NavItem[] = [
  { label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Customers', icon: <Users className="h-4 w-4" />, badge: '12' },
  { label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
  { label: 'Settings', icon: <Settings className="h-4 w-4" /> },
]

export function DashboardShell({
  brand = 'Acme Inc',
  nav = DEFAULT_NAV,
  activeLabel = 'Overview',
  user = { name: 'Ada Lovelace', email: 'ada@acme.com' },
  children,
  className = '',
}: DashboardShellProps) {
  const [open, setOpen] = React.useState(false)
  const uid = React.useId()

  // Escape closes the mobile drawer. Bound on the document rather than the
  // panel so it works regardless of where focus currently sits.
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-border/60 px-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
          {brand.slice(0, 1)}
        </span>
        <span className="truncate font-semibold tracking-tight">{brand}</span>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const active = item.label === activeLabel
          return (
            <a
              key={item.label}
              href={item.href ?? '#'}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {item.icon}
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge ? (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {item.badge}
                </span>
              ) : null}
            </a>
          )
        })}
      </nav>

      <div className="border-t border-border/60 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
            {user.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{user.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`flex h-[32rem] overflow-hidden rounded-2xl border border-border/60 bg-background ${className}`}>
      {/* Static sidebar from lg up */}
      <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-card/40 lg:block">
        {sidebar}
      </aside>

      {/* Drawer below lg */}
      {open ? (
        <>
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="absolute inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          />
          <aside
            id={`${uid}-nav-drawer`}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 z-40 w-60 border-r border-border/60 bg-card shadow-xl lg:hidden"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="absolute right-2 top-3 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </>
      ) : null}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/60 px-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            aria-expanded={open}
            /*
              Only while the drawer exists.

              Unlike the drawer in `nav-mobile-drawer`, this one is
              unmounted when closed — so a permanent `aria-controls` would
              be an IDREF pointing at nothing, which is worse than none at
              all: it tells assistive tech to go somewhere and then does
              not arrive.
            */
            aria-controls={open ? `${uid}-nav-drawer` : undefined}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          >
            <Menu aria-hidden className="h-4 w-4" />
          </button>

          <div className="relative max-w-xs flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              placeholder="Search"
              aria-label="Search"
              className="w-full rounded-xl border border-border/60 bg-background py-1.5 pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <button
            type="button"
            aria-label="Notifications, 3 unread"
            className="relative ml-auto rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Bell aria-hidden className="h-4 w-4" />
            <span
              aria-hidden
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background"
            />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children ?? (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground">
              Your page content goes here
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
