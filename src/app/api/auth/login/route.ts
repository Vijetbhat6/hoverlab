/**
 * POST /api/auth/login
 * Body: { email, password }
 *
 * Verifies credentials with Firebase from the server, then sets the session
 * cookie. The browser never contacts Google directly — see lib/firebase/rest.ts
 * for why that matters.
 *
 * Failures return the same generic message whether the account exists or the
 * password is wrong: telling them apart is exactly what account enumeration
 * needs.
 */

import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { adminAuth } from '@/lib/firebase/admin'
import { ensureUserProfile } from '@/lib/firebase/users'
import { FirebaseAuthError, signInWithPassword } from '@/lib/firebase/rest'
import { buildSessionCookie, SESSION_MAX_AGE_SECONDS } from '@/lib/session'

export const runtime = 'nodejs'

async function handleLogin(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { email, password } = (body ?? {}) as {
    email?: unknown
    password?: unknown
  }

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return NextResponse.json(
      { error: 'Invalid email or password.' },
      { status: 401 },
    )
  }

  let result
  try {
    result = await signInWithPassword(email.trim(), password)
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

export const POST = withJsonErrors('auth/login', handleLogin)
