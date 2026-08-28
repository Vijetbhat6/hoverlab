/**
 * POST /api/auth/passkey/register/options
 *
 * Returns the `PublicKeyCredentialCreationOptions` for adding a passkey to
 * the signed-in account, and parks the challenge server-side.
 *
 * Requires a session: a passkey is added to an account, not used to create
 * one, so whoever is asking must already be that account.
 */

import { NextResponse } from 'next/server'
import { generateRegistrationOptions } from '@simplewebauthn/server'

import { withJsonErrors } from '@/lib/route-errors'
import { getCurrentUser } from '@/lib/session'
import { listPasskeys } from '@/lib/firebase/passkeys'
import {
  issueChallenge,
  relyingPartyFrom,
  WebAuthnConfigError,
} from '@/lib/webauthn'

export const runtime = 'nodejs'

async function handle(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Sign in before adding a passkey.' },
      { status: 401 },
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

  const existing = await listPasskeys(user.id)

  const options = await generateRegistrationOptions({
    rpName: rp.rpName,
    rpID: rp.rpID,
    // The uid, verbatim. It comes back as `userHandle` on every future
    // assertion, which is what makes a sign-in that starts with no email
    // address resolvable to an account.
    userID: new Uint8Array(Buffer.from(user.id, 'utf8')),
    userName: user.email,
    userDisplayName: user.name ?? user.email,
    attestationType: 'none',
    // Without this, registering a second passkey on a device that already
    // has one silently creates a duplicate rather than telling the person
    // they are already set up.
    excludeCredentials: existing.map((p) => ({
      id: p.id,
      transports: p.transports,
    })),
    authenticatorSelection: {
      // 'required' on both counts, because this credential is a way to sign
      // in on its own. A discoverable credential is what lets the sign-in
      // page offer a passkey before anyone has typed an email; user
      // verification is what stops a borrowed laptop or a found security key
      // from being an account.
      residentKey: 'required',
      userVerification: 'required',
    },
  })

  await issueChallenge(options.challenge, 'register', user.id)

  return NextResponse.json({ options })
}

export const POST = withJsonErrors('auth/passkey/register/options', handle)
