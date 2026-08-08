'use client'

/**
 * Recently-viewed artifacts hook.
 *
 * Tracks the last N artifacts the user opened on a detail page — effect,
 * block, page or template — so they can jump back to something they were
 * just looking at. Pure localStorage — no cloud sync (this is ephemeral
 * "working memory", not a saved collection).
 *
 * Entries written before the ladder existed carry `effectId`/`effectName`
 * and no level; `normalizeRef` migrates them on read and `levelOf` resolves
 * the missing level to `'effect'`, so an existing history survives the
 * widening rather than silently emptying.
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
import {
  normalizeRef,
  type ArtifactRef,
  type RecordableArtifact,
} from '@/lib/artifact-history'

export interface RecentlyViewedEntry extends ArtifactRef {
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
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((entry) => {
        const ref = normalizeRef(entry)
        if (!ref) return null
        const viewedAt = (entry as { viewedAt?: string }).viewedAt
        return { ...ref, viewedAt: viewedAt ?? new Date(0).toISOString() }
      })
      .filter((e): e is RecentlyViewedEntry => e !== null)
      .slice(0, MAX_ENTRIES)
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
  /**
   * Starts EMPTY rather than seeded from localStorage.
   *
   * Seeding here (`useState(() => readHistory())`) is a hydration bug: the
   * server has no localStorage, so it renders nothing, while the client's
   * very first render already has the entries — React sees two different
   * trees and bails out of hydrating with #418. Reading in the effect below
   * instead means both sides agree on "empty", and the real list arrives on
   * the commit after.
   */
  const [entries, setEntries] = React.useState<RecentlyViewedEntry[]>([])

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
    // Populate on mount — see the note on the initial state above.
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener('hoverlab:recently-viewed-changed', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('hoverlab:recently-viewed-changed', sync)
    }
  }, [])

  const record = React.useCallback(
    (artifact: RecordableArtifact) => {
      // Compute next from the ref (always current), then call setEntries
      // and writeHistory as separate statements — outside any setState
      // updater, so the synchronous dispatchEvent in writeHistory does
      // not fire during React's render phase.
      // Base the next list on what is PERSISTED, not on `entriesRef`.
      //
      // The ref is populated by an effect, and `record` is itself called
      // from a mount effect on the detail pages — so on a fresh page load
      // the ref is still empty when the first record lands, and building
      // from it would write a one-entry history over the real one. Reading
      // storage here is also what makes a record correct when another tab
      // has changed the list since this one mounted.
      const without = readHistory().filter((e) => e.id !== artifact.id)
      const next = [
        {
          id: artifact.id,
          name: artifact.name,
          category: artifact.category,
          level: artifact.level,
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
