/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's public profile, or
 * { user: null } if not logged in. Used by the client-side AuthProvider
 * on mount to hydrate the session.
 */

import { NextResponse } from 'next/server'
import { resolveSession } from '@/lib/session'
import { buildExpiredSessionCookie } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  const resolved = await resolveSession()

  if (resolved.status === 'ok') {
    return NextResponse.json({ user: resolved.user })
  }

  const res = NextResponse.json({ user: null })

  if (resolved.status === 'revoked') {
    // The cookie is cryptographically valid but no longer honored — its user
    // row is gone (dev database reset, deleted account), or a password reset
    // revoked it. That state locks people out: proxy.ts trusts the signature
    // alone, so it treats them as authenticated and bounces every /login
    // visit to /library, while this route reports them logged out. The header
    // offers "Sign in", the link goes nowhere, and the only escape is
    // clearing cookies by hand. Expiring the cookie here turns an
    // unrecoverable state into a normal logged-out one on the next
    // navigation.
    res.headers.set('Set-Cookie', buildExpiredSessionCookie())
  }

  return res
}
