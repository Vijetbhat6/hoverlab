'use client'

/**
 * Recently-viewed effects hook.
 *
 * Tracks the last N effects the user opened on the detail page, so they can
 * quickly jump back to something they were just looking at. Pure localStorage
 * — no cloud sync (this is ephemeral "working memory", not a saved collection).
 *
 * Distinct from copy-history (which records only when the user *copies* code)
 * and favorites (which is an explicit save). Recently-viewed fires on every
 * detail-page mount — passive, no user action required.
 *
 * Storage layout:
 *  - localStorage key 'hoverlab:recently-viewed' holds the JSON-stringified
 *    list of RecentlyViewedEntry objects (source of truth on the client).
 *  - Cross-tab sync is handled via the 'storage' event + a same-tab
 *    'hoverlab:recently-viewed-changed' custom event.
 */

import * as React from 'react'

export interface RecentlyViewedEntry {
  effectId: string
  effectName: string
  effectCategory: string
  /** ISO timestamp — used for sorting + relative-time display. */
  viewedAt: string
}

const STORAGE_KEY = 'hoverlab:recently-viewed'
const MAX_ENTRIES = 8

function readHistory(): RecentlyViewedEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentlyViewedEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, MAX_ENTRIES)
  } catch {
    return []
  }
}

function writeHistory(next: RecentlyViewedEntry[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(next.slice(0, MAX_ENTRIES)),
    )
    // Notify other hook instances in the same tab.
    window.dispatchEvent(new CustomEvent('hoverlab:recently-viewed-changed'))
  } catch {
    /* ignore quota / privacy errors */
  }
}

export function useRecentlyViewed() {
  const [entries, setEntries] = React.useState<RecentlyViewedEntry[]>(() =>
    readHistory(),
  )

  // Mirror the latest entries in a ref so that `record` / `clear` can
  // compute the next list without reading stale state, and so we can call
  // `writeHistory(next)` OUTSIDE the setEntries updater (which would run
  // during React's render phase and trigger the
  // "Cannot update a component while rendering a different component" error
  // via the synchronous dispatchEvent inside writeHistory).
  const entriesRef = React.useRef<RecentlyViewedEntry[]>(entries)
  React.useEffect(() => {
    entriesRef.current = entries
  }, [entries])

  React.useEffect(() => {
    const sync = () => setEntries(readHistory())
    window.addEventListener('storage', sync)
    window.addEventListener('hoverlab:recently-viewed-changed', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('hoverlab:recently-viewed-changed', sync)
    }
  }, [])

  const record = React.useCallback(
    (effect: { id: string; name: string; category: string }) => {
      // Compute next from the ref (always current), then call setEntries
      // and writeHistory as separate statements — outside any setState
      // updater, so the synchronous dispatchEvent in writeHistory does
      // not fire during React's render phase.
      const without = entriesRef.current.filter(
        (e) => e.effectId !== effect.id,
      )
      const next = [
        {
          effectId: effect.id,
          effectName: effect.name,
          effectCategory: effect.category,
          viewedAt: new Date().toISOString(),
        },
        ...without,
      ].slice(0, MAX_ENTRIES)
      entriesRef.current = next
      setEntries(next)
      writeHistory(next)
    },
    [],
  )

  const clear = React.useCallback(() => {
    entriesRef.current = []
    setEntries([])
    writeHistory([])
  }, [])

  const count = entries.length

  return { entries, record, clear, count }
}
