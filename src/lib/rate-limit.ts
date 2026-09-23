import 'server-only'
import { createHash } from 'node:crypto'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { adminDb, isAdminConfigured } from '@/lib/firebase/admin'
import { clientIp } from '@/lib/billing/request-subject'

/**
 * Per-client rate limits for the routes that write or authenticate.
 *
 * ── WHY THIS IS PER-IP AND NOT PER-ACCOUNT ─────────────────────────────
 *
 * Every sign-in on this site is proxied through the server (see
 * `lib/firebase/rest.ts`): the browser never talks to Google. That has a
 * consequence nobody sees until it is used against them. Firebase Auth
 * throttles by the CALLER's address, and the caller is always this server,
 * so Firebase sees one very busy client. When somebody guesses passwords
 * fast enough to trip `TOO_MANY_ATTEMPTS_TRY_LATER`, Firebase starts
 * refusing sign-ins from that one address, which is EVERYBODY. One
 * attacker locks every user out of the product.
 *
 * The defence has to sit in front of Firebase and has to be keyed by
 * something that tells the attacker from everyone else — which, for an
 * anonymous request, is the client address. So each attempt is charged to a
 * salted hash of the client IP here, and an address that spends its budget
 * is answered with a 429 by us, without a request ever reaching Firebase.
 * Firebase's own throttle then stays a backstop rather than a shared fuse.
 *
 * Keyed by account would not work: the attacker chooses the account, and a
 * per-account limit is precisely the lock-out lever we are trying to remove.
 *
 * ── WHAT THIS DOES NOT DO ──────────────────────────────────────────────
 *
 *   It is only as strong as the client-IP header. `clientIp()` prefers
 *   Netlify's `x-nf-client-connection-ip` when TRUST_NF_CLIENT_IP=1 — that
 *   one is written by Netlify's edge, not the caller. Anywhere else the
 *   header is whatever the caller sent, and a determined attacker can rotate
 *   it. That is the same trade `resolveRequestSubject` documents and it is
 *   accepted here for the same reason: this stops the casual and the
 *   accidental, not a distributed botnet.
 *
 *   Visitors behind one shared address (an office, a university, carrier
 *   NAT) share one bucket. The budgets are set generously enough that ten
 *   colleagues signing in once each in ten minutes do not notice.
 *
 *   An unknown address is NOT limited. With no proxy headers at all there
 *   is one bucket for the whole world, and a limit on that would let one
 *   request lock out everybody, which is the very failure this file exists
 *   to prevent. That case is local development.
 *
 * ── FAILS OPEN ─────────────────────────────────────────────────────────
 *
 * If the store errors — Firestore is down, the credentials are missing —
 * the request is allowed and the error is logged. A limiter outage must not
 * become a login outage: refusing to authenticate anyone because the
 * counter is unreachable would turn a degraded protection into a total
 * failure, and the price of failing open is only that the limit is absent
 * while the store is.
 *
 * ── STORAGE ────────────────────────────────────────────────────────────
 *
 * The same shape as the daily export meter in `billing/quota.ts`: one
 * Firestore document per counter, written in a transaction, keyed by a
 * salted hash so the collection is a list of opaque strings and not a list
 * of addresses. Fixed windows rather than sliding ones — one document per
 * (policy, client, window) and no fan-out — which lets a client burst up to
 * twice the limit across a window boundary. For a ceiling against abuse
 * that is fine, and it is what keeps a check to one read and one write.
 *
 *   rateLimits/{policy}__{ipHash}__{windowStartSeconds}
 *     { policy, count, windowStart, expireAt }
 *
 * `expireAt` is set an hour past the window so a Firestore TTL policy on
 * that field sweeps the collection. Without the policy the documents just
 * accumulate at ~100 bytes each, and nothing reads them after the window.
 * Setting the TTL policy is a console step, not code.
 */

/** One named budget: at most `limit` hits per `windowSeconds`, per client. */
export interface RateLimitPolicy {
  /** Part of the document id, so counters for different routes stay apart. */
  name: string
  limit: number
  windowSeconds: number
  /** The sentence a person sees on a 429. */
  message: string
}

const TEN_MINUTES = 10 * 60
const AUTH_MESSAGE =
  'Too many attempts from this network. Wait a few minutes and try again.'

/**
 * The budgets. Deliberately in one table so a change to one is a change you
 * can see next to the others.
 *
 * Auth is ten in ten minutes: a person mistyping a password four times and
 * then resetting it uses six. Forgot-password is tighter because each
 * accepted request sends an email to a third party, so the ceiling is also
 * a ceiling on mail-bombing someone else's inbox through us.
 */
export const RATE_LIMITS = {
  login: { name: 'login', limit: 10, windowSeconds: TEN_MINUTES, message: AUTH_MESSAGE },
  signup: { name: 'signup', limit: 10, windowSeconds: TEN_MINUTES, message: AUTH_MESSAGE },
  google: { name: 'google', limit: 10, windowSeconds: TEN_MINUTES, message: AUTH_MESSAGE },
  forgotPassword: {
    name: 'forgot',
    limit: 5,
    windowSeconds: TEN_MINUTES,
    message: AUTH_MESSAGE,
  },
  passkeyOptions: {
    name: 'pk-options',
    limit: 10,
    windowSeconds: TEN_MINUTES,
    message: AUTH_MESSAGE,
  },
  passkeyVerify: {
    name: 'pk-verify',
    limit: 10,
    windowSeconds: TEN_MINUTES,
    message: AUTH_MESSAGE,
  },
  newsletter: {
    name: 'newsletter',
    limit: 5,
    windowSeconds: 60 * 60,
    message: 'Too many sign-ups from this network. Please try again in an hour.',
  },
  feedback: {
    name: 'feedback',
    limit: 10,
    windowSeconds: 60 * 60,
    message: 'That is a lot of feedback from one place. Please try again in an hour.',
  },
} as const satisfies Record<string, RateLimitPolicy>

/**
 * Where the counters live. An interface so the fail-open behaviour can be
 * tested with a store that throws, without a Firestore emulator.
 */
export interface RateLimitStore {
  /**
   * Record one hit against `key` and return the count INCLUDING this hit.
   * `windowEndMs` is when the window closes, for the TTL field.
   */
  hit(key: string, windowStartMs: number, windowEndMs: number): Promise<number>
}

export interface RateLimitDecision {
  allowed: boolean
  /** Hits so far in this window, including this one. 0 when failed open. */
  count: number
  limit: number
  /** Whole seconds until the window closes. Only meaningful when denied. */
  retryAfterSeconds: number
  /** True when the store errored and the request was let through. */
  failedOpen: boolean
}

/**
 * Charge one hit and decide. Pure apart from the store, and never throws.
 *
 * `subjectKey` is already hashed — see `rateLimitKey`. Time is a parameter
 * so a test can walk across a window boundary without waiting for one.
 */
export async function evaluateRateLimit(
  store: RateLimitStore,
  policy: RateLimitPolicy,
  subjectKey: string,
  nowMs: number = Date.now(),
): Promise<RateLimitDecision> {
  const windowMs = policy.windowSeconds * 1000
  const windowStartMs = Math.floor(nowMs / windowMs) * windowMs
  const windowEndMs = windowStartMs + windowMs
  const retryAfterSeconds = Math.max(1, Math.ceil((windowEndMs - nowMs) / 1000))
  const key = `${policy.name}__${subjectKey}__${Math.floor(windowStartMs / 1000)}`

  try {
    const count = await store.hit(key, windowStartMs, windowEndMs)
    return {
      allowed: count <= policy.limit,
      count,
      limit: policy.limit,
      retryAfterSeconds,
      failedOpen: false,
    }
  } catch (err) {
    // Fail open — see the docblock. Logged, because a limiter that is
    // silently absent is the one you find out about from an incident.
    console.error(
      `[rate-limit] store failed for "${policy.name}", allowing the request:`,
      err instanceof Error ? err.message : err,
    )
    return {
      allowed: true,
      count: 0,
      limit: policy.limit,
      retryAfterSeconds: 0,
      failedOpen: true,
    }
  }
}

/**
 * Salted hash of the client address, or null when there is no address to
 * key on (see "An unknown address is NOT limited" above).
 *
 * The salt is QUOTA_IP_SALT when set, like the export meter, but the hash
 * input carries its own prefix so a limiter key can never be correlated
 * with a quota key for the same visitor. 32 hex characters: the full digest
 * carries no more information for this purpose and keeps document ids
 * readable in the console.
 */
export function rateLimitKey(request: Request): string | null {
  const ip = clientIp(request)
  if (ip === 'unknown') return null
  const salt = process.env.QUOTA_IP_SALT ?? 'hoverlab:quota:unsalted'
  return createHash('sha256')
    .update(`hoverlab:ratelimit:${salt}:${ip}`)
    .digest('hex')
    .slice(0, 32)
}

/** The production store: a transactional counter in Firestore. */
export const firestoreStore: RateLimitStore = {
  async hit(key, windowStartMs, windowEndMs) {
    if (!isAdminConfigured()) {
      // Thrown, not returned, so `evaluateRateLimit` logs it and fails open
      // through the one code path rather than a second, untested one.
      throw new Error('Firebase Admin is not configured')
    }
    const db = adminDb()
    const ref = db.collection('rateLimits').doc(key)
    return db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const previous = snap.exists ? Number(snap.data()?.count ?? 0) : 0
      const count = (Number.isFinite(previous) ? previous : 0) + 1
      tx.set(ref, {
        count,
        windowStart: Timestamp.fromMillis(windowStartMs),
        // A TTL policy on this field sweeps the collection. One hour past
        // the window, so a document is never deleted while still counting.
        expireAt: Timestamp.fromMillis(windowEndMs + 60 * 60 * 1000),
        updatedAt: FieldValue.serverTimestamp(),
      })
      return count
    })
  },
}

/**
 * The 429 a denied request is answered with.
 *
 * `Retry-After` is in seconds, as the header requires, and is the time to
 * the end of the current window rather than a guess.
 */
export function rateLimitedResponse(
  policy: RateLimitPolicy,
  decision: RateLimitDecision,
): Response {
  return Response.json(
    { error: policy.message, retryAfterSeconds: decision.retryAfterSeconds },
    {
      status: 429,
      headers: {
        'Retry-After': String(decision.retryAfterSeconds),
        'Cache-Control': 'no-store',
      },
    },
  )
}

/**
 * The one-liner a route calls first.
 *
 *   const limited = await enforceRateLimit(req, RATE_LIMITS.login)
 *   if (limited) return limited
 *
 * Returns the 429 to send, or null to carry on. Runs before the body is
 * parsed and before anything reaches Firebase, so a blocked client costs a
 * counter write and nothing else.
 */
export async function enforceRateLimit(
  request: Request,
  policy: RateLimitPolicy,
  store: RateLimitStore = firestoreStore,
): Promise<Response | null> {
  const key = rateLimitKey(request)
  if (!key) return null
  const decision = await evaluateRateLimit(store, policy, key)
  return decision.allowed ? null : rateLimitedResponse(policy, decision)
}
