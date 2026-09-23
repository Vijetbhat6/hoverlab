import 'server-only'
import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import {
  resolveShare,
  shareKey,
  toPublicShare,
  type OwnedShare,
  type PublicShare,
  type ShareStore,
} from '@/lib/collection-share'

/**
 * Firestore behind public collection share links.
 *
 * Two top-level collections, deliberately NOT nested under the collection
 * they belong to:
 *
 *   collectionShares/{uid}__{collectionId}    { uid, collectionId, token, createdAt }
 *   sharedCollections/{sha256(token)}         { uid, collectionId, createdAt }
 *
 * The first is the OWNER's side. It exists so the owner can be shown their
 * link again after closing the tab, which is why the raw token lives here
 * and why this record is only ever read with the owner's session. Its id is
 * derived from (uid, collection), so "does this collection have a share" is
 * one document read and a create cannot produce two.
 *
 * The second is the PUBLIC side, keyed by a hash of the token so the
 * document id in a path or a log is not itself a working URL. It carries the
 * uid and collection id — server-side only; nothing here is ever returned to
 * a browser except through `loadPublicShare`, which returns the whitelist in
 * `lib/collection-share.ts` and none of these fields.
 *
 * They are separate from `users/{uid}/collections/{id}` on purpose.
 * `PUT /api/sync/collections` replaces that set wholesale, and a `set` there
 * would silently wipe any share field written onto the collection document —
 * an owner's link dying every time they renamed something. Share state lives
 * where the sync cannot touch it.
 *
 * Not cleaned up on collection deletion or account deletion. A share whose
 * collection is gone 404s (see `loadPublicShare`), which is the behaviour
 * that matters; the leftover rows are two small documents each. Deleting an
 * account should delete rows where `uid` matches — see the report notes.
 */

const OWNED = 'collectionShares'
const PUBLIC = 'sharedCollections'

const ownedId = (uid: string, collectionId: string) => `${uid}__${collectionId}`

function ownedFrom(data: FirebaseFirestore.DocumentData | undefined): OwnedShare | null {
  if (!data || typeof data.token !== 'string') return null
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0
  return { token: data.token, createdAt }
}

export const firestoreShareStore: ShareStore = {
  async getOwned(uid, collectionId) {
    const snap = await adminDb().collection(OWNED).doc(ownedId(uid, collectionId)).get()
    return ownedFrom(snap.data())
  },

  async create(uid, collectionId, share) {
    const db = adminDb()
    const ownedRef = db.collection(OWNED).doc(ownedId(uid, collectionId))
    const publicRef = db.collection(PUBLIC).doc(shareKey(share.token))

    // A transaction, so two presses of the button racing each other mint one
    // link, not two: the loser reads the winner's document and returns it.
    return db.runTransaction(async (tx) => {
      const existing = ownedFrom((await tx.get(ownedRef)).data())
      if (existing) return { ...existing, created: false }

      const at = Timestamp.fromMillis(share.createdAt)
      tx.set(ownedRef, { uid, collectionId, token: share.token, createdAt: at })
      tx.set(publicRef, { uid, collectionId, createdAt: at })
      return { ...share, created: true }
    })
  },

  async remove(uid, collectionId) {
    const db = adminDb()
    const ownedRef = db.collection(OWNED).doc(ownedId(uid, collectionId))

    return db.runTransaction(async (tx) => {
      const existing = ownedFrom((await tx.get(ownedRef)).data())
      if (!existing) return false
      // Both records, in one commit: a link that stops working must stop
      // working everywhere at once, and the owner's record must not outlive
      // the public one and offer a dead link.
      tx.delete(db.collection(PUBLIC).doc(shareKey(existing.token)))
      tx.delete(ownedRef)
      return true
    })
  },

  async lookup(key) {
    const snap = await adminDb().collection(PUBLIC).doc(key).get()
    const data = snap.data()
    if (!data || typeof data.uid !== 'string' || typeof data.collectionId !== 'string') {
      return null
    }
    return { uid: data.uid, collectionId: data.collectionId }
  },
}

/**
 * What `/c/<token>` renders, or null for a 404.
 *
 * Unknown token, revoked token, and a share whose collection has since been
 * deleted are all null — the page answers them identically. The collection
 * is read live, so a rename or an added artifact shows on the next view; only
 * `toPublicShare`'s whitelist leaves this function.
 */
export async function loadPublicShare(token: unknown): Promise<PublicShare | null> {
  const target = await resolveShare(firestoreShareStore, token)
  if (!target) return null

  const snap = await adminDb()
    .collection('users')
    .doc(target.uid)
    .collection('collections')
    .doc(target.collectionId)
    .get()
  if (!snap.exists) return null

  return toPublicShare(snap.data())
}

/** Does this collection exist on the server yet? For the share route. */
export async function collectionExists(uid: string, collectionId: string): Promise<boolean> {
  const snap = await adminDb()
    .collection('users')
    .doc(uid)
    .collection('collections')
    .doc(collectionId)
    .get()
  return snap.exists
}
