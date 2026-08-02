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

export interface BundleEntry {
  effectId: string
  opts: BundleOpts
  addedAt: string
}

function docId(effectId: string): string {
  return encodeURIComponent(effectId)
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
    const effectId = data.effectId
    if (typeof effectId !== 'string' || !effectId) return []
    const addedAt =
      data.addedAt instanceof Timestamp
        ? data.addedAt.toDate().toISOString()
        : new Date(0).toISOString()
    const opts = (data.opts ?? {}) as Record<string, unknown>
    const num = (key: string, fallback: number) =>
      typeof opts[key] === 'number' && Number.isFinite(opts[key])
        ? (opts[key] as number)
        : fallback
    return [
      {
        effectId,
        opts: {
          hue: num('hue', 0),
          saturation: num('saturation', 0),
          scale: num('scale', 1),
          speed: num('speed', 1),
        },
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
      id: docId(entry.effectId),
      data: {
        effectId: entry.effectId,
        opts: entry.opts,
        addedAt: Timestamp.fromDate(new Date(entry.addedAt)),
      },
    })),
  )
}
