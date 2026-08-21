import 'server-only'

/**
 * Saved brand presets in Firestore.
 *
 *   users/{uid}/brandPresets/{presetId}
 *     { id, name, hue, chroma, lightL, darkL, createdAt }
 *
 * One document per preset — unlike collections, which nest their items,
 * because a preset is four numbers and there is nothing to nest. The read
 * shape is the same either way: everything, every time, since the picker
 * lists them all.
 */

import { adminDb } from '@/lib/firebase/admin'
import { Timestamp, type Firestore } from 'firebase-admin/firestore'
import {
  sanitizeSavedBrand,
  sortSavedBrands,
  type SavedBrand,
} from '@/lib/brand-library'

const BATCH_LIMIT = 450

function presets(db: Firestore, uid: string) {
  return db.collection('users').doc(uid).collection('brandPresets')
}

/** Same rejection rule as collections — ids are ours, so they can be strict. */
function docId(id: string): string | null {
  if (!id || id.length > 64) return null
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return null
  if (id.startsWith('__')) return null
  return id
}

export async function getSavedBrands(uid: string): Promise<SavedBrand[]> {
  const snap = await presets(adminDb(), uid).get()

  const brands = snap.docs.flatMap((doc) => {
    const data = doc.data()
    const createdAt =
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt
    const clean = sanitizeSavedBrand({ ...data, id: doc.id, createdAt })
    return clean ? [clean] : []
  })

  return sortSavedBrands(brands)
}

/** Replace the account's saved presets wholesale. */
export async function replaceSavedBrands(
  uid: string,
  brands: SavedBrand[],
): Promise<void> {
  const db = adminDb()
  const target = presets(db, uid)

  const documents = brands.flatMap((brand) => {
    const key = docId(brand.id)
    if (!key) return []
    return [
      {
        key,
        data: {
          id: brand.id,
          name: brand.name,
          hue: brand.hue,
          chroma: brand.chroma,
          lightL: brand.lightL,
          darkL: brand.darkL,
          createdAt: Timestamp.fromDate(new Date(brand.createdAt)),
        },
      },
    ]
  })

  const existing = await target.select().get()
  const keep = new Set(documents.map((d) => d.key))
  const stale = existing.docs.filter((snap) => !keep.has(snap.id)).map((snap) => snap.ref)

  const batches: FirebaseFirestore.WriteBatch[] = []
  let batch = db.batch()
  let count = 0
  const rollIfFull = () => {
    if (count >= BATCH_LIMIT) {
      batches.push(batch)
      batch = db.batch()
      count = 0
    }
  }

  for (const ref of stale) {
    batch.delete(ref)
    count++
    rollIfFull()
  }
  for (const doc of documents) {
    batch.set(target.doc(doc.key), doc.data)
    count++
    rollIfFull()
  }
  batches.push(batch)

  for (const b of batches) await b.commit()
}
