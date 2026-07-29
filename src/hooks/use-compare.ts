'use client'

/**
 * Compare-list hook.
 *
 * Lets the user mark up to MAX_ENTRIES effects for side-by-side comparison
 * in the Compare drawer. Pure localStorage — no cloud sync (compare is a
 * short-lived "shopping cart" of effects the user is weighing, not a
 * persistent curated collection like favorites).
 *
 * Storage layout:
 *  - localStorage key 'hoverlab:compare' holds a JSON-stringified array
 *    of effect IDs in the order they were added (newest last so the
 *    drawer renders left-to-right in insertion order).
 *  - Cross-tab sync via the 'storage' event + same-tab sync via the
 *    'hoverlab:compare-changed' custom event.
 *
 * Follows the same ref-mirror pattern as use-favorites / use-bundle /
 * use-recently-viewed to avoid the React render-phase setState bug
 * (Task 16): the action functions compute `next` from `entriesRef.current`
 * (always current, even for rapid successive calls), update the ref
 * synchronously, then call `setEntries(next)` and `writeCompare(next)`
 * as separate statements — never inside a setState updater.
 */

import * as React from 'react'

const STORAGE_KEY = 'hoverlab:compare'
const MAX_ENTRIES = 4

function readCompare(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Coerce to strings, dedupe, cap.
    const seen = new Set<string>()
    const out: string[] = []
    for (const id of parsed) {
      if (typeof id !== 'string') continue
      if (seen.has(id)) continue
      seen.add(id)
      out.push(id)
      if (out.length >= MAX_ENTRIES) break
    }
    return out
  } catch {
    return []
  }
}

function writeCompare(next: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(next.slice(0, MAX_ENTRIES)),
    )
    window.dispatchEvent(new CustomEvent('hoverlab:compare-changed'))
  } catch {
    /* ignore quota / privacy errors */
  }
}

export function useCompare() {
  const [entries, setEntries] = React.useState<string[]>(() => readCompare())

  // Mirror the latest entries in a ref so action callbacks can compute
  // the next list without reading stale state, and so we can call
  // writeCompare(next) OUTSIDE the setEntries updater (which would run
  // during React's render phase and trigger the
  // "Cannot update a component while rendering a different component"
  // error via the synchronous dispatchEvent inside writeCompare).
  const entriesRef = React.useRef<string[]>(entries)
  React.useEffect(() => {
    entriesRef.current = entries
  }, [entries])

  React.useEffect(() => {
    const sync = () => setEntries(readCompare())
    window.addEventListener('storage', sync)
    window.addEventListener('hoverlab:compare-changed', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('hoverlab:compare-changed', sync)
    }
  }, [])

  const has = React.useCallback(
    (id: string) => entriesRef.current.includes(id),
    [],
  )

  /**
   * Add an effect to the compare list. Returns true if added, false if
   * the list was already full (the caller should toast a "compare is
   * full" message in that case).
   */
  const add = React.useCallback((id: string): boolean => {
    const current = entriesRef.current
    if (current.includes(id)) return true
    if (current.length >= MAX_ENTRIES) return false
    const next = [...current, id]
    entriesRef.current = next
    setEntries(next)
    writeCompare(next)
    return true
  }, [])

  const remove = React.useCallback((id: string) => {
    const current = entriesRef.current
    if (!current.includes(id)) return
    const next = current.filter((x) => x !== id)
    entriesRef.current = next
    setEntries(next)
    writeCompare(next)
  }, [])

  /**
   * Toggle an effect in/out of the compare list. If the list is full and
   * the effect is not already in it, this is a no-op and returns 'full'
   * so the caller can surface a friendly message.
   */
  const toggle = React.useCallback(
    (id: string): 'added' | 'removed' | 'full' => {
      const current = entriesRef.current
      if (current.includes(id)) {
        const next = current.filter((x) => x !== id)
        entriesRef.current = next
        setEntries(next)
        writeCompare(next)
        return 'removed'
      }
      if (current.length >= MAX_ENTRIES) return 'full'
      const next = [...current, id]
      entriesRef.current = next
      setEntries(next)
      writeCompare(next)
      return 'added'
    },
    [],
  )

  const clear = React.useCallback(() => {
    entriesRef.current = []
    setEntries([])
    writeCompare([])
  }, [])

  const count = entries.length
  const isFull = entries.length >= MAX_ENTRIES

  return { entries, has, add, remove, toggle, clear, count, isFull, max: MAX_ENTRIES }
}
