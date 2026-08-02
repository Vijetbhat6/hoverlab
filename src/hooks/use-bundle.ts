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
import { track } from '@/lib/analytics'
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

/* ============================================================
 *  Cloud sync coordinator — module scope, for the same reason as
 *  use-favorites.ts: useBundle is called once per EffectCard, so
 *  instance-level refs turned one login into one destructive PUT per
 *  mounted card. See the comment there for the full story.
 * ========================================================== */

/** User whose merge has been started (in flight or finished). */
let syncStartedFor: string | null = null
/**
 * User whose merge has *succeeded*. Pushes are gated on this so a fresh
 * browser can never overwrite the account's saved bundle with its own empty
 * local one before the server list has been read.
 */
let syncReadyFor: string | null = null
let pushTimer: ReturnType<typeof setTimeout> | null = null
/** Payload of the last push, to suppress redundant re-sends. */
let lastPushed: string | null = null

function resetSyncState() {
  syncStartedFor = null
  syncReadyFor = null
  lastPushed = null
  if (pushTimer) {
    clearTimeout(pushTimer)
    pushTimer = null
  }
}

function schedulePush(entries: BundleEntry[]) {
  const body = JSON.stringify({ entries })
  // Suppress the echo: the merge's localStorage write wakes every mounted
  // instance, each of which re-runs its push effect with the same list.
  if (body === lastPushed) return

  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushTimer = null
    lastPushed = body
    fetch('/api/sync/bundle', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body,
    }).catch(() => {
      lastPushed = null
    })
  }, 600)
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
  // Initial cloud pull + merge on login transition. Coordinator state is
  // module-level, so the first instance here does the work for all of them.
  React.useEffect(() => {
    if (authLoading) return
    if (!userId) {
      resetSyncState()
      return
    }
    if (syncStartedFor === userId) return
    syncStartedFor = userId

    let cancelled = false
    ;(async () => {
      try {
        const local = readBundle()
        const res = await fetch('/api/sync/bundle', {
          credentials: 'same-origin',
        })
        if (!res.ok) throw new Error(`sync/bundle ${res.status}`)
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

        // Mark the merged list as already-sent before the localStorage write
        // wakes the other instances, so it isn't echoed back as a push.
        lastPushed = JSON.stringify({ entries: merged })
        syncReadyFor = userId

        writeBundle(merged)
        entriesRef.current = merged // keep ref in sync with the merged list
        setEntries(merged)

        await fetch('/api/sync/bundle', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: lastPushed,
        })
      } catch {
        // Non-fatal — local data is intact. Roll back the start marker so a
        // later mount retries, and leave syncReadyFor unset so nothing
        // pushes over server state we never read.
        if (syncStartedFor === userId) syncStartedFor = null
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId, authLoading])

  // Debounced push on local changes — only once the merge has succeeded.
  React.useEffect(() => {
    if (!userId || syncReadyFor !== userId) return
    schedulePush(entries)
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
    track('bundle_add', { effect_id: effectId, bundle_size: next.length })
  }, [])

  const remove = React.useCallback((effectId: string) => {
    const next = entriesRef.current.filter((e) => e.effectId !== effectId)
    entriesRef.current = next
    setEntries(next)
    writeBundle(next)
    track('bundle_remove', { effect_id: effectId, bundle_size: next.length })
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
