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
import { levelOf, type ArtifactLevel } from '@/lib/artifact-types'

/** Effect customization, captured at the moment of adding. */
export interface BundleOpts {
  hue: number
  saturation: number
  scale: number
  speed: number
}

/**
 * A single entry in the user's bundle, at any rung of the ladder.
 *
 * Keyed on a bare `id` because ids are unique across all four catalogs —
 * the same property `artifact-history.ts` and the favorites store rely on.
 * `level` rides along so the drawer can route and export an entry without
 * loading a catalog to discover what it is.
 *
 * `opts` is effect-only. Hue, saturation, scale and speed are knobs on a
 * generated stylesheet; a block is hand-written TSX with no equivalent, so
 * the field is absent rather than filled with meaningless defaults —
 * `resolveBundle` keys off its presence.
 *
 * `name` and `category` are denormalized so the drawer can render a row
 * before the source has been fetched. Same trade as `ArtifactRef`: a stale
 * name on a renamed artifact is cheaper than importing a catalog.
 */
export interface BundleEntry {
  id: string
  /** Absent means `'effect'` — what makes pre-ladder entries still resolve. */
  level?: ArtifactLevel
  name?: string
  category?: string
  /** Effect-only customization at the time of add. */
  opts?: BundleOpts
  /** ISO timestamp — used for sorting (most recently added first). */
  addedAt: string
}

/** What `add` / `toggle` accept. */
export interface BundleArtifact {
  id: string
  name?: string
  category?: string
  level?: ArtifactLevel
}

const STORAGE_KEY = 'cssfx:bundle'

/** An entry as written before the ladder existed. */
interface LegacyBundleEntry {
  effectId?: string
}

/**
 * Migrate one stored entry, renaming the legacy `effectId` key.
 *
 * Returns null for junk. A bundle is user-curated and worth more than a
 * history rail, so this is conservative: only an entry with no usable id at
 * all is dropped.
 */
function normalizeEntry(raw: unknown): BundleEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const entry = raw as BundleEntry & LegacyBundleEntry

  const id = entry.id ?? entry.effectId
  if (!id || typeof id !== 'string') return null

  return {
    id,
    level: entry.level,
    name: entry.name,
    category: entry.category,
    opts: entry.opts,
    addedAt: typeof entry.addedAt === 'string' ? entry.addedAt : new Date(0).toISOString(),
  }
}

/** Normalize a list from storage or the server, dropping unusable rows. */
export function normalizeEntries(raw: unknown): BundleEntry[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeEntry).filter((e): e is BundleEntry => e !== null)
}

function readBundle(): BundleEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return normalizeEntries(JSON.parse(raw))
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

        // Normalized on the way in: the server holds rows written by older
        // clients under `effectId`, and merging those against migrated local
        // entries by a key one side does not have would duplicate every one.
        const server = normalizeEntries(data.entries)

        // Merge by id, prefer the most recently added entry.
        const byId = new Map<string, BundleEntry>()
        for (const e of server) byId.set(e.id, e)
        for (const e of local) {
          const existing = byId.get(e.id)
          if (!existing) {
            byId.set(e.id, e)
          } else {
            const t1 = Date.parse(existing.addedAt) || 0
            const t2 = Date.parse(e.addedAt) || 0
            if (t2 > t1) byId.set(e.id, e)
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
    (id: string) => entries.some((e) => e.id === id),
    [entries],
  )

  const get = React.useCallback(
    (id: string) => entries.find((e) => e.id === id),
    [entries],
  )

  const add = React.useCallback((artifact: BundleArtifact, opts?: BundleOpts) => {
    // Compute next from the ref (always current), then call setEntries
    // and writeBundle as separate statements. This avoids running
    // writeBundle (which dispatches a synchronous custom event) inside
    // the setEntries updater — that updater executes during React's
    // render phase, and the event listener it triggers would call
    // setEntries on other components mid-render.
    const without = entriesRef.current.filter((e) => e.id !== artifact.id)
    const next: BundleEntry[] = [
      {
        id: artifact.id,
        level: artifact.level,
        name: artifact.name,
        category: artifact.category,
        // Only effects carry customization. Storing `undefined` here rather
        // than a zeroed opts object is what lets the exporter tell "an
        // effect the user never tweaked" from "not an effect at all".
        opts,
        addedAt: new Date().toISOString(),
      },
      ...without,
    ]
    entriesRef.current = next // keep ref in sync for rapid successive calls
    setEntries(next)
    writeBundle(next)
    track('bundle_add', {
      artifact_id: artifact.id,
      level: levelOf(artifact),
      bundle_size: next.length,
    })
  }, [])

  const remove = React.useCallback((id: string) => {
    const next = entriesRef.current.filter((e) => e.id !== id)
    entriesRef.current = next
    setEntries(next)
    writeBundle(next)
    track('bundle_remove', { artifact_id: id, bundle_size: next.length })
  }, [])

  const toggle = React.useCallback(
    (artifact: BundleArtifact, opts?: BundleOpts) => {
      if (has(artifact.id)) {
        remove(artifact.id)
      } else {
        add(artifact, opts)
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
