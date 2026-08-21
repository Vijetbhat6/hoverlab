'use client'

/**
 * Private collections, read and written against the server.
 *
 * Deliberately unlike `use-favorites` and `use-bundle`, which are
 * localStorage stores that sync opportunistically. There is no local mode
 * here: collections are the Pro feature that is genuinely enforceable
 * because the data lives on our server (see `api/sync/collections`), and a
 * localStorage fallback would hand the whole feature to free accounts while
 * the pricing page charges for it.
 *
 * What that costs is offline writes, which is the right trade for this
 * store — a collection is something you curate once in a while, not
 * something you touch on every card hover.
 *
 * Shared process-wide, for the same reason `use-entitlements` is: the
 * add-to-collection control renders once per artifact card, and a fetch per
 * card would be a hundred requests on /library. One load, one listener set,
 * one debounced push.
 */

import * as React from 'react'
import { useAuth } from '@/components/auth-provider'
import { useEntitlements } from '@/hooks/use-entitlements'
import {
  COLLECTION_LIMITS,
  newCollectionId,
  sortCollections,
  type Collection,
  type CollectionItem,
} from '@/lib/collections'

/** What the caller hands over when adding something to a collection. */
export interface AddableArtifact {
  id: string
  name: string
  category: string
  level?: CollectionItem['level']
}

/* ============================================================
   Shared store — module scope, deliberately.
   ============================================================ */

let collections: Collection[] = []
let loadedFor: string | null = null
let inflight: Promise<void> | null = null
/**
 * True when the last read came back 402 — a signed-in account with no Pro
 * licence. Distinct from "no collections yet": one is an upgrade prompt, the
 * other is an empty state with a create button.
 */
let locked = false
let loading = false
let pushTimer: ReturnType<typeof setTimeout> | null = null
let lastPushed: string | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((notify) => notify())
}

function reset() {
  collections = []
  loadedFor = null
  inflight = null
  locked = false
  loading = false
  lastPushed = null
  if (pushTimer) {
    clearTimeout(pushTimer)
    pushTimer = null
  }
}

async function load(userId: string): Promise<void> {
  if (loadedFor === userId) return
  if (inflight) return inflight

  loading = true
  emit()

  inflight = fetch('/api/sync/collections', {
    cache: 'no-store',
    credentials: 'same-origin',
  })
    .then(async (res) => {
      if (res.status === 402) {
        locked = true
        collections = []
        loadedFor = userId
        return
      }
      if (!res.ok) throw new Error(`collections: HTTP ${res.status}`)
      const body = (await res.json()) as { collections?: Collection[] }
      locked = false
      collections = sortCollections(body.collections ?? [])
      loadedFor = userId
    })
    .catch(() => {
      // Leave `loadedFor` unset so the next mount retries. Treating a failed
      // read as an empty list would let the next push replace the user's real
      // collections with nothing.
    })
    .finally(() => {
      inflight = null
      loading = false
      emit()
    })

  return inflight
}

/**
 * Send the current set, debounced.
 *
 * Gated on `loadedFor`, so it never fires before the first successful read:
 * a PUT is a wholesale replace, and pushing an empty array from a tab that
 * has not loaded yet would delete everything the account had.
 */
function schedulePush() {
  if (!loadedFor || locked) return

  const body = JSON.stringify({ collections })
  if (body === lastPushed) return

  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushTimer = null
    lastPushed = body
    fetch('/api/sync/collections', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`collections: HTTP ${res.status}`)
      })
      .catch(() => {
        // Let the next mutation retry rather than recording a failed send as
        // the server's known state.
        lastPushed = null
      })
  }, 500)
}

function commit(next: Collection[]) {
  collections = sortCollections(next)
  emit()
  schedulePush()
}

const now = () => new Date().toISOString()

/* ============================================================
   Hook
   ============================================================ */

export interface UseCollections {
  collections: Collection[]
  /** True while the first read is in flight. */
  loading: boolean
  /**
   * Signed in, but without a Pro licence. Callers render an upgrade prompt
   * rather than an empty state.
   */
  locked: boolean
  /** Signed out — collections are an account feature. */
  signedOut: boolean
  /** True when another collection can be created. */
  canCreate: boolean
  create: (name: string, description?: string) => Collection | null
  rename: (id: string, name: string, description?: string) => void
  remove: (id: string) => void
  /** Add an artifact. No-op when the collection is gone or already holds it. */
  addTo: (collectionId: string, artifact: AddableArtifact) => void
  removeFrom: (collectionId: string, artifactId: string) => void
  /** Ids of the collections that already contain this artifact. */
  containing: (artifactId: string) => string[]
}

export function useCollections(): UseCollections {
  const { user, loading: authLoading } = useAuth()
  const { entitlements } = useEntitlements()
  const userId = user?.id ?? null

  const [, forceRender] = React.useReducer((n: number) => n + 1, 0)

  React.useEffect(() => {
    listeners.add(forceRender)
    return () => {
      listeners.delete(forceRender)
    }
  }, [])

  React.useEffect(() => {
    if (authLoading) return
    if (!userId) {
      reset()
      forceRender()
      return
    }
    // A different user signing in on the same tab must not inherit the last
    // one's collections, even for the render before the fetch resolves.
    if (loadedFor && loadedFor !== userId) reset()
    void load(userId)
  }, [userId, authLoading])

  /*
   * Re-read after an upgrade.
   *
   * The read is cached on `loadedFor`, so an account that was refused with a
   * 402 stays refused for the life of the tab. That is exactly the tab
   * someone comes back to from Polar's redirect having just bought Pro — the
   * checkout flow refreshes entitlements, and without this the feature they
   * paid for a moment ago still shows them a paywall until a hard reload.
   *
   * Only in the locked -> unlocked direction. A lapsed licence should not
   * yank a half-finished edit out from under someone; the next push fails,
   * and the next load settles it.
   */
  const proNow = entitlements?.canUseProFeatures ?? false
  React.useEffect(() => {
    if (!userId || !proNow || !locked) return
    reset()
    void load(userId)
  }, [userId, proNow])

  /*
   * `locked` comes from the server's 402 once we have one, and from
   * entitlements before that. Preferring the server answer matters: it is
   * the one that actually decides, and a client trusting only entitlements
   * would render a working create button for the half-second before they
   * load, then throw the new collection away on the failed push.
   */
  const isLocked = loadedFor
    ? locked
    : entitlements
      ? !entitlements.canUseProFeatures
      : false

  const create = React.useCallback((name: string, description?: string) => {
    const trimmed = name.trim().slice(0, COLLECTION_LIMITS.nameLength)
    if (!trimmed) return null
    if (collections.length >= COLLECTION_LIMITS.perAccount) return null

    const stamp = now()
    const collection: Collection = {
      id: newCollectionId(),
      name: trimmed,
      description:
        description?.trim().slice(0, COLLECTION_LIMITS.descriptionLength) || undefined,
      items: [],
      createdAt: stamp,
      updatedAt: stamp,
    }
    commit([collection, ...collections])
    return collection
  }, [])

  const rename = React.useCallback(
    (id: string, name: string, description?: string) => {
      const trimmed = name.trim().slice(0, COLLECTION_LIMITS.nameLength)
      if (!trimmed) return
      commit(
        collections.map((c) =>
          c.id === id
            ? {
                ...c,
                name: trimmed,
                description:
                  description?.trim().slice(0, COLLECTION_LIMITS.descriptionLength) ||
                  undefined,
                updatedAt: now(),
              }
            : c,
        ),
      )
    },
    [],
  )

  const remove = React.useCallback((id: string) => {
    commit(collections.filter((c) => c.id !== id))
  }, [])

  const addTo = React.useCallback((collectionId: string, artifact: AddableArtifact) => {
    const target = collections.find((c) => c.id === collectionId)
    if (!target) return
    if (target.items.some((item) => item.id === artifact.id)) return
    if (target.items.length >= COLLECTION_LIMITS.itemsPerCollection) return

    const item: CollectionItem = {
      id: artifact.id,
      name: artifact.name,
      category: artifact.category,
      level: artifact.level,
      addedAt: now(),
    }
    commit(
      collections.map((c) =>
        // Newest first — a collection is read top-down, and the thing you
        // just put in it is the thing you are looking for.
        c.id === collectionId
          ? { ...c, items: [item, ...c.items], updatedAt: now() }
          : c,
      ),
    )
  }, [])

  const removeFrom = React.useCallback(
    (collectionId: string, artifactId: string) => {
      commit(
        collections.map((c) =>
          c.id === collectionId
            ? {
                ...c,
                items: c.items.filter((item) => item.id !== artifactId),
                updatedAt: now(),
              }
            : c,
        ),
      )
    },
    [],
  )

  const containing = React.useCallback(
    (artifactId: string) =>
      collections
        .filter((c) => c.items.some((item) => item.id === artifactId))
        .map((c) => c.id),
    [],
  )

  return {
    collections,
    loading: loading || authLoading,
    locked: isLocked,
    signedOut: !authLoading && !userId,
    canCreate: !isLocked && collections.length < COLLECTION_LIMITS.perAccount,
    create,
    rename,
    remove,
    addTo,
    removeFrom,
    containing,
  }
}
