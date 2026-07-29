'use client'

/**
 * Remix hook — lets users save a customized variant of any effect as
 * their own private remix. Each remix stores the source effect ID +
 * the customization options + a snapshot of the customized CSS so the
 * rail can render a live preview without re-running `customizeCss`.
 *
 * Pure localStorage — no cloud sync (same as compare + recently-viewed;
 * these are personal "working memory" lists, not curated collections
 * that need cross-device persistence like favorites).
 *
 * Storage layout:
 *  - localStorage key 'hoverlab:remixes' holds a JSON-stringified
 *    array of RemixEntry objects (newest first).
 *  - Cross-tab sync via 'storage' event + same-tab sync via
 *    'hoverlab:remixes-changed' custom event.
 *
 * Follows the same ref-mirror pattern as use-favorites / use-bundle /
 * use-compare / use-recently-viewed to avoid the React render-phase
 * setState bug (Task 16).
 */

import * as React from 'react'
import type { CustomizationOptions } from '@/lib/customize'

export interface RemixEntry {
  /** Stable ID for this remix: `<effectId>-<createdAt>`. */
  id: string
  /** The source effect this remix is based on. */
  effectId: string
  /** Snapshot of the effect name at save time (so the rail can render
   *  without looking up the effect in the catalog). */
  effectName: string
  effectCategory: string
  /** The customization opts applied to the source effect. */
  opts: CustomizationOptions
  /** Snapshot of the customized CSS at save time. */
  customizedCss: string
  /** The original effect HTML (so the rail can render a live preview). */
  html: string
  /** Whether the source effect prefers a dark preview surface. */
  darkSurface: boolean
  /** ISO timestamp — for sorting + display. */
  createdAt: string
}

const STORAGE_KEY = 'hoverlab:remixes'
const MAX_ENTRIES = 24

function readRemixes(): RemixEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Defensive: filter out malformed entries.
    return parsed
      .filter((e): e is RemixEntry =>
        e &&
        typeof e === 'object' &&
        typeof e.id === 'string' &&
        typeof e.effectId === 'string' &&
        typeof e.customizedCss === 'string'
      )
      .slice(0, MAX_ENTRIES)
  } catch {
    return []
  }
}

function writeRemixes(next: RemixEntry[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(next.slice(0, MAX_ENTRIES)),
    )
    window.dispatchEvent(new CustomEvent('hoverlab:remixes-changed'))
  } catch {
    /* ignore quota / privacy errors */
  }
}

export function useRemixes() {
  const [entries, setEntries] = React.useState<RemixEntry[]>(() => readRemixes())

  // Mirror latest entries in a ref so action callbacks compute next state
  // without reading stale state, and so we can call writeRemixes(next)
  // OUTSIDE the setEntries updater (which would run during React's render
  // phase and trigger the "Cannot update a component while rendering a
  // different component" error via the synchronous dispatchEvent inside
  // writeRemixes).
  const entriesRef = React.useRef<RemixEntry[]>(entries)
  React.useEffect(() => {
    entriesRef.current = entries
  }, [entries])

  React.useEffect(() => {
    const sync = () => setEntries(readRemixes())
    window.addEventListener('storage', sync)
    window.addEventListener('hoverlab:remixes-changed', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('hoverlab:remixes-changed', sync)
    }
  }, [])

  /**
   * Save a new remix. If the same effect+opts combination already
   * exists (same effectId AND same opts), the existing entry is moved
   * to the top instead of creating a duplicate.
   */
  const save = React.useCallback(
    (input: Omit<RemixEntry, 'id' | 'createdAt'>): RemixEntry => {
      const createdAt = new Date().toISOString()
      // Use crypto.randomUUID when available (modern browsers + Node),
      // fall back to a timestamp+random string. Don't use Date.now()
      // alone — rapid successive saves in the same millisecond would
      // collide and produce duplicate IDs.
      const randomSuffix =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      const id = `${input.effectId}-${randomSuffix}`
      const entry: RemixEntry = { ...input, id, createdAt }
      const current = entriesRef.current
      // Dedup: if same effectId + identical opts already exists, drop the
      // old one and prepend the new (refreshes the timestamp). This keeps
      // the rail tidy when the user re-saves the same combo.
      const without = current.filter((e) => {
        if (e.effectId !== input.effectId) return true
        return !optsEqual(e.opts, input.opts)
      })
      const next = [entry, ...without].slice(0, MAX_ENTRIES)
      entriesRef.current = next
      setEntries(next)
      writeRemixes(next)
      return entry
    },
    [],
  )

  const remove = React.useCallback((id: string) => {
    const next = entriesRef.current.filter((e) => e.id !== id)
    entriesRef.current = next
    setEntries(next)
    writeRemixes(next)
  }, [])

  const clear = React.useCallback(() => {
    entriesRef.current = []
    setEntries([])
    writeRemixes([])
  }, [])

  /**
   * Returns true if a remix with the same effectId + opts already
   * exists. Used by the UI to show "Saved" state on the button.
   */
  const hasRemix = React.useCallback(
    (effectId: string, opts: CustomizationOptions): boolean => {
      return entriesRef.current.some(
        (e) => e.effectId === effectId && optsEqual(e.opts, opts),
      )
    },
    [],
  )

  const count = entries.length

  return { entries, save, remove, clear, hasRemix, count, max: MAX_ENTRIES }
}

/* ============================================================
 *  Helpers
 * ========================================================== */

function optsEqual(a: CustomizationOptions, b: CustomizationOptions): boolean {
  return (
    a.hue === b.hue &&
    a.saturation === b.saturation &&
    a.scale === b.scale &&
    a.speed === b.speed
  )
}
