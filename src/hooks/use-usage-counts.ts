'use client'

/**
 * The catalog's copy counts, fetched once per page load and shared.
 *
 * A grid renders hundreds of cards and every one of them wants the same
 * map, so the fetch is a module-level promise rather than per-hook state:
 * the first card to mount starts it, every later card awaits the same
 * promise, and a navigation back to a grid inside the same session reuses
 * the resolved value instead of asking again.
 *
 * ── WHY THIS IS NOT SUSPENSE, AND NOT A PROVIDER ────────────────────────
 *
 * The number is an ornament on a card that is already readable without it.
 * Suspending the grid on it would trade a complete page now for a blank one
 * until Firestore answers — exactly backwards. And a provider would mean
 * every grid remembering to mount one, with the failure mode being a silent
 * missing number rather than an error. A module singleton has neither
 * problem: a card asks, and gets the answer whenever it arrives.
 *
 * Failure is indistinguishable from "nothing has been copied yet", on
 * purpose. Both mean the same thing to a card — there is no number to show
 * — and a card is the wrong place to report that a counter is down.
 */

import * as React from 'react'

export interface UsageEntry {
  /** Copies and installs in the last seven days. The ranking signal. */
  recent: number
  /** Copies and installs since counting began. */
  total: number
  /** Detail-page views. Displayed, never ranked — see `lib/usage.ts`. */
  views: number
  /** People holding this in favorites, net of unsaves. */
  saves: number
}

export interface UsageCounts {
  [id: string]: UsageEntry
}

/**
 * The in-flight or settled fetch. Never reset: the counts move slowly
 * enough that a second read inside one session would cost a request to
 * change a number by one.
 */
let pending: Promise<UsageCounts> | null = null

/** Resolved counts, once they have arrived — the synchronous fast path. */
let settled: UsageCounts | null = null

function load(): Promise<UsageCounts> {
  if (!pending) {
    pending = fetch('/api/usage/counts')
      .then((res) => (res.ok ? res.json() : { counts: {} }))
      .then((data: { counts?: Record<string, Partial<UsageEntry>> }) => {
        /*
         * Filled in field by field rather than trusted wholesale. The
         * response is cached at the edge for five minutes, so for the
         * first few minutes after a deploy that adds a counter, live
         * browsers are reading a body written by the previous version —
         * with `views` and `saves` simply absent. Defaulting them here is
         * the difference between a card showing one number and a card
         * rendering `undefined`.
         */
        const counts: UsageCounts = {}
        for (const [id, entry] of Object.entries(data.counts ?? {})) {
          counts[id] = {
            recent: entry?.recent ?? 0,
            total: entry?.total ?? 0,
            views: entry?.views ?? 0,
            saves: entry?.saves ?? 0,
          }
        }
        settled = counts
        return settled
      })
      .catch(() => {
        // A counter that cannot be read is a catalog with no numbers on it,
        // which is where this feature started and is survivable.
        settled = {}
        return settled
      })
  }
  return pending
}

/**
 * The counts map, empty until it arrives.
 *
 * Starts from `settled` so a grid mounted after the first one renders its
 * numbers in the first paint rather than flashing them in.
 */
export function useUsageCounts(): UsageCounts {
  return useUsageCountsState().counts
}

/**
 * The counts, plus whether the answer has come back.
 *
 * An empty map means two different things — still loading, and nothing has
 * been copied this week — and a card can treat them the same (render no
 * number) while a sort control cannot: one says "wait" and the other says
 * "this order is as good as it gets today". Anything that explains itself
 * to the reader needs the difference.
 */
export function useUsageCountsState(): { counts: UsageCounts; ready: boolean } {
  const [state, setState] = React.useState<{ counts: UsageCounts; ready: boolean }>(() =>
    settled ? { counts: settled, ready: true } : { counts: {}, ready: false },
  )

  React.useEffect(() => {
    if (state.ready) return

    let alive = true
    void load().then((next) => {
      if (alive) setState({ counts: next, ready: true })
    })
    return () => {
      alive = false
    }
  }, [state.ready])

  return state
}

/** One artifact's week, or null when it has not been counted. */
export function useUsageCount(id: string): number | null {
  const counts = useUsageCounts()
  const entry = counts[id]
  return entry && entry.recent > 0 ? entry.recent : null
}

/**
 * One artifact's whole row, or null when it has no counters at all.
 *
 * The three numbers arrive together and a card renders them together, so
 * asking for them one hook at a time would be three subscriptions to the
 * same map for one tile. Individual fields can still be zero here — a block
 * with views and no copies is a normal row — and it is the RENDERER that
 * decides a zero is not worth printing, not this.
 */
export function useUsageEntry(id: string): UsageEntry | null {
  const counts = useUsageCounts()
  return counts[id] ?? null
}
