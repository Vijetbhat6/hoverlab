import 'server-only'
import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { dayKey, decide, limitDocPath, type AccountAction } from './limits'
import type { AccountStore, AuthRecord, Doc, MailRemoval } from './store'

/**
 * The Firestore, Firebase Auth and Resend implementation of `AccountStore`.
 *
 * The only file in this feature that touches the Admin SDK. Everything with a
 * decision in it is elsewhere and tested; this is plumbing, kept thin enough
 * to read in one sitting.
 */

/** Firestore code 5, NOT_FOUND. */
function isNotFound(err: unknown): boolean {
  return Boolean(err && typeof err === 'object' && (err as { code?: unknown }).code === 5)
}

function isEven(segments: number): boolean {
  return segments % 2 === 0
}

/** A path with an even number of segments is a document; odd is a collection. */
function docRef(db: Firestore, path: string) {
  const segments = path.split('/').filter(Boolean)
  if (!isEven(segments.length)) throw new Error(`"${path}" is a collection path, not a document.`)
  return db.doc(segments.join('/'))
}

function collectionRef(db: Firestore, path: string) {
  const segments = path.split('/').filter(Boolean)
  if (isEven(segments.length)) throw new Error(`"${path}" is a document path, not a collection.`)
  return db.collection(segments.join('/'))
}

/** Cap on documents read from one collection query. */
const LIST_CAP = 5000

function toDoc(snap: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot): Doc {
  return { id: snap.id, path: snap.ref.path, data: snap.data() ?? {} }
}

function applyWhere(
  query: FirebaseFirestore.Query,
  where: Record<string, unknown> | undefined,
): FirebaseFirestore.Query {
  let q = query
  for (const [field, value] of Object.entries(where ?? {})) q = q.where(field, '==', value)
  return q
}

function iso(value: string | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** Turn `undefined` values into field deletions; Firestore rejects them raw. */
function toFirestoreFields(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fields)) {
    out[key] = value === undefined ? FieldValue.delete() : value
  }
  return out
}

/**
 * Resend's "remove contact" call takes the address in the path.
 *
 * Only made when both variables that make the mirror exist are set — the
 * same two `forwardToResend` in the newsletter route checks — so a
 * deployment that never mirrored anyone never calls out.
 */
async function removeFromResend(email: string): Promise<MailRemoval> {
  const key = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!key || !audienceId) return 'not-configured'

  const res = await fetch(
    `https://api.resend.com/audiences/${encodeURIComponent(audienceId)}/contacts/${encodeURIComponent(email)}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${key}` } },
  )
  if (res.status === 404) return 'absent'
  if (!res.ok) throw new Error(`Resend answered ${res.status} when asked to remove the contact.`)
  return 'removed'
}

export function firestoreAccountStore(): AccountStore {
  const db = adminDb()

  return {
    async getDoc(path) {
      const snap = await docRef(db, path).get()
      return snap.exists ? toDoc(snap) : null
    },

    async list(path, where) {
      const snap = await applyWhere(collectionRef(db, path), where).limit(LIST_CAP).get()
      return snap.docs.map(toDoc)
    },

    async listSubcollections(path) {
      const refs = await docRef(db, path).listCollections()
      return refs.map((ref) => ref.id)
    },

    async patch(path, fields) {
      try {
        await docRef(db, path).update(toFirestoreFields(fields))
      } catch (err) {
        // Nothing to blank is the goal state, not a failure.
        if (!isNotFound(err)) throw err
      }
    },

    async remove(path) {
      await docRef(db, path).delete()
    },

    async removeWhere(path, where) {
      const snap = await applyWhere(collectionRef(db, path), where).select().get()
      if (snap.empty) return 0
      // BulkWriter batches, retries and paces itself; a bare loop of deletes
      // is how a large collection turns into a quota error.
      const writer = db.bulkWriter()
      // Keep the per-operation promises: a delete that fails rejects its own
      // promise, and one nobody awaits is an unhandled rejection rather than
      // an error the step can report.
      const ops = snap.docs.map((doc) => writer.delete(doc.ref))
      await writer.close()
      await Promise.all(ops)
      return snap.size
    },

    async removeTree(path) {
      await db.recursiveDelete(docRef(db, path))
    },

    async leaveTeam(teamId, uid) {
      const teamRef = db.collection('teams').doc(teamId)
      const memberRef = teamRef.collection('members').doc(uid)
      await db.runTransaction(async (tx) => {
        const [member, team] = await Promise.all([tx.get(memberRef), tx.get(teamRef)])
        // Not a member (any more) is the state we want. Checking inside the
        // transaction is what makes a retry safe: without it, running this
        // twice would hand back two seats for one departure.
        if (!member.exists) return
        tx.delete(memberRef)
        if (team.exists) {
          const used = typeof team.data()?.seatsUsed === 'number' ? team.data()!.seatsUsed : 1
          tx.update(teamRef, { seatsUsed: Math.max(1, used - 1) })
        }
      })
    },

    async getAuthRecord(uid): Promise<AuthRecord | null> {
      try {
        const user = await adminAuth().getUser(uid)
        return {
          uid: user.uid,
          email: user.email ?? null,
          displayName: user.displayName ?? null,
          emailVerified: user.emailVerified,
          createdAt: iso(user.metadata.creationTime),
          lastSignInAt: iso(user.metadata.lastSignInTime),
          providers: user.providerData.map((p) => p.providerId),
        }
      } catch (err) {
        if ((err as { code?: string }).code === 'auth/user-not-found') return null
        throw err
      }
    },

    async revokeSessions(uid) {
      try {
        await adminAuth().revokeRefreshTokens(uid)
      } catch (err) {
        if ((err as { code?: string }).code !== 'auth/user-not-found') throw err
      }
    },

    async deleteAuthUser(uid) {
      try {
        await adminAuth().deleteUser(uid)
      } catch (err) {
        if ((err as { code?: string }).code !== 'auth/user-not-found') throw err
      }
    },

    removeMailContact: removeFromResend,
  }
}

/* ------------------------------------------------------------------ *
 *  Rate limiting
 * ------------------------------------------------------------------ */

export interface RateLimitResult {
  ok: boolean
  used: number
  limit: number
}

/**
 * Count one use of an account endpoint against today's ceiling.
 *
 * One transaction, so two requests in flight cannot both take the last slot.
 * Spent before the work rather than refunded after: for an export that
 * fails halfway, the read cost was already paid, and for deletion a retry
 * is what the ten-a-day ceiling is sized for.
 */
export async function consumeAccountAction(
  uid: string,
  action: AccountAction,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const db = adminDb()
  const day = dayKey(now)
  const ref = db.doc(limitDocPath(uid, action, day))

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.data() ?? {}
    const used = data.day === day && typeof data.count === 'number' ? data.count : 0
    const verdict = decide(action, used)
    if (!verdict.ok) return verdict

    tx.set(ref, {
      day,
      subject: uid,
      kind: 'user',
      action: `account-${action}`,
      count: verdict.used,
      updatedAt: Timestamp.now(),
    })
    return verdict
  })
}
