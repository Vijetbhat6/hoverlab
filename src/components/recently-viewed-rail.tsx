'use client'

/**
 * Recently-viewed effects rail.
 *
 * Horizontal scroll strip showing the last 8 effects the user opened on the
 * detail page. Renders above the main effect grid on /library. Hidden when
 * empty (first visit / cleared history).
 *
 * Each entry: small card with the effect name, category, and a relative
 * "viewed X ago" timestamp. Clicking jumps to the detail page. A "Clear"
 * button at the trailing edge lets the user wipe the history.
 */

import Link from 'next/link'
import { History, X } from 'lucide-react'
import { useRecentlyViewed } from '@/hooks/use-recently-viewed'
import { formatRelativeTime } from '@/hooks/use-copy-history'
import { cn } from '@/lib/utils'

export function RecentlyViewedRail() {
  const { entries, clear } = useRecentlyViewed()

  if (entries.length === 0) return null

  return (
    <section
      aria-label="Recently viewed effects"
      className="mx-auto mb-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <div className="rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold tracking-tight">
              Recently viewed
            </h2>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {entries.length}
            </span>
          </div>
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Clear recently viewed history"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {entries.map((entry, idx) => (
            <Link
              key={entry.effectId}
              href={`/effect/${entry.effectId}`}
              className={cn(
                'group flex min-w-[180px] max-w-[220px] flex-1 flex-col gap-1 rounded-xl border border-border/50 bg-background/60 p-3 transition-all',
                'hover:border-primary/40 hover:bg-background hover:shadow-md',
                idx === 0 && 'border-primary/30 ring-1 ring-primary/10',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {entry.effectCategory}
                </span>
                {idx === 0 ? (
                  <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
                    Last
                  </span>
                ) : null}
              </div>
              <span className="line-clamp-2 text-sm font-medium leading-tight transition-colors group-hover:text-primary">
                {entry.effectName}
              </span>
              <span className="mt-auto text-[11px] text-muted-foreground/80">
                {formatRelativeTime(entry.viewedAt)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
