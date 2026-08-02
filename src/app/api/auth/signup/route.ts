/**
 * POST /api/auth/signup
 * Body: { email, password, name? }
 *
 * Creates a new user, sets the session cookie, and returns the public
 * user object. Responds with 409 if the email is already registered.
 */

import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { db } from '@/lib/db'
import {
  buildSessionCookie,
  createSessionToken,
  parseEmail,
  isValidPassword,
  hashPassword,
} from '@/lib/auth'

export const runtime = 'nodejs'

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

  const normalizedEmail = parseEmail(email)
  if (!normalizedEmail) {
    return NextResponse.json(
      { error: 'Please enter a valid email address.' },
      { status: 400 },
    )
  }
  if (typeof password !== 'string' || !isValidPassword(password)) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters long.' },
      { status: 400 },
    )
  }
  const trimmedName =
    typeof name === 'string' && name.trim().length > 0
      ? name.trim().slice(0, 80)
      : null

  // Check for existing user. This is the friendly path; the unique index on
  // User.email is what actually guarantees no duplicate, and the catch below
  // covers the window between this read and the write.
  const existing = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  })
  if (existing) {
    return NextResponse.json(
      { error: 'An account with that email already exists.' },
      { status: 409 },
    )
  }

  const passwordHash = await hashPassword(password)

  let user
  try {
    user = await db.user.create({
      data: { email: normalizedEmail, name: trimmedName, passwordHash },
      select: { id: true, email: true, name: true, createdAt: true },
    })
  } catch (err) {
    // P2002 = unique constraint violation. Two signups for the same address
    // raced past the check above (a double-submitted form is enough). The
    // second one is not a server fault, so answer it exactly as the check
    // would have rather than surfacing an opaque 500.
    if ((err as { code?: string })?.code === 'P2002') {
      return NextResponse.json(
        { error: 'An account with that email already exists.' },
        { status: 409 },
      )
    }
    // Anything else is genuinely ours — a database that is down or a schema
    // the deploy never migrated. Log the detail, tell the user something
    // true and actionable, and never leak the internals into the response.
    console.error('[auth/signup] failed to create user:', err)
    return NextResponse.json(
      { error: 'Could not create your account right now. Please try again.' },
      { status: 500 },
    )
  }

  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  })

  const res = NextResponse.json(
    { user, message: 'Account created.' },
    { status: 201 },
  )
  res.headers.set('Set-Cookie', buildSessionCookie(token))
  return res
}

export const POST = withJsonErrors('auth/signup', handleSignup)
