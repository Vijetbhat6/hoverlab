import 'server-only'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { adminDb } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'
import { getEntitlements, FREE_ENTITLEMENTS, type Entitlements } from './entitlements'

/**
 * Licence keys — the credential that makes a Pro boundary hold outside the
 * browser.
 *
 * This is deliberately a different object from the licence *id* in
 * `lib/license.ts`, and the two must not be confused:
 *
 *   licence id   `HL-PRO-4F2A-…`. Public, derived from the order, printed
 *                on the certificate. Identifies a purchase. Unlocks
 *                nothing, and says so.
 *   licence key  `hl_live_…`. Secret, random, stored hashed, shown once.
 *                Unlocks the Pro surface of `/api/v1` and the CLI.
 *
 * Why a key exists at all. The standing design is that the catalog is
 * public and `/api/v1` takes no credentials, and that is still true of
 * every free artifact — `hoverlab add btn-gradient` works with no account
 * and always will. But `artifact-types.ts` wrote down the reason nothing
 * could ever be sold per-artifact: a website check is walked around by the
 * CLI and by the zip URL. That is exactly right, and a key is the only
 * thing that answers it. Selling the finished artifacts means
 * authenticating the API first, so this authenticates the API.
 *
 * WHAT THE KEY GATES: the Pro rung of the catalog — template sources and
 * template archives. Nothing else. Effects, blocks and pages stay
 * unauthenticated, so the funnel, the MCP server and every existing
 * `hoverlab add` keep working untouched.
 *
 * Storage. Only a SHA-256 of the key is persisted, so a leaked database is
 * not a leaked set of keys. There is no reversal path and no "show me my
 * key again": a lost key is rotated, not recovered. That is the same
 * bargain every API-key product makes, and pretending otherwise means
 * storing the secret in plaintext.
 *
 * Firestore layout:
 *   users/{uid}.apiKey          { hash, prefix, createdAt, lastUsedAt }
 *   apiKeys/{hash}              { userId, createdAt }   ← lookup index
 *
 * The second collection is what makes verification one document read. The
 * alternative is a collection-group query over every profile on the hot
 * path of every CLI call.
 */

/**
 * Key prefix.
 *
 * `hl_live_` rather than a bare random string so that a key pasted into a
 * public repo is recognisable to secret scanners — GitHub's push protection
 * and the common scanning tools all key off a distinctive prefix, and a key
 * that looks like base64 noise is one nobody catches.
 */
const KEY_PREFIX = 'hl_live_'

/** Bytes of entropy behind a key. 32 is the usual floor for a bearer token. */
const KEY_BYTES = 32

export interface ApiKeyRecord {
  /** First characters of the key, for display: `hl_live_9f3a…`. */
  prefix: string
  createdAt: string
  /** ISO 8601, or null when the key has never been used. */
  lastUsedAt: string | null
}

/** Hash a presented key the same way an issued one was stored. */
function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

/**
 * Constant-time comparison of two hex digests.
 *
 * Firestore lookup is by document id, so a timing side channel here is
 * mostly theoretical — but `verifyApiKey` also compares the resolved
 * record, and a plain `===` on a secret is the kind of thing that gets
 * copied into a place where it does matter.
 */
function digestsMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex')
  const right = Buffer.from(b, 'hex')
  if (left.length !== right.length || left.length === 0) return false
  return timingSafeEqual(left, right)
}

function toIso(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  return null
}

/** The caller's current key, without the secret. Null when they have none. */
export async function getApiKeyRecord(userId: string): Promise<ApiKeyRecord | null> {
  const snap = await adminDb().collection('users').doc(userId).get()
  const stored = (snap.data()?.apiKey ?? null) as Record<string, unknown> | null
  if (!stored || typeof stored.hash !== 'string') return null

  return {
    prefix: typeof stored.prefix === 'string' ? stored.prefix : KEY_PREFIX,
    createdAt: toIso(stored.createdAt) ?? new Date().toISOString(),
    lastUsedAt: toIso(stored.lastUsedAt),
  }
}

/**
 * Mint a key for a user, replacing whatever they had.
 *
 * Returns the secret exactly once — the caller must hand it straight to the
 * customer, because nothing can produce it again. Rotation is the same
 * operation as issuance, which is why there is no separate `rotate`: a
 * "rotate" that behaved differently from "create" would be two code paths
 * with one of them rarely exercised.
 *
 * The previous key's index document is deleted in the same batch, so a
 * rotated key stops working immediately rather than at the next cache
 * expiry.
 */
export async function issueApiKey(userId: string): Promise<string> {
  const db = adminDb()
  const secret = `${KEY_PREFIX}${randomBytes(KEY_BYTES).toString('base64url')}`
  const hash = hashKey(secret)
  // Enough to recognise a key in a list, far too little to reconstruct it.
  const prefix = `${secret.slice(0, KEY_PREFIX.length + 4)}…`

  const userRef = db.collection('users').doc(userId)
  const previous = (await userRef.get()).data()?.apiKey as
    | { hash?: string }
    | undefined

  const batch = db.batch()
  if (typeof previous?.hash === 'string' && previous.hash !== hash) {
    batch.delete(db.collection('apiKeys').doc(previous.hash))
  }
  batch.set(
    userRef,
    {
      apiKey: {
        hash,
        prefix,
        createdAt: Timestamp.now(),
        lastUsedAt: null,
      },
    },
    { merge: true },
  )
  batch.set(db.collection('apiKeys').doc(hash), {
    userId,
    createdAt: Timestamp.now(),
  })

  await batch.commit()
  return secret
}

/** Drop the caller's key. A CLI holding it starts failing on the next call. */
export async function revokeApiKey(userId: string): Promise<void> {
  const db = adminDb()
  const userRef = db.collection('users').doc(userId)
  const stored = (await userRef.get()).data()?.apiKey as { hash?: string } | undefined
  if (!stored?.hash) return

  const batch = db.batch()
  batch.delete(db.collection('apiKeys').doc(stored.hash))
  batch.update(userRef, { apiKey: null })
  await batch.commit()
}

export interface VerifiedKey {
  userId: string
  entitlements: Entitlements
}

/**
 * Resolve a presented key to its owner and what they hold.
 *
 * Entitlements are read live rather than stamped on the key, so a refund or
 * a lapsed subscription takes effect on the next request. A key is an
 * identity, never a grant — the difference is what stops a key issued
 * during a trial from being a permanent licence.
 *
 * `lastUsedAt` is written on a successful verification and deliberately not
 * awaited: it exists so a customer can tell a live key from a forgotten
 * one, and blocking the request on that write would put a Firestore round
 * trip in front of every CLI call to service a line of UI copy.
 */
export async function verifyApiKey(key: string): Promise<VerifiedKey | null> {
  if (!key.startsWith(KEY_PREFIX)) return null

  const hash = hashKey(key)
  const db = adminDb()
  const snap = await db.collection('apiKeys').doc(hash).get()
  if (!snap.exists) return null

  const userId = snap.data()?.userId
  if (typeof userId !== 'string' || !userId) return null

  const profile = await db.collection('users').doc(userId).get()
  const stored = profile.data()?.apiKey as { hash?: string } | undefined
  // The index and the profile must agree. They can only disagree if a
  // rotation half-committed, and in that case the profile is authoritative
  // — it is what the customer was last shown.
  if (typeof stored?.hash !== 'string' || !digestsMatch(stored.hash, hash)) {
    return null
  }

  void db
    .collection('users')
    .doc(userId)
    .update({ 'apiKey.lastUsedAt': Timestamp.now() })
    .catch(() => {
      /* Best effort. A failed timestamp must never fail the request. */
    })

  return { userId, entitlements: await getEntitlements(userId) }
}

/**
 * The key on a request, from either place a client can carry one.
 *
 * `Authorization: Bearer …` is the correct form and what the CLI sends.
 * `?key=` is accepted too, because a template archive is fetched by the
 * browser's download machinery and by `curl -O`, neither of which can set
 * a header. A key in a query string ends up in server logs, which is why
 * it is the fallback rather than the documented path.
 */
export function keyFromRequest(request: Request): string | null {
  const header = request.headers.get('authorization')
  if (header?.toLowerCase().startsWith('bearer ')) {
    const value = header.slice(7).trim()
    if (value) return value
  }

  const url = new URL(request.url)
  return url.searchParams.get('key')?.trim() || null
}

/**
 * Entitlements for a request that may carry a key, a session cookie, or
 * neither.
 *
 * Key first: a CLI call has no cookie, and a browser call has no key, so
 * the order only matters for a developer testing the API from a logged-in
 * tab — where the key they explicitly passed should win over the ambient
 * session.
 */
export async function entitlementsForApiRequest(
  request: Request,
  sessionUserId: string | null,
): Promise<Entitlements> {
  const key = keyFromRequest(request)
  if (key) {
    const verified = await verifyApiKey(key)
    if (verified) return verified.entitlements
  }
  if (sessionUserId) return getEntitlements(sessionUserId)
  return FREE_ENTITLEMENTS
}
