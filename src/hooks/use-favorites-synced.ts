'use client'

/**
 * useSyncedFavorites
 *
 * Wraps the localStorage-based favorites with cloud sync:
 *  - When the user logs in (transitions from null → user), merge any
 *    local favorites with the ones already stored on the server, then
 *    PUT the merged set so the server is up to date.
 *  - When the user toggles a favorite AND they're logged in, debounce-
 *    PUT the new state to the server.
 *  - When logged out, behaves exactly like the original useFavorites
 *    (localStorage only) — no data loss for anonymous users.
 */

import * as React from 'react'
import { useAuth } from '@/components/auth-provider'
import { useFavorites as useFavoritesBase } from '@/hooks/use-favorites'

const FAVORITES_KEY = 'cssfx:favorites'

function readLocalFavorites(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as string[]
    return new Set(parsed)
  } catch {
    return new Set()
  }
}

function writeLocalFavorites(next: Set<string>) {
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]))
    window.dispatchEvent(new CustomEvent('cssfx:favorites-changed'))
  } catch {
    /* ignore */
  }
}

export function useFavorites() {
  const base = useFavoritesBase()
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? null

  // Track whether we've completed the initial sync for the current user.
  // We sync once per login transition.
  const syncedForUser = React.useRef<string | null>(null)

  // Initial cloud pull + merge on login.
  React.useEffect(() => {
    if (authLoading) return
    if (!userId) {
      // Logged out — reset the sync tracker so a re-login re-syncs.
      syncedForUser.current = null
      return
    }
    if (syncedForUser.current === userId) return
    syncedForUser.current = userId

    let cancelled = false
    ;(async () => {
      try {
        const localSet = readLocalFavorites()
        const [serverRes] = await Promise.all([
          fetch('/api/sync/favorites', { credentials: 'same-origin' }),
        ])
        if (!serverRes.ok) return
        const data = (await serverRes.json()) as { favorites: string[] }
        if (cancelled) return

        const serverSet = new Set(data.favorites ?? [])
        // Merge: union of local + server.
        const merged = new Set<string>([...serverSet, ...localSet])

        // Write merged set to localStorage so the base hook picks it up.
        writeLocalFavorites(merged)
        // Manually update base state via toggle trick: we can't call setFavorites
        // directly, so we re-dispatch the storage event pattern. The base hook
        // listens for 'cssfx:favorites-changed' and will re-read.
        // That's already triggered by writeLocalFavorites above.

        // Push merged set up to the server.
        await fetch('/api/sync/favorites', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ favorites: [...merged] }),
        })
      } catch {
        /* network errors are non-fatal — local data is still intact */
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
    // Skip the very first emit (initial mount / hydration).
    if (syncedForUser.current !== userId) return
    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => {
      const list = [...base.favorites]
      fetch('/api/sync/favorites', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ favorites: list }),
      }).catch(() => {})
    }, 600)
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current)
    }
  }, [base.favorites, userId])

  return base
}
