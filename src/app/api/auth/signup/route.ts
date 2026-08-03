/**
 * POST /api/auth/signup
 * Body: { email, password, name? }
 *
 * Creates the Firebase account from the server, writes the profile document,
 * and sets the session cookie — so a new account arrives signed in, as it did
 * before. Responds 409 if the email is already registered.
 */

import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { adminAuth } from '@/lib/firebase/admin'
import { ensureUserProfile } from '@/lib/firebase/users'
import {
  FirebaseAuthError,
  setDisplayName,
  signUpWithPassword,
} from '@/lib/firebase/rest'
import { buildSessionCookie, SESSION_MAX_AGE_SECONDS } from '@/lib/session'

export const runtime = 'nodejs'

/** Firebase enforces 6; the form asks for 8 and this is the backstop. */
const MIN_PASSWORD_LENGTH = 8
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function handleSignup(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { email, password, name } = (body ?? {}) as {
    email?: unknown
    password?: unknown
    name?: unknown
  }

  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim()) || email.length > 254) {
    return NextResponse.json(
      { error: 'Please enter a valid email address.' },
      { status: 400 },
    )
  }
  if (
    typeof password !== 'string' ||
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > 128
  ) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` },
      { status: 400 },
    )
  }

  const displayName =
    typeof name === 'string' && name.trim() ? name.trim().slice(0, 80) : null

  let result
  try {
    result = await signUpWithPassword(email.trim(), password)
    if (displayName) await setDisplayName(result.idToken, displayName)
  } catch (err) {
    if (err instanceof FirebaseAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }

  const profile = await ensureUserProfile(result.localId, {
    email: result.email,
    name: displayName,
  })

  const sessionCookie = await adminAuth().createSessionCookie(result.idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
  })

  const res = NextResponse.json(
    {
      user: { id: profile.id, email: profile.email, name: profile.name },
      message: 'Account created.',
    },
    { status: 201 },
  )
  res.headers.set('Set-Cookie', buildSessionCookie(sessionCookie))
  return res
}

export const POST = withJsonErrors('auth/signup', handleSignup)
