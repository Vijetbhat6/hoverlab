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

/**
 * Resolve the current User row from the DB. Returns null if not logged in
 * or if the user no longer exists (e.g. they deleted their account).
 */
export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null
  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, name: true, createdAt: true },
  })
  return user
}

export type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>
