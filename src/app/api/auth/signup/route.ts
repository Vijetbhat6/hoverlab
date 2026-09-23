/**
 * POST /api/auth/signup
 * Body: { email, password, name? }
 *
 * Creates the Firebase account from the server, writes the profile document,
 * and sets the session cookie — so a new account arrives signed in, as it did
 * before. Responds 409 if the email is already registered.
 *
 * ── EMAIL ENUMERATION: WHAT THIS CLOSES AND WHAT IT DOES NOT ───────────
 *
 * Signup is an oracle for "does this address have an account": a new
 * address gets 201 and a session, a registered one gets 409. Login and
 * forgot-password answer identically either way, so this is the one place
 * the list of who uses the product can be read off.
 *
 * The complete fix is verify-by-email-first signup: accept ANY address with
 * the same "check your inbox" answer, create the account only when the link
 * in the email is followed, and tell an existing owner by email that
 * somebody tried to register their address. That needs an email transport
 * this deployment does not have (RESEND_API_KEY is unset), so it is NOT
 * done and this route does not pretend otherwise.
 *
 * What is done, because it is achievable without one:
 *
 *   1. Neutral wording. The 409 no longer says the account exists; it says
 *      "We couldn't create that account" and points at both ways forward.
 *      A person who really does have an account is still told what to do,
 *      and a screenshot of the response is no longer a confession.
 *
 *   2. A per-IP rate limit (lib/rate-limit.ts). Enumerating a list means
 *      asking about thousands of addresses; ten attempts in ten minutes
 *      turns that from a loop into an all-week job.
 *
 *   3. Roughly uniform timing. A refused signup returns after one round
 *      trip to Firebase; a successful one goes on to set a display name,
 *      write the profile and mint a session cookie — several hundred
 *      milliseconds more. `EXISTING_ACCOUNT_MIN_MS` pads the refused
 *      answer up to a typical success so the two are not told apart by a
 *      stopwatch. It is a floor, not a match: real success time varies.
 *
 * RESIDUAL, plainly: the STATUS CODE still differs (201 + Set-Cookie versus
 * 409), so a caller who reads the status learns exactly what wording and
 * timing were meant to hide. Only email verification removes that. Until
 * a transport exists, treat "is this address registered" as discoverable
 * at ten guesses per ten minutes per address, not as private.
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
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { buildSessionCookie, SESSION_MAX_AGE_SECONDS } from '@/lib/session'

export const runtime = 'nodejs'

/** Firebase enforces 6; the form asks for 8 and this is the backstop. */
const MIN_PASSWORD_LENGTH = 8
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * What a refused signup says. Deliberately does not say why: "already
 * exists" is the sentence that turns the form into a directory of users.
 */
const COULD_NOT_CREATE =
  "We couldn't create that account. If you already have one, sign in or reset your password."

/**
 * The floor, in milliseconds, for answering "that address is taken".
 *
 * Roughly the wall time of the success path (Firebase signUp, display name,
 * profile write, session cookie). Padding costs function time only on the
 * refused branch, which the rate limit already bounds.
 */
const EXISTING_ACCOUNT_MIN_MS = 900

async function padTo(startedAt: number, minMs: number): Promise<void> {
  const remaining = minMs - (Date.now() - startedAt)
  if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining))
}

async function handleSignup(req: Request) {
  const limited = await enforceRateLimit(req, RATE_LIMITS.signup)
  if (limited) return limited

  const startedAt = Date.now()

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
  } catch (err) {
    if (err instanceof FirebaseAuthError) {
      // EMAIL_EXISTS is the only 409 this call can produce. Neutral words,
      // and the floor on timing — see the docblock.
      if (err.status === 409) {
        await padTo(startedAt, EXISTING_ACCOUNT_MIN_MS)
        return NextResponse.json({ error: COULD_NOT_CREATE }, { status: 409 })
      }
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }

  // Deliberately not fatal. The account exists from the line above, so
  // failing here would report "sign up failed" for an account that was
  // created — and the retry would then fail with "email already exists",
  // leaving the person stuck with no way forward. A missing display name is
  // worth far less than that.
  if (displayName) {
    try {
      await setDisplayName(result.idToken, displayName)
    } catch (err) {
      console.error(
        '[auth/signup] account created but display name could not be set:',
        err instanceof Error ? err.message : err,
      )
    }
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
