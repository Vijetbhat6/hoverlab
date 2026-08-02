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

/* ============================================================
 *  Cloud sync coordinator — module scope, deliberately.
 *
 *  useFavorites is called by every EffectCard, so a /library page has one
 *  hook instance per card. Holding this state in refs made each instance
 *  its own independent syncer: a single login fired one merge *and one
 *  destructive PUT per mounted card* — measured at 102 requests, each a
 *  delete-everything-then-reinsert transaction, all racing to decide the
 *  server's list. Hoisting the coordinator out of the component makes it
 *  exactly one merge and one push no matter how many cards are on screen.
 * ========================================================== */

/** User whose merge has been started (in flight or finished). */
let syncStartedFor: string | null = null
/**
 * User whose merge has *succeeded*. Pushes are gated on this, not on
 * `syncStartedFor`: pushing local state before the server's list has been
 * read and merged is how a fresh browser overwrites everything the account
 * had saved. If the merge fails, no push is allowed to happen.
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

function schedulePush(list: string[]) {
  const body = JSON.stringify({ favorites: list })
  // The merge writes to localStorage, which wakes every mounted instance,
  // each of which then re-runs its push effect with the same set. Without
  // this the merge result alone would be echoed back once per card.
  if (body === lastPushed) return

  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushTimer = null
    lastPushed = body
    fetch('/api/sync/favorites', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body,
    }).catch(() => {
      // Let the next change retry rather than treating a failed send as
      // the server's known state.
      lastPushed = null
    })
  }, 600)
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
  // Initial cloud pull + merge on login transition. The coordinator state is
  // module-level, so whichever instance gets here first does the work and
  // every other instance falls straight through.
  React.useEffect(() => {
    if (authLoading) return
    if (!userId) {
      // Logged out: clear the trackers so a future re-login re-syncs, and so
      // the next account never inherits this one's push state.
      resetSyncState()
      return
    }
    if (syncStartedFor === userId) return
    syncStartedFor = userId

    let cancelled = false
    ;(async () => {
      try {
        const localSet = readFavorites()
        const res = await fetch('/api/sync/favorites', {
          credentials: 'same-origin',
        })
        if (!res.ok) throw new Error(`sync/favorites ${res.status}`)
        const data = (await res.json()) as { favorites: string[] }
        if (cancelled) return

        const serverSet = new Set<string>(data.favorites ?? [])
        // Union: anything in either local or server is kept.
        const merged = new Set<string>([...serverSet, ...localSet])
        const list = [...merged]

        // Record the merged set as already-sent before waking the other
        // instances, so the localStorage write below doesn't bounce straight
        // back as a redundant push.
        lastPushed = JSON.stringify({ favorites: list })
        syncReadyFor = userId

        writeFavorites(merged)
        favoritesRef.current = merged // keep ref in sync with the merged set
        setFavorites(merged)

        // Push the merged set up so server matches local.
        await fetch('/api/sync/favorites', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: lastPushed,
        })
      } catch {
        // Network errors are non-fatal — local data is intact. Roll the
        // start marker back so a later mount retries, and leave syncReadyFor
        // unset so nothing pushes over server state we never managed to read.
        if (syncStartedFor === userId) syncStartedFor = null
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId, authLoading])

  // Debounced push on local changes — only once the initial merge for this
  // user has actually succeeded.
  React.useEffect(() => {
    if (!userId || syncReadyFor !== userId) return
    schedulePush([...favorites])
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
