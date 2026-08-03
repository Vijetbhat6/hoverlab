/**
 * POST /api/auth/forgot-password
 * Body: { email }
 *
 * Asks Firebase to send its own reset email. Google owns the message, the
 * link and its expiry, so this app has no reset tokens, no mail provider and
 * no reset page.
 *
 * Always answers 200 with the same body, whether or not the address has an
 * account — "no account with that email" is exactly the signal someone
 * enumerating a user list wants.
 */

import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { FirebaseAuthError, sendPasswordResetEmail } from '@/lib/firebase/rest'

export const runtime = 'nodejs'

const GENERIC_OK = {
  message:
    'If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.',
}

async function handleForgotPassword(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { email } = (body ?? {}) as { email?: unknown }
  if (typeof email !== 'string' || !email.trim()) {
    return NextResponse.json(GENERIC_OK)
  }

  try {
    await sendPasswordResetEmail(email.trim())
  } catch (err) {
    if (err instanceof FirebaseAuthError) {
      // Rate limiting is worth surfacing — it is actionable, and it says
      // nothing about whether the address is registered.
      if (err.status === 429) {
        return NextResponse.json({ error: err.message }, { status: 429 })
      }
      // Everything else, including EMAIL_NOT_FOUND, answers as success.
      return NextResponse.json(GENERIC_OK)
    }
    throw err
  }

  return NextResponse.json(GENERIC_OK)
}

export const POST = withJsonErrors('auth/forgot-password', handleForgotPassword)
