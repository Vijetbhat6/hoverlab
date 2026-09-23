'use client'

/**
 * <SidebarFloatingInset> — the "inset" sidebar: a floating card on a tinted
 * canvas, with the page content sitting in a second rounded surface beside it
 * rather than butting against a hairline.
 *
 *  - Both surfaces are cards on a `bg-muted` canvas, so the gap between them
 *    is the separator. No border-e to flip in RTL; the layout mirrors from
 *    flex order alone.
 *  - The usage meter is a real `role="progressbar"` with a value and a name.
 *    A bare coloured bar is invisible to a screen reader, and a number in the
 *    caption alone is not a progressbar.
 *  - The promo card is a labelled region with one button, not a link farm, so
 *    it can be skipped past in a single Tab stop when the user does not want it.
 */

import * as React from 'react'
import { LayoutGrid, Layers, MessageSquare, Bookmark, Sparkles } from 'lucide-react'

export interface FloatingItem {
  id: string
  label: string
  icon: React.ReactNode
}

export interface SidebarFloatingInsetProps {
  items?: FloatingItem[]
  defaultActiveId?: string
  /** Percent of the plan used, 0-100. */
  used?: number
  children?: React.ReactNode
  className?: string
}

const icon = 'h-4 w-4 shrink-0'

const DEFAULT_ITEMS: FloatingItem[] = [
  { id: 'board', label: 'Board', icon: <LayoutGrid aria-hidden className={icon} /> },
  { id: 'layers', label: 'Layers', icon: <Layers aria-hidden className={icon} /> },
  { id: 'comments', label: 'Comments', icon: <MessageSquare aria-hidden className={icon} /> },
  { id: 'saved', label: 'Saved', icon: <Bookmark aria-hidden className={icon} /> },
]

export function SidebarFloatingInset({
  items = DEFAULT_ITEMS,
  defaultActiveId = 'board',
  used = 72,
  children,
  className = '',
}: SidebarFloatingInsetProps) {
  const uid = React.useId()
  const [activeId, setActiveId] = React.useState(defaultActiveId)
  const meterLabel = `${uid}-meter`

  return (
    <div className={`flex h-[32rem] gap-2 overflow-hidden rounded-2xl bg-muted/60 p-2 ${className}`}>
      <aside
        aria-label="Application"
        className="flex w-[240px] shrink-0 flex-col rounded-2xl border border-border/60 bg-card p-3 shadow-sm"
      >
        <div className="flex items-center gap-2 px-2 py-1.5">
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground"
          >
            F
          </span>
          <span className="text-sm font-semibold tracking-tight">Figment</span>
        </div>

        <nav aria-label="Main" className="mt-3 flex-1 space-y-1">
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
                className={`flex items-center gap-3 rounded-full px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.icon}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </a>
            )
          })}
        </nav>

        <section
          aria-labelledby={`${uid}-promo`}
          className="rounded-xl border border-border/60 bg-muted/50 p-3"
        >
          <h2 id={`${uid}-promo`} className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles aria-hidden className="h-4 w-4 text-primary" />
            Free plan
          </h2>
          <p id={meterLabel} className="mt-1 text-xs text-muted-foreground">
            {used}% of your 50 boards used
          </p>
          <div
            role="progressbar"
            aria-labelledby={meterLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={used}
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-border"
          >
            <div className="h-full rounded-full bg-primary border border-transparent" style={{ width: `${used}%` }} />
          </div>
          <button
            type="button"
            className="mt-3 w-full rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            Upgrade
          </button>
        </section>
      </aside>

      <main className="hidden min-w-0 flex-1 rounded-2xl border border-border/60 bg-background p-6 shadow-sm sm:block">
        {children ?? (
          <div className="flex min-h-full min-w-0 items-center justify-center break-words rounded-xl border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
            Your page content goes here
          </div>
        )}
      </main>
    </div>
  )
}
