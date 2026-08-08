/**
 * Favourites and bundle storage in Firestore.
 *
 *   users/{uid}/favorites/{docId}   { effectId, position }
 *   users/{uid}/bundle/{docId}      { effectId, opts, addedAt }
 *
 * Both replaced the Postgres tables that carried @@unique([userId, effectId]).
 * Firestore has no unique constraints, so uniqueness comes from the document
 * id instead: the effect id *is* the key, and adding the same effect twice
 * overwrites one document rather than creating a duplicate.
 *
 * Effect ids are percent-encoded before use as document ids because a
 * Firestore document id may not contain "/" — an id like "cards/glass" would
 * otherwise be read as a subcollection path. The unencoded value is stored
 * as a field and that field, never the key, is what reads return.
 */

import { adminDb } from '@/lib/firebase/admin'
import { Timestamp, type Firestore } from 'firebase-admin/firestore'
import { ARTIFACT_LEVELS, type ArtifactLevel } from '@/lib/artifact-types'

/** Widened for `includes` against untrusted Firestore values. */
const LEVELS: readonly string[] = ARTIFACT_LEVELS

/**
 * Firestore commits at most 500 operations per batch. Chunk below that so a
 * user at the favourites cap does not fail the entire sync.
 */
const BATCH_LIMIT = 450

export interface BundleOpts {
  hue: number
  saturation: number
  scale: number
  speed: number
}

/**
 * One stored bundle row.
 *
 * `id` replaced `effectId` when the bundle stopped being effect-only. Rows
 * written by older clients still carry `effectId` and no `level`, and
 * `getBundle` migrates them on read — the field is not renamed in place,
 * because a migration pass over every user's subcollection is a far larger
 * operation than reading two keys instead of one.
 */
export interface BundleEntry {
  id: string
  /** Absent means `'effect'`, matching `levelOf()` on the client. */
  level?: ArtifactLevel
  name?: string
  category?: string
  /** Effect-only. Absent for blocks, pages and templates. */
  opts?: BundleOpts
  addedAt: string
}

function docId(id: string): string {
  return encodeURIComponent(id)
}

function userDoc(db: Firestore, uid: string) {
  return db.collection('users').doc(uid)
}

/**
 * Replace a subcollection's contents wholesale.
 *
 * Deletes what is no longer present and writes what is, rather than dropping
 * everything and re-adding: a sync that only reorders entries then costs no
 * writes for the untouched ones, and there is no instant where the user's
 * data is empty.
 */
async function replaceSubcollection(
  uid: string,
  name: 'favorites' | 'bundle',
  documents: { id: string; data: Record<string, unknown> }[],
): Promise<void> {
  const db = adminDb()
  const collection = userDoc(db, uid).collection(name)

  const existing = await collection.select().get()
  const keep = new Set(documents.map((d) => d.id))
  const staleRefs = existing.docs
    .filter((snap) => !keep.has(snap.id))
    .map((snap) => snap.ref)

  const batches: FirebaseFirestore.WriteBatch[] = []
  let batch = db.batch()
  let count = 0
  const commitIfFull = () => {
    if (count >= BATCH_LIMIT) {
      batches.push(batch)
      batch = db.batch()
      count = 0
    }
  }

  for (const ref of staleRefs) {
    batch.delete(ref)
    count++
    commitIfFull()
  }
  for (const doc of documents) {
    batch.set(collection.doc(doc.id), doc.data)
    count++
    commitIfFull()
  }
  batches.push(batch)

  // Sequential, not Promise.all: concurrent batches touching one user's
  // documents contend with each other and Firestore starts retrying.
  for (const b of batches) await b.commit()
}

/* ============================================================
 *  Favourites
 * ========================================================== */

export async function getFavorites(uid: string): Promise<string[]> {
  const snap = await userDoc(adminDb(), uid)
    .collection('favorites')
    .orderBy('position', 'asc')
    .get()

  return snap.docs
    .map((doc) => doc.data().effectId)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
}

export async function replaceFavorites(
  uid: string,
  effectIds: string[],
): Promise<void> {
  await replaceSubcollection(
    uid,
    'favorites',
    effectIds.map((effectId, index) => ({
      id: docId(effectId),
      // Order is meaningful — it is the order they appear in the UI — and
      // Firestore returns documents by key, not by insertion, so it has to
      // be stored explicitly.
      data: { effectId, position: index },
    })),
  )
}

/* ============================================================
 *  Bundle
 * ========================================================== */

export async function getBundle(uid: string): Promise<BundleEntry[]> {
  const snap = await userDoc(adminDb(), uid)
    .collection('bundle')
    .orderBy('addedAt', 'desc')
    .get()

  return snap.docs.flatMap((doc) => {
    const data = doc.data()
    // `?? data.effectId` is the read-side migration for rows written before
    // the bundle held anything but effects.
    const id = (data.id ?? data.effectId) as unknown
    if (typeof id !== 'string' || !id) return []

    const addedAt =
      data.addedAt instanceof Timestamp
        ? data.addedAt.toDate().toISOString()
        : new Date(0).toISOString()

    const level = LEVELS.includes(data.level) ? (data.level as ArtifactLevel) : undefined

    // Only effects carry customization. A legacy row always has an `opts`
    // map; a block row has none, and inventing one here would make the
    // exporter treat it as a tweaked effect.
    let opts: BundleOpts | undefined
    if (data.opts && typeof data.opts === 'object') {
      const raw = data.opts as Record<string, unknown>
      const num = (key: string, fallback: number) =>
        typeof raw[key] === 'number' && Number.isFinite(raw[key])
          ? (raw[key] as number)
          : fallback
      opts = {
        hue: num('hue', 0),
        saturation: num('saturation', 0),
        scale: num('scale', 1),
        speed: num('speed', 1),
      }
    }

    return [
      {
        id,
        level,
        name: typeof data.name === 'string' ? data.name : undefined,
        category: typeof data.category === 'string' ? data.category : undefined,
        opts,
        addedAt,
      },
    ]
  })
}

export async function replaceBundle(
  uid: string,
  entries: BundleEntry[],
): Promise<void> {
  await replaceSubcollection(
    uid,
    'bundle',
    entries.map((entry) => ({
      id: docId(entry.id),
      // Firestore rejects `undefined` values outright, so optional fields
      // are spread in only when present rather than written as undefined.
      data: {
        id: entry.id,
        ...(entry.level ? { level: entry.level } : {}),
        ...(entry.name ? { name: entry.name } : {}),
        ...(entry.category ? { category: entry.category } : {}),
        ...(entry.opts ? { opts: entry.opts } : {}),
        addedAt: Timestamp.fromDate(new Date(entry.addedAt)),
      },
    })),
  )
}
