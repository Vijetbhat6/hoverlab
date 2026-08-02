/**
 * POST /api/auth/forgot-password
 * Body: { email }
 *
 * Mints a single-use reset token and emails it. Always answers 200 with the
 * same body whether or not the address has an account — the response is a
 * public oracle otherwise, and "no account with that email" is exactly the
 * signal someone enumerating a user list wants. The only non-200 is 429.
 */

import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { db } from '@/lib/db'
import { parseEmail } from '@/lib/auth'
import { sendMail } from '@/lib/mail'
import {
  RESET_TOKEN_TTL_MS,
  generateResetToken,
  hashResetToken,
  rateLimit,
  resetEmail,
} from '@/lib/password-reset'

export const runtime = 'nodejs'

const WINDOW_MS = 15 * 60 * 1000
/**
 * Per address: enough to cover "it didn't arrive, send another" without
 * letting one address be used to bomb someone's inbox.
 */
const EMAIL_LIMIT = 3
/**
 * Per client: deliberately looser than the per-address limit. Offices,
 * schools and mobile carriers put many people behind one address, so a
 * limit tight enough to be interesting per-user locks out everyone else
 * sharing that IP.
 */
const IP_LIMIT = 10

const GENERIC_OK = {
  message:
    'If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.',
}

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

/**
 * Origin to build the reset link against.
 *
 * NEXT_PUBLIC_SITE_URL wins where it is set, so links in production always
 * point at the canonical domain regardless of which host header arrived.
 * Locally it is usually unset — and lib/site.ts hardcodes port 3000 as its
 * fallback, while dev commonly runs elsewhere — so fall back to the origin
 * the request actually came in on rather than emitting a dead link.
 */
function resetOrigin(req: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/$/, '')
  try {
    return new URL(req.url).origin
  } catch {
    return 'http://localhost:3000'
  }
}

async function handleForgotPassword(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { email } = (body ?? {}) as { email?: unknown }

  // Malformed input still returns the generic message: reporting "invalid
  // email" for some inputs and "check your inbox" for others would leak the
  // same information the generic response exists to hide.
  const normalizedEmail = parseEmail(email)
  if (!normalizedEmail) {
    return NextResponse.json(GENERIC_OK)
  }

  const limits: [string, number][] = [
    [`fp:ip:${clientIp(req)}`, IP_LIMIT],
    [`fp:email:${normalizedEmail}`, EMAIL_LIMIT],
  ]
  for (const [key, limit] of limits) {
    const { allowed, retryAfterSeconds } = rateLimit(key, limit, WINDOW_MS)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many reset requests. Try again in a few minutes.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
      )
    }
  }

  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true },
  })

  if (user) {
    // Drop this user's outstanding links. Requesting a new one is how people
    // react to a reset email they didn't expect, so the older links should
    // stop working at that moment, not an hour later.
    await db.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    })

    const token = generateResetToken()
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashResetToken(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    })

    const resetUrl = `${resetOrigin(req)}/reset-password?token=${encodeURIComponent(token)}`
    const mail = resetEmail(resetUrl, RESET_TOKEN_TTL_MS / 60_000)
    // Deliberately not awaited into the response shape: a mail provider
    // outage must not turn into a "that address has no account" signal.
    // Failures are logged inside sendMail.
    await sendMail({ to: user.email, ...mail })
  }

  return NextResponse.json(GENERIC_OK)
}

export const POST = withJsonErrors('auth/forgot-password', handleForgotPassword)
