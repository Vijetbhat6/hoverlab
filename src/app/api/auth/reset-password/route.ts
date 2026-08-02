/**
 * GET  /api/auth/reset-password?token=…   → { valid }
 * POST /api/auth/reset-password           Body: { token, password }
 *
 * GET lets the page tell someone their link is dead before they type a new
 * password. POST consumes the token, rewrites the password, and revokes
 * every session issued before this moment — including the one in the browser
 * doing the reset, which is then sent to /login to sign in fresh.
 */

import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { db } from '@/lib/db'
import {
  buildExpiredSessionCookie,
  hashPassword,
  isValidPassword,
} from '@/lib/auth'
import {
  hashResetToken,
  rateLimit,
  safeHashEquals,
  sessionEpochNow,
} from '@/lib/password-reset'

export const runtime = 'nodejs'

const LIMIT = 10
const WINDOW_MS = 15 * 60 * 1000

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

/** Resolve a raw token to its row, or null if unusable for any reason. */
async function findUsableToken(token: string) {
  if (!token) return null
  const tokenHash = hashResetToken(token)

  const row = await db.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      tokenHash: true,
      expiresAt: true,
      usedAt: true,
    },
  })

  if (!row) return null
  if (!safeHashEquals(row.tokenHash, tokenHash)) return null
  if (row.usedAt) return null
  if (row.expiresAt.getTime() <= Date.now()) return null
  return row
}

async function handleValidateToken(req: Request) {
  const token = new URL(req.url).searchParams.get('token') ?? ''
  const { allowed } = rateLimit(`rp:ip:${clientIp(req)}`, LIMIT, WINDOW_MS)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in a few minutes.' },
      { status: 429 },
    )
  }
  return NextResponse.json({ valid: Boolean(await findUsableToken(token)) })
}

async function handleResetPassword(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { token, password } = (body ?? {}) as {
    token?: unknown
    password?: unknown
  }

  const { allowed, retryAfterSeconds } = rateLimit(
    `rp:ip:${clientIp(req)}`,
    LIMIT,
    WINDOW_MS,
  )
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
    )
  }

  if (typeof password !== 'string' || !isValidPassword(password)) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters long.' },
      { status: 400 },
    )
  }

  const row = typeof token === 'string' ? await findUsableToken(token) : null
  if (!row) {
    return NextResponse.json(
      {
        error:
          'This reset link is invalid or has expired. Request a new one.',
        expired: true,
      },
      { status: 400 },
    )
  }

  const passwordHash = await hashPassword(password)

  // One transaction: a partial apply here would either change the password
  // while leaving the link live, or burn the link without changing anything.
  await db.$transaction([
    db.user.update({
      where: { id: row.userId },
      data: { passwordHash, sessionsValidFrom: sessionEpochNow() },
    }),
    db.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
    db.passwordResetToken.deleteMany({
      where: { userId: row.userId, usedAt: null },
    }),
  ])

  const res = NextResponse.json({
    message: 'Password updated. You can sign in with your new password.',
  })
  // The cookie in this browser predates the new epoch, so it is already
  // dead server-side; clearing it keeps the client from rendering a
  // half-signed-in header until the next /api/auth/me.
  res.headers.set('Set-Cookie', buildExpiredSessionCookie())
  return res
}

export const GET = withJsonErrors('auth/reset-password', handleValidateToken)
export const POST = withJsonErrors('auth/reset-password', handleResetPassword)
