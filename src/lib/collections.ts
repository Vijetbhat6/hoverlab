/**
 * Private collections — the shared vocabulary.
 *
 * A collection is a named, ordered list of artifacts at any rung of the
 * ladder: "Client — Northwind", "Dark dashboard kit", "Buttons I keep
 * reaching for". Favorites answer "did I like this"; the bundle answers
 * "what am I exporting right now"; neither answers "which of these belong
 * together, months from now".
 *
 * Three things make this different from the other two stores, and all three
 * follow from it being a Pro feature:
 *
 *   It is server-only. Favorites and the bundle live in localStorage and
 *   sync opportunistically, so an anonymous visitor gets the full feature.
 *   Collections have no local mode at all — the store IS the entitlement,
 *   and a localStorage fallback would be the whole product, free.
 *
 *   It is enforced where it is stored. `/api/sync/collections` refuses a
 *   free account outright. That is worth saying plainly because most of
 *   what Pro sells cannot be enforced — the CSS is public, the exporters
 *   run in the browser. This one can be, because the data is ours.
 *
 *   Entries denormalize name and category, for the same reason
 *   `artifact-history.ts` does: resolving ids would mean shipping a catalog
 *   to every surface that renders a collection, and the effect index alone
 *   is ~772 KB. A stale name on a renamed artifact is the cheaper problem.
 *
 * This module is DATA-FREE and isomorphic — the route handler, the
 * Firestore layer and the client hook all validate against the same
 * functions, so the three cannot drift into disagreeing about what a
 * collection is.
 */

import { ARTIFACT_LEVELS, type ArtifactLevel } from '@/lib/artifact-types'

/* ------------------------------------------------------------------ *
 *  Limits
 * ------------------------------------------------------------------ */

/**
 * Caps, chosen to bound the cost of one PUT rather than to ration the
 * feature. A Pro customer should never meet these; a script pointed at the
 * endpoint should.
 */
export const COLLECTION_LIMITS = {
  /** Collections per account. */
  perAccount: 100,
  /** Artifacts in one collection. */
  itemsPerCollection: 500,
  /** Characters in a collection name. */
  nameLength: 80,
  /** Characters in the optional note under the name. */
  descriptionLength: 280,
} as const

/* ------------------------------------------------------------------ *
 *  Shapes
 * ------------------------------------------------------------------ */

/** One artifact inside a collection. */
export interface CollectionItem {
  id: string
  name: string
  category: string
  /** Absent means `'effect'`, matching `levelOf()` everywhere else. */
  level?: ArtifactLevel
  /** ISO 8601. When this artifact was put in this collection. */
  addedAt: string
}

export interface Collection {
  /** Stable client-generated id. Also the Firestore document key. */
  id: string
  name: string
  /** Optional one-liner — what this collection is for. */
  description?: string
  items: CollectionItem[]
  /** ISO 8601. */
  createdAt: string
  /** ISO 8601. Bumped on every mutation, and what the list is sorted by. */
  updatedAt: string
}

/* ------------------------------------------------------------------ *
 *  Validation
 * ------------------------------------------------------------------ */

const LEVELS: readonly string[] = ARTIFACT_LEVELS

function text(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim().slice(0, max)
  return trimmed || undefined
}

/**
 * An ISO timestamp, or now.
 *
 * Never rejects the row over a bad date. A collection with an unparseable
 * `updatedAt` sorts wrong for one render; a collection dropped because of
 * one is data the customer lost.
 */
function isoOrNow(value: unknown): string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
    ? value
    : new Date().toISOString()
}

export function sanitizeItem(raw: unknown): CollectionItem | null {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, unknown>

  const id = text(v.id, 200)
  if (!id) return null

  return {
    id,
    // An artifact with no readable name would render as a blank row, so it
    // falls back to the id rather than being dropped — the id is at least
    // something the user can search for.
    name: text(v.name, 200) ?? id,
    category: text(v.category, 100) ?? '',
    level: LEVELS.includes(v.level as string) ? (v.level as ArtifactLevel) : undefined,
    addedAt: isoOrNow(v.addedAt),
  }
}

/**
 * Normalize one untrusted collection, or reject it.
 *
 * Rejects only on a missing id or name — everything else is coerced. The
 * asymmetry is deliberate: an unnamed collection has nothing to render and
 * nothing to click, while an over-long description just gets shorter.
 */
export function sanitizeCollection(raw: unknown): Collection | null {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, unknown>

  const id = text(v.id, 64)
  const name = text(v.name, COLLECTION_LIMITS.nameLength)
  if (!id || !name) return null

  // Deduped by artifact id: the same effect added twice is one membership,
  // not two rows. First occurrence wins so the original `addedAt` survives.
  const seen = new Set<string>()
  const items: CollectionItem[] = []
  if (Array.isArray(v.items)) {
    for (const rawItem of v.items) {
      const item = sanitizeItem(rawItem)
      if (!item || seen.has(item.id)) continue
      seen.add(item.id)
      items.push(item)
      if (items.length >= COLLECTION_LIMITS.itemsPerCollection) break
    }
  }

  const createdAt = isoOrNow(v.createdAt)
  const updated = isoOrNow(v.updatedAt)
  // Never older than createdAt, whatever the client sent — the list sorts on
  // this, and a collection that claims to have been touched before it existed
  // sinks to the bottom and looks lost.
  const updatedAt = Date.parse(updated) < Date.parse(createdAt) ? createdAt : updated

  return {
    id,
    name,
    description: text(v.description, COLLECTION_LIMITS.descriptionLength),
    items,
    createdAt,
    updatedAt,
  }
}

/** Most recently touched first — the order every surface renders them in. */
export function sortCollections(collections: Collection[]): Collection[] {
  return [...collections].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  )
}

/**
 * A fresh collection id.
 *
 * `crypto.randomUUID` where it exists, which is every browser this app
 * supports and every Node the server runs on. The fallback is there for
 * insecure origins (plain-HTTP LAN testing), where `crypto` is undefined —
 * a collision there costs one merged collection on one developer's laptop.
 */
export function newCollectionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
