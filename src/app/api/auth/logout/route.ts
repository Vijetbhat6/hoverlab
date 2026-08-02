/**
 * POST /api/auth/logout
 *
 * Clears the session cookie and revokes the account's refresh tokens, so
 * signing out on one device cannot be quietly undone by another device
 * refreshing an old token. Always returns 200, even if the user was already
 * logged out — idempotent, and a sign-out that reports failure strands
 * people on a page they are trying to leave.
 */

import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { adminAuth } from '@/lib/firebase/admin'
import { buildExpiredSessionCookie, getSession } from '@/lib/session'

export const runtime = 'nodejs'

async function handleLogout() {
  const session = await getSession()
  if (session) {
    try {
      await adminAuth().revokeRefreshTokens(session.uid)
    } catch {
      // Best-effort: the cookie is cleared regardless, and failing here
      // would leave the user apparently still signed in.
    }
  }

  const res = NextResponse.json({ message: 'Signed out.' })
  res.headers.set('Set-Cookie', buildExpiredSessionCookie())
  return res
}

export const POST = withJsonErrors('auth/logout', handleLogout)
