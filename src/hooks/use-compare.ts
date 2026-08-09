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
import type { ArtifactLevel } from '@/lib/artifact-types'

const STORAGE_KEY = 'hoverlab:compare'
const MAX_ENTRIES = 4

/**
 * One queued artifact.
 *
 * The list used to be bare id strings, which was enough while everything in
 * it was an effect. The drawer now has to know what an id *is* before it
 * can resolve it — an effect resolves through `/api/effects/batch`, a block
 * through `/api/v1/artifacts/{id}` — and guessing by trying one and falling
 * back to the other would make every block wait on a failed request.
 *
 * `level` absent means `'effect'`, which is exactly what a migrated bare
 * string means.
 */
export interface CompareRef {
  id: string
  level?: ArtifactLevel
  name?: string
  category?: string
}

/** Migrate a stored row: a bare string is a pre-ladder effect id. */
function normalizeRef(raw: unknown): CompareRef | null {
  if (typeof raw === 'string') return raw ? { id: raw } : null
  if (!raw || typeof raw !== 'object') return null
  const ref = raw as CompareRef
  if (typeof ref.id !== 'string' || !ref.id) return null
  return { id: ref.id, level: ref.level, name: ref.name, category: ref.category }
}

function readCompare(): CompareRef[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Normalize, dedupe by id, cap.
    const seen = new Set<string>()
    const out: CompareRef[] = []
    for (const item of parsed) {
      const ref = normalizeRef(item)
      if (!ref || seen.has(ref.id)) continue
      seen.add(ref.id)
      out.push(ref)
      if (out.length >= MAX_ENTRIES) break
    }
    return out
  } catch {
    return []
  }
}

function writeCompare(next: CompareRef[]) {
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
  /**
   * Starts EMPTY rather than seeded from localStorage.
   *
   * Seeding here (`useState(() => readCompare())`) is a hydration bug, the
   * same one use-copy-history.ts and use-recently-viewed.ts already avoid:
   * the server has no localStorage so it renders "Compare", while the
   * client's very first render already has the stored list and renders
   * "Comparing". React sees two different trees and throws the server HTML
   * away. Reading in the effect below means both sides agree on "empty",
   * and the real list arrives on the commit after.
   */
  const [entries, setEntries] = React.useState<CompareRef[]>(() => [])

  // Mirror the latest entries in a ref so action callbacks can compute
  // the next list without reading stale state, and so we can call
  // writeCompare(next) OUTSIDE the setEntries updater (which would run
  // during React's render phase and trigger the
  // "Cannot update a component while rendering a different component"
  // error via the synchronous dispatchEvent inside writeCompare).
  const entriesRef = React.useRef<CompareRef[]>(entries)
  React.useEffect(() => {
    entriesRef.current = entries
  }, [entries])

  React.useEffect(() => {
    const sync = () => setEntries(readCompare())
    // Populate on mount — see the note on the initial state above.
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener('hoverlab:compare-changed', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('hoverlab:compare-changed', sync)
    }
  }, [])

  /**
   * Reads `entries`, not `entriesRef` — the ref is written by an effect that
   * runs *after* the render it belongs to, so a `has` that read it was one
   * render stale for every change this instance did not make itself.
   * Removing an artifact in the compare drawer left the card's button still
   * saying "Comparing" until some unrelated re-render corrected it, because
   * the event listener above re-rendered the card while its ref still held
   * the old list. `add`/`remove`/`toggle` keep using the ref: they write it
   * synchronously before calling setEntries, which is what makes rapid
   * successive clicks correct.
   */
  const has = React.useCallback(
    (id: string) => entries.some((e) => e.id === id),
    [entries],
  )

  /**
   * Add an effect to the compare list. Returns true if added, false if
   * the list was already full (the caller should toast a "compare is
   * full" message in that case).
   */
  const add = React.useCallback((artifact: CompareRef): boolean => {
    const current = entriesRef.current
    if (current.some((e) => e.id === artifact.id)) return true
    if (current.length >= MAX_ENTRIES) return false
    const next = [...current, artifact]
    entriesRef.current = next
    setEntries(next)
    writeCompare(next)
    return true
  }, [])

  const remove = React.useCallback((id: string) => {
    const current = entriesRef.current
    if (!current.some((e) => e.id === id)) return
    const next = current.filter((x) => x.id !== id)
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
    (artifact: CompareRef): 'added' | 'removed' | 'full' => {
      const current = entriesRef.current
      if (current.some((e) => e.id === artifact.id)) {
        const next = current.filter((x) => x.id !== artifact.id)
        entriesRef.current = next
        setEntries(next)
        writeCompare(next)
        return 'removed'
      }
      if (current.length >= MAX_ENTRIES) return 'full'
      const next = [...current, artifact]
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
