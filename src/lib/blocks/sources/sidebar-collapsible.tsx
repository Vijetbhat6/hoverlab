'use client'

/**
 * <SidebarCollapsible> — one sidebar that folds between a full-width list and
 * an icon-only rail.
 *
 *  - The toggle carries `aria-expanded` and `aria-controls`, with a label that
 *    never changes. Swapping "Collapse" for "Expand" AND flipping the state
 *    makes a screen reader say the same thing twice, in opposite directions.
 *  - Collapsing must not delete the accessible names. The label switches to
 *    `sr-only` rather than unmounting, so a rail of bare icons is still a list
 *    of named links. Its parent is `relative` because `sr-only` is absolutely
 *    positioned and would otherwise scroll the whole page sideways.
 *  - The tooltip on a collapsed item is `aria-hidden` on purpose: the name is
 *    already in the link, and announcing it twice is noise. It shows on
 *    keyboard focus as well as hover — a tooltip only a mouse can trigger
 *    hides exactly the labels a keyboard user lost.
 *  - Cmd/Ctrl+B toggles it, the shortcut every editor taught people. It is
 *    ignored while typing in a field.
 *  - Width animates only for people who have not asked for reduced motion.
 */

import * as React from 'react'
import {
  Home,
  Inbox,
  CalendarDays,
  BarChart3,
  Settings,
  PanelLeft,
} from 'lucide-react'

export interface CollapsibleItem {
  id: string
  label: string
  icon: React.ReactNode
  badge?: string
}

export interface SidebarCollapsibleProps {
  items?: CollapsibleItem[]
  defaultActiveId?: string
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  children?: React.ReactNode
  className?: string
}

const icon = 'h-[18px] w-[18px] shrink-0'

const DEFAULT_ITEMS: CollapsibleItem[] = [
  { id: 'home', label: 'Home', icon: <Home aria-hidden className={icon} /> },
  { id: 'inbox', label: 'Inbox', icon: <Inbox aria-hidden className={icon} />, badge: '4' },
  { id: 'calendar', label: 'Calendar', icon: <CalendarDays aria-hidden className={icon} /> },
  { id: 'reports', label: 'Reports', icon: <BarChart3 aria-hidden className={icon} /> },
  { id: 'settings', label: 'Settings', icon: <Settings aria-hidden className={icon} /> },
]

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
}

export function SidebarCollapsible({
  items = DEFAULT_ITEMS,
  defaultActiveId = 'inbox',
  defaultCollapsed = false,
  onCollapsedChange,
  children,
  className = '',
}: SidebarCollapsibleProps) {
  const uid = React.useId()
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed)
  const [activeId, setActiveId] = React.useState(defaultActiveId)

  const toggle = React.useCallback(() => {
    setCollapsed((c) => {
      onCollapsedChange?.(!c)
      return !c
    })
  }, [onCollapsedChange])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b' && !isTypingTarget(e.target)) {
        e.preventDefault()
        toggle()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [toggle])

  return (
    <div
      className={`flex h-[32rem] overflow-hidden rounded-2xl border border-border/60 bg-background ${className}`}
    >
      <aside
        aria-label="Application"
        className={`flex shrink-0 flex-col border-e border-border/60 bg-card/40 motion-safe:transition-[width] motion-safe:duration-200 ${
          collapsed ? 'w-[64px]' : 'w-[240px]'
        }`}
      >
        <div className={`flex h-14 items-center gap-2 px-3 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {collapsed ? null : (
            <span className="flex min-w-0 items-center gap-2 ps-1">
              <span
                aria-hidden
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground"
              >
                H
              </span>
              <span className="truncate text-sm font-semibold tracking-tight">Harbor</span>
            </span>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle sidebar"
            aria-expanded={!collapsed}
            aria-controls={`${uid}-nav`}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <PanelLeft aria-hidden className="h-4 w-4 rtl:-scale-x-100" />
          </button>
        </div>

        <nav
          id={`${uid}-nav`}
          aria-label="Main"
          className={`flex-1 space-y-1 px-2 py-2 ${collapsed ? 'overflow-visible' : 'overflow-y-auto'}`}
        >
          {items.map((item) => {
            const active = item.id === activeId
            return (
              <a
                key={item.id}
                href="#"
                aria-current={active ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  setActiveId(item.id)
                }}
                className={`group relative flex items-center gap-3 rounded-xl py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  collapsed ? 'justify-center px-0' : 'px-3'
                } ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.icon}
                <span className={collapsed ? 'sr-only' : 'flex-1 truncate'}>
                  {item.label}
                  {collapsed && item.badge ? `, ${item.badge} new` : null}
                </span>
                {item.badge && !collapsed ? (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary-foreground">
                    {item.badge}
                  </span>
                ) : null}
                {item.badge && collapsed ? (
                  <span
                    aria-hidden
                    className="absolute end-2 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card border border-transparent"
                  />
                ) : null}
                {collapsed ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute start-full z-10 ms-3 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    {item.label}
                  </span>
                ) : null}
              </a>
            )
          })}
        </nav>

        <p className={`px-4 pb-4 text-xs text-muted-foreground ${collapsed ? 'sr-only' : ''}`}>
          <kbd className="rounded border border-border/60 px-1.5 font-medium">Ctrl</kbd>{' '}
          <kbd className="rounded border border-border/60 px-1.5 font-medium">B</kbd> to toggle
        </p>
      </aside>

      <main className="hidden min-w-0 flex-1 p-6 sm:block">
        {children ?? (
          <div className="flex min-h-full min-w-0 items-center justify-center break-words rounded-xl border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
            Your page content goes here
          </div>
        )}
      </main>
    </div>
  )
}
