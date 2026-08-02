/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's public profile, or
 * { user: null } if not logged in. Used by the client-side AuthProvider
 * on mount to hydrate the session.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { buildExpiredSessionCookie } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ user: null })

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, name: true, createdAt: true },
  })

  if (!user) {
    // The cookie is cryptographically valid but its user row is gone — a dev
    // database reset, or an account deleted from /account. That state locks
    // people out: proxy.ts trusts the signature alone, so it treats them as
    // authenticated and bounces every /login visit to /library, while this
    // route reports them logged out. The header offers "Sign in", the link
    // goes nowhere, and the only escape is clearing cookies by hand.
    // Expiring the cookie here turns an unrecoverable state into a normal
    // logged-out one on the next navigation.
    const res = NextResponse.json({ user: null })
    res.headers.set('Set-Cookie', buildExpiredSessionCookie())
    return res
  }

  return NextResponse.json({ user })
}
