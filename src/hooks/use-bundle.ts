'use client'

/**
 * Bundle hook with optional cloud sync — mirrors useFavorites.
 *
 * Storage layout:
 *  - localStorage key 'cssfx:bundle' holds the JSON-stringified list
 *    of BundleEntry objects (source of truth on the client).
 *  - When logged in, also synced to /api/sync/bundle.
 */

import * as React from 'react'
import { useAuth } from '@/components/auth-provider'

/**
 * A single entry in the user's bundle. We store the customization opts
 * that were active when the user clicked "Add to bundle" so the exported
 * CSS reflects their tweaks (hue / saturation / size / speed).
 */
export interface BundleEntry {
  effectId: string
  /** Customization opts at the time of add. */
  opts: {
    hue: number
    saturation: number
    scale: number
    speed: number
  }
  /** ISO timestamp — used for sorting (most recently added first). */
  addedAt: string
}

const STORAGE_KEY = 'cssfx:bundle'

function readBundle(): BundleEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as BundleEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function writeBundle(next: BundleEntry[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    // Notify other hook instances in the same tab.
    window.dispatchEvent(new CustomEvent('cssfx:bundle-changed'))
  } catch {
    /* ignore quota / privacy errors */
  }
}

export function useBundle() {
  const [entries, setEntries] = React.useState<BundleEntry[]>(() => readBundle())
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? null

  // Mirror the latest entries in a ref so that `add` / `remove` / `clear`
  // can compute the next list without reading stale state. Critically,
  // this lets us call `writeBundle(next)` OUTSIDE the setEntries updater
  // — calling it inside the updater runs during React's render phase, and
  // the synchronous `dispatchEvent` inside writeBundle then triggers other
  // components' `sync` listeners (which call setEntries) while we're still
  // rendering, producing:
  //   "Cannot update a component (`Home`) while rendering a different
  //    component (`EffectCard`)"
  const entriesRef = React.useRef<BundleEntry[]>(entries)
  React.useEffect(() => {
    entriesRef.current = entries
  }, [entries])

  React.useEffect(() => {
    const sync = () => setEntries(readBundle())
    window.addEventListener('storage', sync)
    window.addEventListener('cssfx:bundle-changed', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('cssfx:bundle-changed', sync)
    }
  }, [])

  /* ---------------- Cloud sync ---------------- */
  const syncedForUser = React.useRef<string | null>(null)
  const mountedRef = React.useRef(false)

  React.useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Initial cloud pull + merge on login transition.
  React.useEffect(() => {
    if (authLoading) return
    if (!userId) {
      syncedForUser.current = null
      return
    }
    if (syncedForUser.current === userId) return
    syncedForUser.current = userId

    let cancelled = false
    ;(async () => {
      try {
        const local = readBundle()
        const res = await fetch('/api/sync/bundle', {
          credentials: 'same-origin',
        })
        if (!res.ok) return
        const data = (await res.json()) as { entries: BundleEntry[] }
        if (cancelled) return

        const server = Array.isArray(data.entries) ? data.entries : []

        // Merge by effectId, prefer the most recently added entry.
        const byId = new Map<string, BundleEntry>()
        for (const e of server) byId.set(e.effectId, e)
        for (const e of local) {
          const existing = byId.get(e.effectId)
          if (!existing) {
            byId.set(e.effectId, e)
          } else {
            const t1 = Date.parse(existing.addedAt) || 0
            const t2 = Date.parse(e.addedAt) || 0
            if (t2 > t1) byId.set(e.effectId, e)
          }
        }
        const merged = [...byId.values()].sort(
          (a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt),
        )

        writeBundle(merged)
        entriesRef.current = merged // keep ref in sync with the merged list
        setEntries(merged)

        await fetch('/api/sync/bundle', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ entries: merged }),
        })
      } catch {
        /* network errors are non-fatal */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId, authLoading])

  // Debounced push on local changes.
  const pushTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  React.useEffect(() => {
    if (!userId) return
    if (syncedForUser.current !== userId) return
    if (!mountedRef.current) return
    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => {
      fetch('/api/sync/bundle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ entries }),
      }).catch(() => {})
    }, 600)
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current)
    }
  }, [entries, userId])

  /* ---------------- Local actions ---------------- */
  const has = React.useCallback(
    (effectId: string) => entries.some((e) => e.effectId === effectId),
    [entries],
  )

  const get = React.useCallback(
    (effectId: string) => entries.find((e) => e.effectId === effectId),
    [entries],
  )

  const add = React.useCallback((effectId: string, opts: BundleEntry['opts']) => {
    // Compute next from the ref (always current), then call setEntries
    // and writeBundle as separate statements. This avoids running
    // writeBundle (which dispatches a synchronous custom event) inside
    // the setEntries updater — that updater executes during React's
    // render phase, and the event listener it triggers would call
    // setEntries on other components mid-render.
    const without = entriesRef.current.filter((e) => e.effectId !== effectId)
    const next = [
      { effectId, opts, addedAt: new Date().toISOString() },
      ...without,
    ]
    entriesRef.current = next // keep ref in sync for rapid successive calls
    setEntries(next)
    writeBundle(next)
  }, [])

  const remove = React.useCallback((effectId: string) => {
    const next = entriesRef.current.filter((e) => e.effectId !== effectId)
    entriesRef.current = next
    setEntries(next)
    writeBundle(next)
  }, [])

  const toggle = React.useCallback(
    (effectId: string, opts: BundleEntry['opts']) => {
      if (has(effectId)) {
        remove(effectId)
      } else {
        add(effectId, opts)
      }
    },
    [has, add, remove],
  )

  const clear = React.useCallback(() => {
    entriesRef.current = []
    setEntries([])
    writeBundle([])
  }, [])

  const count = entries.length

  return { entries, has, get, add, remove, toggle, clear, count }
}
