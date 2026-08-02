/**
 * POST /api/auth/session
 * Body: { idToken }
 *
 * Exchanges a Firebase ID token for an httpOnly session cookie. This is the
 * only place a session is created — sign-in and sign-up both land here,
 * because from the server's point of view they are the same act: prove who
 * you are with a token Firebase issued, receive a cookie.
 *
 * Why a cookie at all, when the browser already holds a Firebase ID token:
 * ID tokens live in JavaScript-reachable storage and expire hourly. An
 * httpOnly cookie is not reachable from script, survives a page load, and is
 * sent with the request that renders the page — so Server Components and
 * proxy.ts can act on the session instead of every page flashing signed-out
 * until the client SDK rehydrates.
 */

import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { adminAuth } from '@/lib/firebase/admin'
import { ensureUserProfile } from '@/lib/firebase/users'
import { buildSessionCookie, SESSION_MAX_AGE_SECONDS } from '@/lib/session'

export const runtime = 'nodejs'

async function handleCreateSession(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { idToken } = (body ?? {}) as { idToken?: unknown }
  if (typeof idToken !== 'string' || !idToken) {
    return NextResponse.json(
      { error: 'Sign in could not be completed. Please try again.' },
      { status: 400 },
    )
  }

  let decoded
  try {
    // checkRevoked so a token minted before a password change cannot be
    // traded for a fresh 14-day cookie.
    decoded = await adminAuth().verifyIdToken(idToken, true)
  } catch {
    return NextResponse.json(
      { error: 'Sign in could not be verified. Please try again.' },
      { status: 401 },
    )
  }

  const profile = await ensureUserProfile(decoded.uid, {
    email: decoded.email ?? '',
    name: typeof decoded.name === 'string' ? decoded.name : null,
  })

  let sessionCookie: string
  try {
    sessionCookie = await adminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    })
  } catch {
    // Firebase refuses to mint a session cookie from a token whose sign-in
    // happened more than five minutes ago. Re-authenticating is the fix, so
    // say that rather than reporting a generic failure.
    return NextResponse.json(
      { error: 'That sign-in has gone stale. Please sign in again.' },
      { status: 401 },
    )
  }

  const res = NextResponse.json({
    user: {
      id: profile.id,
      email: profile.email,
      name: profile.name,
    },
  })
  res.headers.set('Set-Cookie', buildSessionCookie(sessionCookie))
  return res
}

export const POST = withJsonErrors('auth/session', handleCreateSession)
