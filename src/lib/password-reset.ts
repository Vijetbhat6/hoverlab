/**
 * Password reset tokens.
 *
 * Shape of the flow:
 *   1. /api/auth/forgot-password mints a token, stores only its SHA-256,
 *      and emails the raw value inside a link.
 *   2. /api/auth/reset-password looks the row up by that same hash, checks
 *      it is unexpired and unused, rewrites the password hash, and stamps
 *      User.sessionsValidFrom so every session issued earlier stops working.
 *
 * Node-only (`node:crypto`) — safe here because both routes declare
 * `runtime = 'nodejs'`. Do not import this from proxy.ts, which runs on the
 * Edge runtime.
 */

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/** How long a reset link stays valid. Short: it is emailed in the clear. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

/** 32 bytes of entropy, URL-safe so it survives being a query parameter. */
export function generateResetToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Constant-time comparison of two hex digests.
 *
 * The database lookup is by unique hash, so this guards only the final
 * confirmation — but a length-mismatched or malformed input must not throw
 * out of `timingSafeEqual`, hence the explicit length check.
 */
export function safeHashEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex')
  const bufB = Buffer.from(b, 'hex')
  if (bufA.length === 0 || bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/**
 * The instant to stamp on User.sessionsValidFrom, truncated to a whole
 * second.
 *
 * JWT `iat` has one-second resolution. Storing an epoch with millisecond
 * precision would make a token minted in the same second look older than
 * the epoch and be rejected — the user would reset their password and
 * immediately be unable to sign in. Truncating, plus the strictly-less-than
 * comparison in lib/session.ts, keeps that boundary case working.
 */
export function sessionEpochNow(): Date {
  return new Date(Math.floor(Date.now() / 1000) * 1000)
}

/* ============================================================
 *  Rate limiting
 * ========================================================== */

/**
 * Best-effort in-memory throttle: N requests per key per window, per server
 * process. It is not a distributed limiter — on multi-instance hosting each
 * instance keeps its own counter — but it is enough to stop a single client
 * from using the endpoint as a free mail cannon, which is the abuse this
 * flow actually invites.
 */
const buckets = new Map<string, number[]>()

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)

  if (hits.length >= limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((windowMs - (now - hits[0])) / 1000),
    )
    buckets.set(key, hits)
    return { allowed: false, retryAfterSeconds }
  }

  hits.push(now)
  buckets.set(key, hits)

  // Opportunistic sweep so the map cannot grow without bound on a
  // long-lived process.
  if (buckets.size > 5_000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k)
    }
  }

  return { allowed: true, retryAfterSeconds: 0 }
}

/* ============================================================
 *  Email body
 * ========================================================== */

export function resetEmail(resetUrl: string, ttlMinutes: number) {
  const text = [
    'Someone asked to reset the password for your Hoverlab account.',
    '',
    'Open this link to choose a new one:',
    resetUrl,
    '',
    `The link expires in ${ttlMinutes} minutes and can only be used once.`,
    "If this wasn't you, ignore this email — your password stays as it is.",
  ].join('\n')

  const html = `
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0f172a">
  <h1 style="margin:0 0 16px;font-size:20px;font-weight:700">Reset your password</h1>
  <p style="margin:0 0 24px;line-height:1.6;color:#475569">
    Someone asked to reset the password for your Hoverlab account.
  </p>
  <p style="margin:0 0 24px">
    <a href="${resetUrl}" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Choose a new password</a>
  </p>
  <p style="margin:0 0 8px;line-height:1.6;color:#475569;font-size:14px">
    The link expires in ${ttlMinutes} minutes and can only be used once.
    If this wasn't you, ignore this email — your password stays as it is.
  </p>
  <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;word-break:break-all">${resetUrl}</p>
</div>`.trim()

  return { subject: 'Reset your Hoverlab password', text, html }
}
