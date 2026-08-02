/**
 * Server-side helpers for reading the current session.
 *
 * Safe to import from Route Handlers and Server Components only.
 * (For Client Components, use the `useAuth` hook instead.)
 */

import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  type DecodedSession,
} from '@/lib/auth'

/**
 * Read and verify the session JWT from the request cookies.
 * Returns the decoded session, or null if the user is not authenticated.
 */
export async function getSession(): Promise<DecodedSession | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export interface PublicUser {
  id: string
  email: string
  name: string | null
  createdAt: Date
}

/**
 * Why a request is not authenticated, which callers need to tell apart:
 *
 *  - `anonymous` — no cookie, or one this server can't verify. Nothing to do.
 *  - `revoked`   — the signature checks out, but the session is no longer
 *                  honored: the user row is gone (deleted account, dev
 *                  database reset) or a password reset moved the epoch past
 *                  it. The cookie is dead weight that proxy.ts still reads
 *                  as "signed in", so whoever gets this should expire it.
 */
export type SessionResolution =
  | { status: 'ok'; user: PublicUser }
  | { status: 'anonymous' }
  | { status: 'revoked' }

/**
 * Resolve the session all the way to a User row, reporting *why* when that
 * fails. Everything auth-related funnels through here so the epoch rule
 * below is enforced in exactly one place.
 */
export async function resolveSession(): Promise<SessionResolution> {
  const session = await getSession()
  if (!session) return { status: 'anonymous' }

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      sessionsValidFrom: true,
    },
  })
  if (!user) return { status: 'revoked' }

  // A password reset stamps sessionsValidFrom, which retroactively revokes
  // every token issued before it. Session JWTs are stateless and live for
  // 30 days, so this comparison is the only thing standing between "I reset
  // my password because someone had my account" and that someone keeping
  // access for a month.
  //
  // Strictly-less-than, against an epoch already truncated to a whole second
  // (see sessionEpochNow), so a token minted during the same second as the
  // reset is not caught by its own revocation.
  if (
    user.sessionsValidFrom &&
    session.iat < Math.floor(user.sessionsValidFrom.getTime() / 1000)
  ) {
    return { status: 'revoked' }
  }

  const { sessionsValidFrom: _epoch, ...publicUser } = user
  return { status: 'ok', user: publicUser }
}

/**
 * Resolve the current User row from the DB. Returns null if not logged in,
 * if the user no longer exists (e.g. they deleted their account), or if the
 * session was revoked by a password reset.
 */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const resolved = await resolveSession()
  return resolved.status === 'ok' ? resolved.user : null
}

export type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>
