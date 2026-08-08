'use client'

/**
 * Copy-to-clipboard history hook.
 *
 * Records the last 5 effects the user copied code from, so they can quickly
 * jump back to an effect they were just looking at. Pure localStorage — no
 * cloud sync (this is ephemeral "working memory", not a saved collection).
 *
 * Storage layout:
 *  - localStorage key 'hoverlab:copy-history' holds the JSON-stringified
 *    list of CopyHistoryEntry objects (source of truth on the client).
 *  - Cross-tab sync is handled via the 'storage' event + a same-tab
 *    'hoverlab:copy-history-changed' custom event.
 */

import * as React from 'react'
import {
  normalizeRef,
  type ArtifactRef,
  type RecordableArtifact,
} from '@/lib/artifact-history'

export interface CopyHistoryEntry extends ArtifactRef {
  /** ISO timestamp — used for sorting + relative-time display. */
  copiedAt: string
}

const STORAGE_KEY = 'hoverlab:copy-history'
const MAX_ENTRIES = 5

function readHistory(): CopyHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    // Entries written before the ladder existed use `effect*` field names
    // and carry no level; normalizeRef migrates them on read.
    return parsed
      .map((entry) => {
        const ref = normalizeRef(entry)
        if (!ref) return null
        const copiedAt = (entry as { copiedAt?: string }).copiedAt
        return { ...ref, copiedAt: copiedAt ?? new Date(0).toISOString() }
      })
      .filter((e): e is CopyHistoryEntry => e !== null)
      .slice(0, MAX_ENTRIES)
  } catch {
    return []
  }
}

function writeHistory(next: CopyHistoryEntry[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, MAX_ENTRIES)))
    // Notify other hook instances in the same tab.
    window.dispatchEvent(new CustomEvent('hoverlab:copy-history-changed'))
  } catch {
    /* ignore quota / privacy errors */
  }
}

export function useCopyHistory() {
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
  const [entries, setEntries] = React.useState<CopyHistoryEntry[]>([])

  // Mirror the latest entries in a ref so that `record` / `clear` can
  // compute the next list without reading stale state. Critically, this
  // lets us call `writeHistory(next)` OUTSIDE the setEntries updater —
  // calling it inside the updater runs during React's render phase, and
  // the synchronous `dispatchEvent` inside writeHistory then triggers
  // other components' `sync` listeners (which call setEntries) while
  // we're still rendering, producing:
  //   "Cannot update a component (`Home`) while rendering a different
  //    component (`EffectCard`)"
  const entriesRef = React.useRef<CopyHistoryEntry[]>(entries)
  React.useEffect(() => {
    entriesRef.current = entries
  }, [entries])

  React.useEffect(() => {
    const sync = () => setEntries(readHistory())
    // Populate on mount — see the note on the initial state above.
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener('hoverlab:copy-history-changed', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('hoverlab:copy-history-changed', sync)
    }
  }, [])

  const record = React.useCallback(
    (artifact: RecordableArtifact) => {
      // Compute next from the ref (always current), then call setEntries
      // and writeHistory as separate statements. This avoids running
      // writeHistory (which dispatches a synchronous custom event) inside
      // the setEntries updater — that updater executes during React's
      // render phase, and the event listener it triggers would call
      // setEntries on other components mid-render.
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
          copiedAt: new Date().toISOString(),
        },
        ...without,
      ].slice(0, MAX_ENTRIES)
      entriesRef.current = next // keep ref in sync for rapid successive records
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

/**
 * Format a timestamp as a short relative-time string:
 *   - < 60s   → "just now"
 *   - < 60m   → "5m ago"
 *   - < 24h   → "3h ago"
 *   - < 7d    → "2d ago"
 *   - else    → "Mar 5" (locale short)
 */
export function formatRelativeTime(iso: string): string {
  const then = Date.parse(iso)
  if (!then || Number.isNaN(then)) return ''
  const seconds = Math.floor((Date.now() - then) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(then).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
