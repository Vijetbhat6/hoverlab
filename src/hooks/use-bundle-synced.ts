'use client'

/**
 * useSyncedBundle
 *
 * Wraps the localStorage-based bundle with cloud sync — same pattern
 * as useSyncedFavorites:
 *  - On login: merge local bundle with server bundle, write merged
 *    result to both localStorage and the server.
 *  - On any local mutation while logged in: debounce-PUT to the server.
 *  - When logged out: behaves like the original useBundle (localStorage
 *    only) — no data loss for anonymous users.
 */

import * as React from 'react'
import { useAuth } from '@/components/auth-provider'
import { useBundle as useBundleBase, type BundleEntry } from '@/hooks/use-bundle'

const BUNDLE_KEY = 'cssfx:bundle'

function readLocalBundle(): BundleEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(BUNDLE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as BundleEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function writeLocalBundle(next: BundleEntry[]) {
  try {
    window.localStorage.setItem(BUNDLE_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent('cssfx:bundle-changed'))
  } catch {
    /* ignore */
  }
}

export function useBundle() {
  const base = useBundleBase()
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? null

  const syncedForUser = React.useRef<string | null>(null)

  // Initial cloud pull + merge on login.
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
        const local = readLocalBundle()
        const res = await fetch('/api/sync/bundle', { credentials: 'same-origin' })
        if (!res.ok) return
        const data = (await res.json()) as { entries: BundleEntry[] }
        if (cancelled) return

        const server = Array.isArray(data.entries) ? data.entries : []

        // Merge: union by effectId, prefer the most recent addedAt.
        const byId = new Map<string, BundleEntry>()
        for (const e of server) byId.set(e.effectId, e)
        for (const e of local) {
          const existing = byId.get(e.effectId)
          if (!existing) {
            byId.set(e.effectId, e)
          } else {
            // Prefer the more recently added entry's opts.
            const t1 = Date.parse(existing.addedAt) || 0
            const t2 = Date.parse(e.addedAt) || 0
            if (t2 > t1) byId.set(e.effectId, e)
          }
        }
        const merged = [...byId.values()].sort(
          (a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt),
        )

        writeLocalBundle(merged)

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

  // Debounced push on local changes (only when logged in).
  const pushTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  React.useEffect(() => {
    if (!userId) return
    if (syncedForUser.current !== userId) return
    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => {
      fetch('/api/sync/bundle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ entries: base.entries }),
      }).catch(() => {})
    }, 600)
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current)
    }
  }, [base.entries, userId])

  return base
}
