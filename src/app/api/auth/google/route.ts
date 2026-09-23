/**
 * POST /api/auth/google
 * Body: { credential: string }  — the Google ID token from Identity Services
 *
 * The browser gets that token straight from Google's own Identity Services
 * script (accounts.google.com), never from Firebase — see lib/firebase/rest.ts
 * for why Firebase itself stays server-only. This route hands the token to
 * Firebase's signInWithIdp on the server, creating the Firebase account on
 * first sign-in, then mints the same session cookie every other sign-in
 * method produces.
 */

import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { adminAuth } from '@/lib/firebase/admin'
import { ensureUserProfile } from '@/lib/firebase/users'
import { FirebaseAuthError, signInWithGoogleIdToken } from '@/lib/firebase/rest'
import { buildSessionCookie, SESSION_MAX_AGE_SECONDS } from '@/lib/session'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { siteUrl } from '@/lib/site'

export const runtime = 'nodejs'

async function handleGoogleLogin(req: Request) {
  const limited = await enforceRateLimit(req, RATE_LIMITS.google)
  if (limited) return limited

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { credential } = (body ?? {}) as { credential?: unknown }
  if (typeof credential !== 'string' || !credential) {
    return NextResponse.json(
      { error: 'Google sign-in could not be verified. Please try again.' },
      { status: 400 },
    )
  }

  let result
  try {
    result = await signInWithGoogleIdToken(credential, siteUrl)
  } catch (err) {
    if (err instanceof FirebaseAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }

  const profile = await ensureUserProfile(result.localId, { email: result.email })

  const sessionCookie = await adminAuth().createSessionCookie(result.idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
  })

  const res = NextResponse.json({
    user: { id: profile.id, email: profile.email, name: profile.name },
    message: 'Signed in.',
  })
  res.headers.set('Set-Cookie', buildSessionCookie(sessionCookie))
  return res
}

export const POST = withJsonErrors('auth/google', handleGoogleLogin)
