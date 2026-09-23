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

/**
 * One request per artifact per page load, however many badges ask.
 *
 * An effect page renders this in more than one place (the spec card and the
 * facts strip, at least), so the same `?id=` was fetched three times — three
 * function calls and three Firestore reads for one number. Sharing the
 * promise keeps the second and third from firing while the first is in
 * flight, which is exactly when they mount. Failures are not kept, so a
 * dropped request can be retried by the next mount.
 */
const recentByArtifact = new Map<string, Promise<number>>()

function fetchRecent(id: string): Promise<number> {
  let pending = recentByArtifact.get(id)
  if (!pending) {
    pending = fetch(`/api/usage?id=${encodeURIComponent(id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { recent?: number } | null) =>
        typeof data?.recent === 'number' ? data.recent : 0,
      )
      .catch(() => {
        recentByArtifact.delete(id)
        return 0
      })
    recentByArtifact.set(id, pending)
  }
  return pending
}

export function UsageBadge({ id }: { id: string }) {
  const [count, setCount] = React.useState<number | null>(null)

  React.useEffect(() => {
    let cancelled = false
    fetchRecent(id).then((recent) => {
      if (!cancelled) setCount(recent)
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
