'use client'

/**
 * Favorites hook with optional cloud sync.
 *
 * Behavior:
 *  - When the user is logged in (via useAuth), favorites are also synced
 *    to the server (/api/sync/favorites). On login, local + server state
 *    are merged (union) and pushed back up. Subsequent changes are
 *    debounce-PUT to the server.
 *  - When the user is logged out, this is plain localStorage (the
 *    original behavior) — so anonymous users don't lose any data.
 *
 * Storage layout:
 *  - localStorage key 'cssfx:favorites' holds the JSON-stringified list
 *    of effectIds (the source of truth on the client).
 *  - Cross-tab sync is handled via the 'storage' event + a same-tab
 *    'cssfx:favorites-changed' custom event (the base pattern).
 */

import * as React from 'react'
import { useAuth } from '@/components/auth-provider'

const STORAGE_KEY = 'cssfx:favorites'

function readFavorites(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as string[]
    return new Set(parsed)
  } catch {
    return new Set()
  }
}

function writeFavorites(next: Set<string>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
    // Notify other hook instances in the same tab.
    window.dispatchEvent(new CustomEvent('cssfx:favorites-changed'))
  } catch {
    /* ignore quota / privacy errors */
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = React.useState<Set<string>>(() => readFavorites())
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? null

  // Mirror the latest favorites in a ref so that `toggle` can compute the
  // next set without reading stale state. Critically, this lets us call
  // `writeFavorites(next)` OUTSIDE the setFavorites updater — calling it
  // inside the updater runs during React's render phase, and the
  // synchronous `dispatchEvent` inside writeFavorites then triggers other
  // components' `sync` listeners (which call setFavorites) while we're
  // still rendering, producing:
  //   "Cannot update a component (`Home`) while rendering a different
  //    component (`EffectCard`)"
  const favoritesRef = React.useRef<Set<string>>(favorites)
  React.useEffect(() => {
    favoritesRef.current = favorites
  }, [favorites])

  React.useEffect(() => {
    const sync = () => setFavorites(readFavorites())
    window.addEventListener('storage', sync)
    window.addEventListener('cssfx:favorites-changed', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('cssfx:favorites-changed', sync)
    }
  }, [])

  /* ---------------- Cloud sync ---------------- */
  // Track which user we've already done the initial merge for.
  const syncedForUser = React.useRef<string | null>(null)
  // Track whether we've completed the initial mount (so we don't push
  // the initial state back to the server as a "change").
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
      // Logged out: reset the tracker so a future re-login re-syncs.
      syncedForUser.current = null
      return
    }
    if (syncedForUser.current === userId) return
    syncedForUser.current = userId

    let cancelled = false
    ;(async () => {
      try {
        const localSet = readFavorites()
        const res = await fetch('/api/sync/favorites', {
          credentials: 'same-origin',
        })
        if (!res.ok) return
        const data = (await res.json()) as { favorites: string[] }
        if (cancelled) return

        const serverSet = new Set<string>(data.favorites ?? [])
        // Union: anything in either local or server is kept.
        const merged = new Set<string>([...serverSet, ...localSet])

        writeFavorites(merged)
        favoritesRef.current = merged // keep ref in sync with the merged set
        setFavorites(merged)

        // Push the merged set up so server matches local.
        await fetch('/api/sync/favorites', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ favorites: [...merged] }),
        })
      } catch {
        /* network errors are non-fatal — local data is intact */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId, authLoading])

  // Debounced push on local changes (only after the initial sync has
  // completed for the current user).
  const pushTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  React.useEffect(() => {
    if (!userId) return
    if (syncedForUser.current !== userId) return
    // Skip the very first emit (the merge effect above already pushed).
    if (!mountedRef.current) return
    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => {
      const list = [...favorites]
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
  }, [favorites, userId])

  /* ---------------- Local actions ---------------- */
  const toggle = React.useCallback((id: string) => {
    // Compute next from the ref (always current), then call setFavorites
    // and writeFavorites as separate statements. This avoids running
    // writeFavorites (which dispatches a synchronous custom event) inside
    // the setFavorites updater — that updater executes during React's
    // render phase, and the event listener it triggers would call
    // setFavorites on other components mid-render.
    const next = new Set(favoritesRef.current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    favoritesRef.current = next // keep ref in sync for rapid successive toggles
    setFavorites(next)
    writeFavorites(next)
  }, [])

  const has = React.useCallback(
    (id: string) => favorites.has(id),
    [favorites],
  )

  const count = favorites.size

  return { favorites, has, toggle, count }
}
