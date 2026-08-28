/**
 * Server-side helpers for reading the current session.
 *
 * Sessions are Firebase Auth session cookies: the browser signs in with the
 * client SDK, posts the resulting ID token to /api/auth/session, and the
 * Admin SDK exchanges it for an httpOnly cookie. Verification therefore
 * requires the Node.js runtime — the Admin SDK cannot run on the Edge
 * runtime, which is why proxy.ts checks only for the cookie's presence and
 * every real decision happens here.
 *
 * Safe to import from Route Handlers and Server Components only.
 * (For Client Components, use the `useAuth` hook instead.)
 */

import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase/admin'
import { signInWithCustomToken } from '@/lib/firebase/rest'
import { getUserProfile } from '@/lib/firebase/users'

export const SESSION_COOKIE_NAME = 'cssfx:session'

/**
 * Firebase caps session cookies at 14 days, shorter than the 30-day JWT this
 * replaced. In exchange, revocation is real: `verifySessionCookie(_, true)`
 * checks tokens against Firebase's revocation list, so a password change or
 * an explicit revoke ends every existing session — the guarantee that
 * previously needed a hand-rolled `sessionsValidFrom` epoch.
 */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14

export interface PublicUser {
  id: string
  email: string
  name: string | null
  createdAt: Date
}

/**
 * Why a request is not authenticated, which callers need to tell apart:
 *
 *  - `anonymous` — no cookie at all. Nothing to do.
 *  - `revoked`   — a cookie is present but no longer honored: expired,
 *                  revoked, signed by a different Firebase project, or its
 *                  user has been deleted. proxy.ts still reads that cookie
 *                  as "signed in", so whoever gets this should expire it —
 *                  otherwise /login redirects to /library forever while the
 *                  header offers a Sign in link that goes nowhere.
 */
export type SessionResolution =
  | { status: 'ok'; user: PublicUser }
  | { status: 'anonymous' }
  | { status: 'revoked' }

export interface DecodedSession {
  uid: string
  email: string
  name: string | null
}

/**
 * Verify the session cookie. Returns null when there is no cookie, and
 * throws nothing — an unverifiable cookie is reported as a failure, not an
 * exception, because the distinction callers need is `anonymous` vs
 * `revoked`, not "did a library throw".
 */
async function readSessionCookie(): Promise<
  { present: false } | { present: true; session: DecodedSession | null }
> {
  const store = await cookies()
  const cookie = store.get(SESSION_COOKIE_NAME)?.value
  if (!cookie) return { present: false }

  try {
    // checkRevoked: true costs a lookup but is the entire point — without it
    // a stolen cookie outlives the password change made to stop it.
    const decoded = await adminAuth().verifySessionCookie(cookie, true)
    return {
      present: true,
      session: {
        uid: decoded.uid,
        email: typeof decoded.email === 'string' ? decoded.email : '',
        name: typeof decoded.name === 'string' ? decoded.name : null,
      },
    }
  } catch {
    return { present: true, session: null }
  }
}

export async function getSession(): Promise<DecodedSession | null> {
  const result = await readSessionCookie()
  return result.present ? result.session : null
}

/**
 * Resolve the session all the way to a user profile, reporting *why* when
 * that fails. Everything auth-related funnels through here so the rules are
 * enforced in exactly one place.
 */
export async function resolveSession(): Promise<SessionResolution> {
  const result = await readSessionCookie()
  if (!result.present) return { status: 'anonymous' }
  if (!result.session) return { status: 'revoked' }

  const profile = await getUserProfile(result.session.uid)
  // Authenticated by Firebase but with no profile document: the account was
  // deleted, or this cookie was issued against a different Firestore
  // database. Either way the session cannot be honored.
  if (!profile) return { status: 'revoked' }

  return {
    status: 'ok',
    user: {
      id: profile.id,
      email: profile.email || result.session.email,
      name: profile.name,
      createdAt: profile.createdAt,
    },
  }
}

/**
 * Resolve the current user. Returns null if not logged in, if the session
 * was revoked, or if the profile no longer exists.
 */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const resolved = await resolveSession()
  return resolved.status === 'ok' ? resolved.user : null
}

export type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>

/**
 * Mint a session cookie for an account this server has already authenticated
 * by some means Firebase knows nothing about.
 *
 * Password sign-in gets its ID token from Firebase directly, as a by-product
 * of Firebase checking the password. Passkey sign-in has no such by-product:
 * the assertion is verified here, against a public key in Firestore, and
 * Google is never asked anything. So the server states the conclusion in a
 * custom token signed with the service account key and exchanges it for the
 * ID token that `createSessionCookie` requires.
 *
 * The result is indistinguishable from a password session — same cookie,
 * same 14-day cap, same revocation behaviour — which is the point. Nothing
 * downstream needs to know which door someone came through.
 */
export async function createSessionCookieForUid(uid: string): Promise<string> {
  const customToken = await adminAuth().createCustomToken(uid)
  const { idToken } = await signInWithCustomToken(customToken)
  return adminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
  })
}

/* ============================================================
 *  Cookie helpers
 * ========================================================== */

export function buildSessionCookie(value: string): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=${value}`,
    'Path=/',
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    'SameSite=Lax',
    'HttpOnly',
  ]
  // Secure only in production — localhost over http cannot set Secure cookies.
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  return parts.join('; ')
}

export function buildExpiredSessionCookie(): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'SameSite=Lax',
    'HttpOnly',
  ]
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  return parts.join('; ')
}
