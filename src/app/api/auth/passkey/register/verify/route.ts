/**
 * POST /api/auth/passkey/register/verify
 * Body: { response: RegistrationResponseJSON, label?: string }
 *
 * Verifies the attestation produced by `navigator.credentials.create()` and
 * stores the credential against the signed-in account.
 */

import { NextResponse } from 'next/server'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import type { RegistrationResponseJSON } from '@simplewebauthn/server'

import { withJsonErrors } from '@/lib/route-errors'
import { getCurrentUser } from '@/lib/session'
import { getPasskey, savePasskey, toPublicPasskey, listPasskeys } from '@/lib/firebase/passkeys'
import {
  consumeChallenge,
  describeDevice,
  relyingPartyFrom,
  WebAuthnConfigError,
} from '@/lib/webauthn'

export const runtime = 'nodejs'

const MAX_LABEL = 60

async function handle(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Sign in before adding a passkey.' },
      { status: 401 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { response, label } = (body ?? {}) as {
    response?: unknown
    label?: unknown
  }
  if (!response || typeof response !== 'object') {
    return NextResponse.json(
      { error: 'The browser sent no passkey to register.' },
      { status: 400 },
    )
  }

  const pending = await consumeChallenge('register')
  if (!pending || pending.uid !== user.id) {
    return NextResponse.json(
      {
        error:
          'That passkey request has expired or was already used. Try adding it again.',
      },
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

  let verification
  try {
    verification = await verifyRegistrationResponse({
      response: response as RegistrationResponseJSON,
      expectedChallenge: pending.challenge,
      expectedOrigin: rp.origin,
      expectedRPID: rp.rpID,
      requireUserVerification: true,
    })
  } catch (err) {
    // The library throws — rather than returning verified:false — for every
    // structural problem: a wrong origin, a mangled attestation, an
    // unsupported algorithm. Its messages are written for developers but
    // they are specific and non-sensitive, so passing one through beats
    // "something went wrong" for the person who has to work out why their
    // security key was refused.
    const detail = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json(
      { error: `That passkey could not be verified (${detail}).` },
      { status: 400 },
    )
  }

  if (!verification.verified) {
    return NextResponse.json(
      { error: 'That passkey could not be verified.' },
      { status: 400 },
    )
  }

  const { credential, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo

  // excludeCredentials already asks the browser to refuse a duplicate, but
  // it is a request, not a guarantee — and a credential id colliding with
  // another account's would otherwise overwrite it, handing this user that
  // account. Cheap check, catastrophic omission.
  const clash = await getPasskey(credential.id)
  if (clash) {
    return NextResponse.json(
      {
        error:
          clash.uid === user.id
            ? 'That passkey is already registered on this account.'
            : 'That passkey is already registered to another account.',
      },
      { status: 409 },
    )
  }

  const trimmed = typeof label === 'string' ? label.trim().slice(0, MAX_LABEL) : ''

  await savePasskey({
    id: credential.id,
    uid: user.id,
    publicKey: credential.publicKey,
    counter: credential.counter,
    transports: credential.transports ?? [],
    name: trimmed || describeDevice(req.headers.get('user-agent')),
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
  })

  const all = await listPasskeys(user.id)
  return NextResponse.json(
    { passkeys: all.map(toPublicPasskey) },
    { status: 201 },
  )
}

export const POST = withJsonErrors('auth/passkey/register/verify', handle)
