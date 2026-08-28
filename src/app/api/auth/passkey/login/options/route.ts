/**
 * POST /api/auth/passkey/login/options
 *
 * Returns the `PublicKeyCredentialRequestOptions` for signing in, and parks
 * the challenge server-side.
 *
 * Public, and deliberately says nothing about who exists. There is no
 * `allowCredentials` list: the browser is asked for any discoverable passkey
 * it holds for this domain and the person picks. That is what makes the
 * sign-in button work with no email typed first — and it also means this
 * endpoint cannot be used to ask "does this address have an account", which
 * an email-first flow would answer on every call.
 */

import { NextResponse } from 'next/server'
import { generateAuthenticationOptions } from '@simplewebauthn/server'

import { withJsonErrors } from '@/lib/route-errors'
import {
  issueChallenge,
  relyingPartyFrom,
  WebAuthnConfigError,
} from '@/lib/webauthn'

export const runtime = 'nodejs'

async function handle(req: Request) {
  let rp
  try {
    rp = relyingPartyFrom(req)
  } catch (err) {
    if (err instanceof WebAuthnConfigError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    throw err
  }

  const options = await generateAuthenticationOptions({
    rpID: rp.rpID,
    userVerification: 'required',
  })

  await issueChallenge(options.challenge, 'login', null)

  return NextResponse.json({ options })
}

export const POST = withJsonErrors('auth/passkey/login/options', handle)
