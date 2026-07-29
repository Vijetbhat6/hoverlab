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

export interface CopyHistoryEntry {
  effectId: string
  effectName: string
  effectCategory: string
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
    const parsed = JSON.parse(raw) as CopyHistoryEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, MAX_ENTRIES)
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
  const [entries, setEntries] = React.useState<CopyHistoryEntry[]>(() => readHistory())

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
    window.addEventListener('storage', sync)
    window.addEventListener('hoverlab:copy-history-changed', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('hoverlab:copy-history-changed', sync)
    }
  }, [])

  const record = React.useCallback(
    (effect: { id: string; name: string; category: string }) => {
      // Compute next from the ref (always current), then call setEntries
      // and writeHistory as separate statements. This avoids running
      // writeHistory (which dispatches a synchronous custom event) inside
      // the setEntries updater — that updater executes during React's
      // render phase, and the event listener it triggers would call
      // setEntries on other components mid-render.
      const without = entriesRef.current.filter((e) => e.effectId !== effect.id)
      const next = [
        {
          effectId: effect.id,
          effectName: effect.name,
          effectCategory: effect.category,
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
