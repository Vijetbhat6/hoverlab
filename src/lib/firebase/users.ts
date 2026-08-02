/**
 * User profiles in Firestore.
 *
 * Firebase Auth owns identity — uid, email, password, email verification.
 * This collection holds everything Auth has no place for: display name,
 * entitlements, and the Polar customer id that lets a billing webhook find
 * the account behind an order.
 *
 * Layout:
 *   users/{uid}                     profile document
 *   users/{uid}/favorites/{effectId}
 *   users/{uid}/bundle/{effectId}
 *
 * Favourites and bundle entries are subcollections keyed by effect id, so
 * "add this effect twice" is a write to the same document rather than a
 * duplicate row — the uniqueness the Postgres schema got from
 * @@unique([userId, effectId]).
 */

import { adminDb } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'

export interface UserProfile {
  id: string
  email: string
  name: string | null
  createdAt: Date
  proLicense: boolean
  polarCustomerId: string | null
}

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return new Date(0)
}

export function usersCollection() {
  return adminDb().collection('users')
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await usersCollection().doc(uid).get()
  if (!snap.exists) return null
  const data = snap.data() ?? {}
  return {
    id: uid,
    email: typeof data.email === 'string' ? data.email : '',
    name: typeof data.name === 'string' && data.name ? data.name : null,
    createdAt: toDate(data.createdAt),
    proLicense: data.proLicense === true,
    polarCustomerId:
      typeof data.polarCustomerId === 'string' ? data.polarCustomerId : null,
  }
}

/**
 * Create the profile if this uid has never been seen, otherwise return the
 * existing one.
 *
 * Written as a transaction because sign-up and the first authenticated
 * request can land concurrently, and a plain get-then-set would let the
 * second one overwrite `createdAt` and `proLicense` — silently resetting a
 * paid entitlement.
 */
export async function ensureUserProfile(
  uid: string,
  fields: { email: string; name?: string | null },
): Promise<UserProfile> {
  const ref = usersCollection().doc(uid)

  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) {
      tx.set(ref, {
        email: fields.email,
        name: fields.name ?? null,
        createdAt: Timestamp.now(),
        proLicense: false,
        polarCustomerId: null,
      })
      return
    }
    // Keep the email in step with Firebase Auth if it was changed there,
    // but never touch createdAt or entitlements.
    const data = snap.data() ?? {}
    if (data.email !== fields.email) tx.update(ref, { email: fields.email })
  })

  const profile = await getUserProfile(uid)
  if (!profile) {
    throw new Error(`Profile for ${uid} vanished immediately after creation.`)
  }
  return profile
}
