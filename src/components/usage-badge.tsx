'use client'

/**
 * "Taken 14 times this week" — or nothing at all.
 *
 * Fetched after the page renders, because detail pages are statically
 * generated and this is the one number on them that moves. Renders nothing
 * while loading and nothing when the count is zero: a "0 uses" line on a
 * new artifact is an argument against taking it, and an artifact nobody has
 * used yet is not evidence of anything.
 */

import * as React from 'react'

export function UsageBadge({ id }: { id: string }) {
  const [count, setCount] = React.useState<number | null>(null)

  React.useEffect(() => {
    let cancelled = false
    fetch(`/api/usage?id=${encodeURIComponent(id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { recent?: number } | null) => {
        if (!cancelled) setCount(typeof data?.recent === 'number' ? data.recent : 0)
      })
      .catch(() => {
        if (!cancelled) setCount(0)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (!count) return null

  return (
    <span className="text-foreground">
      Copied or installed{' '}
      <span className="font-semibold tabular-nums">{count.toLocaleString('en-US')}</span>{' '}
      {count === 1 ? 'time' : 'times'} in the last week.
    </span>
  )
}
