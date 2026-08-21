import 'server-only'

/**
 * A workspace's shared brand presets.
 *
 *   teams/{teamId}/brandPresets/{presetId}
 *     { id, name, hue, chroma, lightL, darkL, createdAt, createdBy }
 *
 * The same document shape as a personal library (`./brand-library`) in a
 * different collection, and the duplication is deliberate rather than
 * lazy. A generic "brand presets at an arbitrary path" helper would have
 * to be parameterised by the one thing that actually differs between them
 * — who may write — and that is the whole feature. Two small modules that
 * each state their own access rule beat one that takes a path and trusts
 * its caller.
 *
 * WHY THIS IS THE TEAM FEATURE. Team is $12/seat/month and its four
 * advertised differentiators were all marked `soon`: `canUseTeamFeatures`
 * was read by nothing, there was no team route for any of them, and a
 * customer could pay and receive, functionally, the Pro feature set. Of the
 * four, shared brand tokens is the one that is genuinely worth a recurring
 * charge — it is state that several people read and one person curates, it
 * gets more valuable the longer a team uses it, and it is the thing that
 * makes a design system a team's rather than a person's.
 *
 * `createdBy` is recorded and never used for access control. Any member may
 * edit any preset, because a shared library where only the author can fix
 * their own colour is a library that accumulates near-duplicates. It exists
 * so a team can see who added what.
 */

import { adminDb } from '@/lib/firebase/admin'
import { Timestamp, type Firestore } from 'firebase-admin/firestore'
import {
  sanitizeSavedBrand,
  sortSavedBrands,
  type SavedBrand,
} from '@/lib/brand-library'

const BATCH_LIMIT = 450

/** A shared preset carries who added it; a personal one has no need to. */
export interface SharedBrand extends SavedBrand {
  createdBy: string | null
}

function presets(db: Firestore, teamId: string) {
  return db.collection('teams').doc(teamId).collection('brandPresets')
}

/** Same rejection rule as the personal library — ids are ours, so strict. */
function docId(id: string): string | null {
  if (!id || id.length > 64) return null
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return null
  if (id.startsWith('__')) return null
  return id
}

export async function getSharedBrands(teamId: string): Promise<SharedBrand[]> {
  const snap = await presets(adminDb(), teamId).get()

  const brands = snap.docs.flatMap((doc) => {
    const data = doc.data()
    const createdAt =
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt
    const clean = sanitizeSavedBrand({ ...data, id: doc.id, createdAt })
    if (!clean) return []
    return [
      {
        ...clean,
        createdBy: typeof data.createdBy === 'string' ? data.createdBy : null,
      },
    ]
  })

  return sortSavedBrands(brands) as SharedBrand[]
}

/**
 * Replace the workspace's shared presets wholesale.
 *
 * `editorId` is stamped only on presets that are new to the collection.
 * Rewriting it on every save would make the attribution mean "who last
 * pressed save", which is a different and much less useful fact than "who
 * added this colour".
 */
export async function replaceSharedBrands(
  teamId: string,
  brands: SavedBrand[],
  editorId: string,
): Promise<void> {
  const db = adminDb()
  const target = presets(db, teamId)

  const existing = await target.get()
  const authorById = new Map(
    existing.docs.map((snap) => [snap.id, snap.data()?.createdBy ?? null]),
  )

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
          createdBy: authorById.get(key) ?? editorId,
        },
      },
    ]
  })

  const keep = new Set(documents.map((d) => d.key))
  const stale = existing.docs
    .filter((snap) => !keep.has(snap.id))
    .map((snap) => snap.ref)

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
