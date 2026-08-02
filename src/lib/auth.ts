/**
 * Authentication library for Hoverlab.
 *
 * Design:
 *  - Passwords are hashed with bcryptjs (10 rounds).
 *  - Sessions are JWTs signed with HS256 using AUTH_SECRET, stored in an
 *    httpOnly cookie named `cssfx:session`. Lifetime: 30 days.
 *  - The JWT payload contains only { sub, email, name, iat, exp }.
 *  - We use `jose` because it works in both the Node.js runtime and the
 *    Edge runtime (Next.js route handlers can run in either).
 */

import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const SESSION_COOKIE = 'cssfx:session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days

// Stable dev-only fallback so a missing AUTH_SECRET in development never
// 500s login/signup. In production we still fail fast — silently using a
// known secret would be a security disaster.
const DEV_FALLBACK_SECRET =
  'hoverlab-dev-only-do-not-use-in-production-9f3a2c7e'
let devSecretWarned = false

function getSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'AUTH_SECRET is not set. Add a random string to your .env file.',
      )
    }
    // Dev only. Logged once per process so it's noisy but not spammy.
    if (!devSecretWarned) {
      devSecretWarned = true
      console.warn(
        '[auth] AUTH_SECRET is not set — using a dev-only fallback. ' +
          'Sessions will be invalidated on restart. Add AUTH_SECRET to .env ' +
          'for stable sessions.',
      )
    }
    return new TextEncoder().encode(DEV_FALLBACK_SECRET)
  }
  return new TextEncoder().encode(raw)
}

export interface SessionPayload {
  sub: string
  email: string
  name: string | null
}

export interface DecodedSession extends SessionPayload {
  iat: number
  exp: number
}

/* ============================================================
 *  Password hashing
 * ========================================================== */

const BCRYPT_ROUNDS = 10

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash)
  } catch {
    return false
  }
}

/* ============================================================
 *  JWT session
 * ========================================================== */

export async function createSessionToken(
  payload: SessionPayload,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_TTL_SECONDS)
    .sign(getSecret())
}

export async function verifySessionToken(
  token: string,
): Promise<DecodedSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ['HS256'],
    })
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string'
    ) {
      return null
    }
    return {
      sub: payload.sub,
      email: payload.email,
      name: typeof payload.name === 'string' ? payload.name : null,
      iat: Number(payload.iat ?? 0),
      exp: Number(payload.exp ?? 0),
    }
  } catch {
    return null
  }
}

/* ============================================================
 *  Cookie helpers — safe to call from Route Handlers (Server-side only).
 * ========================================================== */

export const SESSION_COOKIE_NAME = SESSION_COOKIE
export const SESSION_MAX_AGE = SESSION_TTL_SECONDS

export function buildSessionCookie(token: string): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    `Max-Age=${SESSION_TTL_SECONDS}`,
    'SameSite=Lax',
    'HttpOnly',
  ]
  // Secure flag only in production — localhost over http can't use Secure.
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  return parts.join('; ')
}

export function buildExpiredSessionCookie(): string {
  const parts = [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'Max-Age=0',
    'SameSite=Lax',
    'HttpOnly',
  ]
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  return parts.join('; ')
}

/* ============================================================
 *  Validation
 * ========================================================== */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 254
}

/**
 * The canonical stored form of an address: surrounding whitespace removed,
 * lowercased. This is the shape every `User.email` in the database is
 * written in, so it is also the only shape a lookup may use.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Normalize an untrusted email, then validate. Returns the canonical form,
 * or null if it isn't a usable address.
 *
 * The order matters, and getting it backwards is not a cosmetic bug. EMAIL_RE
 * rejects any whitespace, so validating the raw string first means an address
 * that merely arrived with a trailing space — which iOS/Android keyboards and
 * password managers append routinely, and which every paste from a contacts
 * app carries — is turned away as malformed. The visible symptom is "Please
 * enter a valid email address." on an address that is plainly valid at signup,
 * and "Invalid email or password." on a correct password at login, with the
 * matching account sitting right there in the database. Every route takes this
 * one path so the normalize-then-validate order cannot drift apart again.
 */
export function parseEmail(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const normalized = normalizeEmail(input)
  return isValidEmail(normalized) ? normalized : null
}

/** Password must be at least 8 chars, at most 128 chars. */
export function isValidPassword(password: string): boolean {
  return password.length >= 8 && password.length <= 128
}
