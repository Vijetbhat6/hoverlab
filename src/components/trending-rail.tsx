'use client'

/**
 * <TrendingRail> — what other people took this week.
 *
 * Renders nothing at all when there is no data, which on a fresh
 * deployment is every time. That is deliberate: a Trending strip padded
 * out with the newest or the featured items would look identical to a real
 * one and mean nothing, and the whole value of this signal is that it is
 * measured rather than chosen.
 *
 * Client-side rather than server-rendered, for two reasons. The counters
 * move continuously while /browse is otherwise cacheable, and a Firestore
 * read on the critical path of the busiest page is a poor trade for a strip
 * most visitors scroll past.
 */

import * as React from 'react'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

import { LEVEL_LABEL, type ArtifactLevel } from '@/lib/artifact-types'
import { cn } from '@/lib/utils'

interface TrendingItem {
  id: string
  name: string
  level: ArtifactLevel
  category: string
  description: string
  uses: number
  url: string
}

/** Site-relative href, so a Next <Link> can handle it client-side. */
function pathOf(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

export function TrendingRail({
  level,
  limit = 8,
  className,
}: {
  level?: ArtifactLevel
  limit?: number
  className?: string
}) {
  const [items, setItems] = React.useState<TrendingItem[] | null>(null)

  React.useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams({ limit: String(limit) })
    if (level) params.set('level', level)

    fetch(`/api/v1/trending?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { items?: TrendingItem[] } | null) => {
        if (!cancelled) setItems(data?.items ?? [])
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
    return () => {
      cancelled = true
    }
  }, [level, limit])

  if (!items || items.length === 0) return null

  return (
    <section
      aria-label="Trending this week"
      className={cn('rounded-xl border border-border/60 bg-card/50 p-4', className)}
    >
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
        <TrendingUp aria-hidden className="h-4 w-4 text-primary" />
        Trending this week
        <span className="font-normal text-muted-foreground">
          — by copies and installs, not page views
        </span>
      </h2>

      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={pathOf(item.url)}
              className="group inline-flex items-center gap-2 rounded-lg border border-border/60 px-3 py-1.5 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="font-medium">{item.name}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {LEVEL_LABEL[item.level].one}
              </span>
              <span
                className="text-xs tabular-nums text-muted-foreground"
                title={`${item.uses} in the last 7 days`}
              >
                {item.uses}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
