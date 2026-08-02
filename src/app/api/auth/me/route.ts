/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's public profile, or
 * { user: null } if not logged in. Used by the client-side AuthProvider
 * on mount to hydrate the session.
 */

import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { buildExpiredSessionCookie, resolveSession } from '@/lib/session'

export const runtime = 'nodejs'

async function handleMe() {
  const resolved = await resolveSession()

  if (resolved.status === 'ok') {
    return NextResponse.json({ user: resolved.user })
  }

  const res = NextResponse.json({ user: null })

  if (resolved.status === 'revoked') {
    // A cookie is present but no longer honored — expired, revoked by a
    // password change or sign-out, issued by a different Firebase project,
    // or its account deleted. That state locks people out: proxy.ts sees a
    // cookie and treats them as signed in, bouncing every /login visit to
    // /library, while this route reports them signed out. The header offers
    // "Sign in", the link goes nowhere, and the only escape is clearing
    // cookies by hand. Expiring it here turns an unrecoverable state into a
    // normal signed-out one on the next navigation.
    res.headers.set('Set-Cookie', buildExpiredSessionCookie())
  }

  return res
}

export const GET = withJsonErrors('auth/me', handleMe)
