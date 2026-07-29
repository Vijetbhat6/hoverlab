/**
 * POST /api/auth/login
 * Body: { email, password }
 *
 * Verifies credentials and sets the session cookie. Returns the public
 * user object. Always returns 401 with a generic message on failure —
 * never reveal whether the email exists, to prevent account enumeration.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  buildSessionCookie,
  createSessionToken,
  isValidEmail,
  verifyPassword,
} from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
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

  if (typeof email !== 'string' || !isValidEmail(email)) {
    return NextResponse.json(
      { error: 'Invalid email or password.' },
      { status: 401 },
    )
  }
  if (typeof password !== 'string' || password.length === 0) {
    return NextResponse.json(
      { error: 'Invalid email or password.' },
      { status: 401 },
    )
  }

  const normalizedEmail = email.trim().toLowerCase()
  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, name: true, passwordHash: true },
  })

  // Always run a bcrypt compare even if the user doesn't exist, so the
  // response timing doesn't leak whether an account exists.
  const dummyHash = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.5gQNZ2cW0eXjbT9YqMjU2cIXYpOm'
  const hashToCheck = user?.passwordHash ?? dummyHash
  const ok = await verifyPassword(password, hashToCheck)

  if (!user || !ok) {
    return NextResponse.json(
      { error: 'Invalid email or password.' },
      { status: 401 },
    )
  }

  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  })

  const publicUser = {
    id: user.id,
    email: user.email,
    name: user.name,
  }

  const res = NextResponse.json({ user: publicUser, message: 'Signed in.' })
  res.headers.set('Set-Cookie', buildSessionCookie(token))
  return res
}
