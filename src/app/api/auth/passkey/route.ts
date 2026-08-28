/**
 * GET /api/auth/passkey
 *
 * The signed-in user's registered passkeys, for the management card on
 * /account. Public keys and counters stay on the server — nothing here is
 * usable for anything except showing a list.
 */

import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { getCurrentUser } from '@/lib/session'
import { listPasskeys, toPublicPasskey } from '@/lib/firebase/passkeys'

export const runtime = 'nodejs'

async function handle() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }

  const all = await listPasskeys(user.id)
  return NextResponse.json({ passkeys: all.map(toPublicPasskey) })
}

export const GET = withJsonErrors('auth/passkey', handle)
