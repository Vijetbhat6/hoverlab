/**
 * POST /api/auth/passkey/login/verify
 * Body: { response: AuthenticationResponseJSON }
 *
 * Verifies the assertion from `navigator.credentials.get()` and, on success,
 * sets the same session cookie the password route sets.
 *
 * Firebase is not consulted about the credential — it has never heard of
 * WebAuthn. The signature is checked here against the public key stored at
 * registration, and only then does the server ask Firebase for a session on
 * that account's behalf. See `createSessionCookieForUid`.
 */

import { NextResponse } from 'next/server'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import type { AuthenticationResponseJSON } from '@simplewebauthn/server'

import { withJsonErrors } from '@/lib/route-errors'
import { FirebaseAuthError } from '@/lib/firebase/rest'
import { ensureUserProfile } from '@/lib/firebase/users'
import { getPasskey, touchPasskey } from '@/lib/firebase/passkeys'
import { adminAuth } from '@/lib/firebase/admin'
import { buildSessionCookie, createSessionCookieForUid } from '@/lib/session'
import {
  consumeChallenge,
  relyingPartyFrom,
  WebAuthnConfigError,
} from '@/lib/webauthn'

export const runtime = 'nodejs'

/**
 * One sentence for every way this can fail, matching how the password route
 * treats a wrong password: which passkey is unknown, which account is
 * disabled, and whether one exists at all are all things an attacker would
 * like to learn by trying.
 */
const REJECTED = 'That passkey was not accepted. Try again, or sign in with your password.'

async function handle(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { response } = (body ?? {}) as { response?: unknown }
  if (!response || typeof response !== 'object') {
    return NextResponse.json({ error: REJECTED }, { status: 400 })
  }

  const pending = await consumeChallenge('login')
  if (!pending) {
    return NextResponse.json(
      { error: 'That sign-in request has expired. Try the passkey button again.' },
      { status: 400 },
    )
  }

  let rp
  try {
    rp = relyingPartyFrom(req)
  } catch (err) {
    if (err instanceof WebAuthnConfigError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    throw err
  }

  const assertion = response as AuthenticationResponseJSON
  const stored = typeof assertion.id === 'string' ? await getPasskey(assertion.id) : null
  if (!stored) {
    return NextResponse.json({ error: REJECTED }, { status: 401 })
  }

  let verification
  try {
    verification = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge: pending.challenge,
      expectedOrigin: rp.origin,
      expectedRPID: rp.rpID,
      requireUserVerification: true,
      credential: {
        id: stored.id,
        publicKey: stored.publicKey,
        counter: stored.counter,
        transports: stored.transports,
      },
    })
  } catch (err) {
    console.error('[auth/passkey/login] assertion rejected:', err)
    return NextResponse.json({ error: REJECTED }, { status: 401 })
  }

  if (!verification.verified) {
    return NextResponse.json({ error: REJECTED }, { status: 401 })
  }

  const { newCounter } = verification.authenticationInfo

  // The signature counter is the only clone detector WebAuthn offers, and it
  // only works for authenticators that keep one. Synced passkeys — iCloud
  // Keychain, Google Password Manager — report 0 forever, by design, because
  // they legitimately exist on several devices at once. So the check applies
  // only where the stored counter proves the authenticator maintains it.
  if (stored.counter > 0 && newCounter <= stored.counter) {
    console.error(
      `[auth/passkey/login] counter did not advance for ${stored.id} ` +
        `(stored ${stored.counter}, presented ${newCounter}) — possible cloned authenticator.`,
    )
    return NextResponse.json({ error: REJECTED }, { status: 401 })
  }

  // A disabled or deleted account must not be reachable through a passkey
  // that outlived it. Firebase enforces this for password sign-in; here the
  // server has to ask.
  let account
  try {
    account = await adminAuth().getUser(stored.uid)
  } catch {
    return NextResponse.json({ error: REJECTED }, { status: 401 })
  }
  if (account.disabled) {
    return NextResponse.json({ error: REJECTED }, { status: 403 })
  }

  const profile = await ensureUserProfile(stored.uid, {
    email: account.email ?? '',
    name: account.displayName ?? null,
  })

  let sessionCookie: string
  try {
    sessionCookie = await createSessionCookieForUid(stored.uid)
  } catch (err) {
    if (err instanceof FirebaseAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }

  // Deliberately after the session is minted, and deliberately not fatal.
  // Failing the sign-in because a bookkeeping write failed would be a
  // strictly worse outcome than a stale "last used" timestamp.
  try {
    await touchPasskey(stored.id, newCounter)
  } catch (err) {
    console.error('[auth/passkey/login] could not record passkey use:', err)
  }

  const res = NextResponse.json({
    user: { id: profile.id, email: profile.email, name: profile.name },
    message: 'Signed in.',
  })
  // append, not set: consuming the challenge clears its own cookie, and
  // overwriting the header would drop that instruction on the floor.
  res.headers.append('Set-Cookie', buildSessionCookie(sessionCookie))
  return res
}

export const POST = withJsonErrors('auth/passkey/login/verify', handle)
