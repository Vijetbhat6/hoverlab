/**
 * POST /api/auth/signup
 * Body: { email, password, name? }
 *
 * Creates a new user, sets the session cookie, and returns the public
 * user object. Responds with 409 if the email is already registered.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  buildSessionCookie,
  createSessionToken,
  isValidEmail,
  isValidPassword,
  hashPassword,
} from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
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

  if (typeof email !== 'string' || !isValidEmail(email)) {
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

  const normalizedEmail = email.trim().toLowerCase()

  // Check for existing user.
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
  const user = await db.user.create({
    data: { email: normalizedEmail, name: trimmedName, passwordHash },
    select: { id: true, email: true, name: true, createdAt: true },
  })

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
