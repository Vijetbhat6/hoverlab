/**
 * Registered passkeys, in Firestore.
 *
 * Layout:
 *   passkeys/{credentialId}
 *
 * Top-level and keyed by credential id rather than nested under
 * users/{uid}/passkeys, because sign-in has to work the other way round.
 * A discoverable passkey identifies itself before anyone has said who they
 * are — the browser hands back a credential id and nothing else — so the
 * lookup that matters is id → account. A subcollection would force a
 * collection-group query for the single most common read.
 *
 * Listing a user's own passkeys is the rarer direction and is a plain
 * equality query on `uid`, which Firestore indexes automatically.
 *
 * Public keys are stored base64url-encoded: Firestore has a Bytes type, but
 * it round-trips through the Admin SDK as its own class, and every consumer
 * here wants the Uint8Array that @simplewebauthn expects. One encoding, at
 * the edge, is less to get wrong.
 */

import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server'

const COLLECTION = 'passkeys'

/**
 * A Uint8Array backed by a plain ArrayBuffer, which is what
 * @simplewebauthn's verifiers ask for. `Buffer.from(...)` returns one backed
 * by `ArrayBufferLike` — it could be shared memory as far as the type system
 * knows — so the bytes are copied into a buffer whose type says otherwise
 * rather than being asserted into place.
 */
function toBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const buf = Buffer.from(base64url, 'base64url')
  const bytes = new Uint8Array(new ArrayBuffer(buf.byteLength))
  bytes.set(buf)
  return bytes
}

export interface StoredPasskey {
  /** base64url credential id — also the document id. */
  id: string
  uid: string
  publicKey: Uint8Array<ArrayBuffer>
  counter: number
  transports: AuthenticatorTransportFuture[]
  /** What the person calls it. Defaults to something derived at sign-up time. */
  name: string
  /** 'multiDevice' means it syncs (iCloud Keychain, Google Password Manager). */
  deviceType: string
  backedUp: boolean
  createdAt: Date
  lastUsedAt: Date | null
}

/** The subset that is safe to send to the browser. */
export interface PublicPasskey {
  id: string
  name: string
  createdAt: string
  lastUsedAt: string | null
  backedUp: boolean
}

function passkeys() {
  return adminDb().collection(COLLECTION)
}

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return null
}

function fromDoc(
  id: string,
  data: FirebaseFirestore.DocumentData,
): StoredPasskey | null {
  const uid = typeof data.uid === 'string' ? data.uid : ''
  const publicKey = typeof data.publicKey === 'string' ? data.publicKey : ''
  if (!uid || !publicKey) return null

  return {
    id,
    uid,
    publicKey: toBytes(publicKey),
    counter: typeof data.counter === 'number' ? data.counter : 0,
    transports: Array.isArray(data.transports)
      ? (data.transports.filter((t) => typeof t === 'string') as AuthenticatorTransportFuture[])
      : [],
    name: typeof data.name === 'string' && data.name ? data.name : 'Passkey',
    deviceType: typeof data.deviceType === 'string' ? data.deviceType : 'singleDevice',
    backedUp: data.backedUp === true,
    createdAt: toDate(data.createdAt) ?? new Date(0),
    lastUsedAt: toDate(data.lastUsedAt),
  }
}

export function toPublicPasskey(passkey: StoredPasskey): PublicPasskey {
  return {
    id: passkey.id,
    name: passkey.name,
    createdAt: passkey.createdAt.toISOString(),
    lastUsedAt: passkey.lastUsedAt ? passkey.lastUsedAt.toISOString() : null,
    backedUp: passkey.backedUp,
  }
}

export async function getPasskey(credentialId: string): Promise<StoredPasskey | null> {
  const snap = await passkeys().doc(credentialId).get()
  if (!snap.exists) return null
  return fromDoc(snap.id, snap.data() ?? {})
}

export async function listPasskeys(uid: string): Promise<StoredPasskey[]> {
  const snap = await passkeys().where('uid', '==', uid).get()
  return snap.docs
    .map((doc) => fromDoc(doc.id, doc.data()))
    .filter((p): p is StoredPasskey => p !== null)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export interface NewPasskey {
  id: string
  uid: string
  publicKey: Uint8Array
  counter: number
  transports: AuthenticatorTransportFuture[]
  name: string
  deviceType: string
  backedUp: boolean
}

export async function savePasskey(passkey: NewPasskey): Promise<void> {
  await passkeys()
    .doc(passkey.id)
    .set({
      uid: passkey.uid,
      publicKey: Buffer.from(passkey.publicKey).toString('base64url'),
      counter: passkey.counter,
      transports: passkey.transports,
      name: passkey.name,
      deviceType: passkey.deviceType,
      backedUp: passkey.backedUp,
      createdAt: Timestamp.now(),
      lastUsedAt: null,
    })
}

/**
 * Record a successful assertion.
 *
 * The counter is the anti-cloning signal: a hardware key increments it on
 * every use, so a value that fails to advance means two authenticators are
 * answering for one credential. Synced passkeys report 0 forever and are
 * exempt by design — the check is made by the caller, which knows whether
 * the stored counter was ever non-zero.
 */
export async function touchPasskey(
  credentialId: string,
  counter: number,
): Promise<void> {
  await passkeys().doc(credentialId).update({
    counter,
    lastUsedAt: Timestamp.now(),
  })
}

export async function renamePasskey(
  credentialId: string,
  uid: string,
  name: string,
): Promise<boolean> {
  const ref = passkeys().doc(credentialId)
  const snap = await ref.get()
  // Ownership is checked here rather than in the route so that no caller can
  // forget: the credential id is public (the browser hands it out during
  // every sign-in attempt), so it is not a secret and cannot stand in for
  // authorisation on its own.
  if (!snap.exists || snap.data()?.uid !== uid) return false
  await ref.update({ name })
  return true
}

export async function deletePasskey(
  credentialId: string,
  uid: string,
): Promise<boolean> {
  const ref = passkeys().doc(credentialId)
  const snap = await ref.get()
  if (!snap.exists || snap.data()?.uid !== uid) return false
  await ref.delete()
  return true
}
