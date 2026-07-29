'use client'

import * as React from 'react'
import { getBundledEffect, type Effect } from '@/lib/effect-index'

/**
 * Lazily resolve full effects (markup + CSS) for a set of ids.
 *
 * The client only ships effect *metadata* (see `@/lib/effect-index`), so
 * anything that actually renders or exports an effect needs to fetch its
 * `html` / `css`. This hook is the single place that happens.
 *
 * Resolution order for each id:
 *   1. Hand-crafted effects are bundled — returned synchronously, no fetch.
 *   2. Module-level cache — shared across every component and every mount,
 *      so paging back to a page you've already seen is instant.
 *   3. /api/effects/batch — one request for all the remaining ids.
 *
 * The cache is module-level rather than component state on purpose: the
 * library grid, the compare drawer, and the bundle drawer all ask for
 * overlapping ids, and none of them should re-fetch what another already
 * has. Entries are immutable (an effect's CSS never changes without its
 * id changing), so the cache never needs invalidation.
 */

/** id → resolved effect. Shared process-wide, never evicted. */
const CACHE = new Map<string, Effect>()

/** id → in-flight request, so concurrent callers share one fetch. */
const INFLIGHT = new Map<string, Promise<void>>()

/**
 * Fetch any ids that aren't already cached or in flight, and populate the
 * cache. Resolves once every requested id has been attempted.
 */
async function fetchMissing(ids: string[]): Promise<void> {
  const needed = ids.filter((id) => !CACHE.has(id) && !INFLIGHT.has(id))

  if (needed.length > 0) {
    const request = (async () => {
      try {
        const res = await fetch('/api/effects/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: needed }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as { effects?: Effect[] }
        for (const effect of data.effects ?? []) {
          CACHE.set(effect.id, effect)
        }
      } catch (err) {
        // Leave the ids uncached so a later render can retry. Callers
        // render a skeleton for anything unresolved, so a failure here
        // degrades to "still loading" rather than a broken grid.
        console.error('[use-effect-details] fetch failed:', err)
      } finally {
        for (const id of needed) INFLIGHT.delete(id)
      }
    })()

    for (const id of needed) INFLIGHT.set(id, request)
  }

  // Wait on every relevant in-flight request, including ones started by
  // another component for ids we also need.
  const waits = ids.map((id) => INFLIGHT.get(id)).filter(Boolean) as Promise<void>[]
  if (waits.length > 0) await Promise.all(waits)
}

export interface UseEffectDetailsResult {
  /** Resolved effects, in the same order as the requested ids. */
  effects: Effect[]
  /** Look up one resolved effect; undefined while it's still loading. */
  get: (id: string) => Effect | undefined
  /** True while at least one requested id is unresolved. */
  loading: boolean
}

/**
 * Resolve `ids` to full effects, fetching whatever isn't already local.
 *
 * Returns partial results as they resolve — bundled hand-crafted effects
 * are available on the very first render, so the featured set never
 * flashes a skeleton.
 */
export function useEffectDetails(ids: string[]): UseEffectDetailsResult {
  // Join into a stable primitive so the effect below doesn't re-run on
  // every render just because the caller built a new array literal.
  const key = ids.join(',')

  // `tick` increments whenever we populate the cache. The memo below
  // depends on it because CACHE is a plain Map that React can't observe.
  const [tick, forceRender] = React.useReducer((n: number) => n + 1, 0)

  React.useEffect(() => {
    const wanted = key ? key.split(',') : []

    // Bundled hand-crafted effects need no network at all.
    const remaining: string[] = []
    for (const id of wanted) {
      if (CACHE.has(id)) continue
      const bundled = getBundledEffect(id)
      if (bundled) {
        CACHE.set(id, bundled)
      } else {
        remaining.push(id)
      }
    }

    if (remaining.length === 0) {
      // Everything was bundled or already cached — re-render so the
      // caller picks up anything we just moved into the cache.
      forceRender()
      return
    }

    let cancelled = false
    void fetchMissing(remaining).then(() => {
      if (!cancelled) forceRender()
    })
    return () => {
      cancelled = true
    }
  }, [key])

  return React.useMemo(() => {
    const wanted = key ? key.split(',') : []
    const effects: Effect[] = []
    let loading = false

    for (const id of wanted) {
      const cached = CACHE.get(id) ?? getBundledEffect(id)
      if (cached) {
        effects.push(cached)
      } else {
        loading = true
      }
    }

    return {
      effects,
      get: (id: string) => CACHE.get(id) ?? getBundledEffect(id),
      loading,
    }
    // `tick` is what surfaces CACHE mutations to React — the Map itself
    // isn't reactive, so populating it bumps the reducer and re-runs this.
  }, [key, tick])
}

/**
 * Imperative one-shot resolve, for code paths that aren't a render (bundle
 * export, "copy all", the command palette's copy action). Same cache as
 * the hook, so nothing is fetched twice.
 */
export async function resolveEffects(ids: string[]): Promise<Effect[]> {
  const remaining: string[] = []
  for (const id of ids) {
    if (CACHE.has(id)) continue
    const bundled = getBundledEffect(id)
    if (bundled) CACHE.set(id, bundled)
    else remaining.push(id)
  }
  if (remaining.length > 0) await fetchMissing(remaining)
  return ids.map((id) => CACHE.get(id)).filter((e): e is Effect => e !== undefined)
}
