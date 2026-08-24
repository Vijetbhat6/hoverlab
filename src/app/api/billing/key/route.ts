import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { requirePro } from '@/lib/billing/require-pro'
import {
  getApiKeyRecord,
  issueApiKey,
  revokeApiKey,
} from '@/lib/billing/api-key'

/**
 * The caller's licence key.
 *
 *   GET    → { key: ApiKeyRecord | null }   metadata only, never the secret
 *   POST   → { key, secret }                mints one, shown exactly once
 *   DELETE → { key: null }                  revokes it
 *
 * Pro-gated, because the key only exists to prove a Pro licence outside the
 * browser. A free account asking for one would get a credential that
 * unlocks precisely what it already has.
 *
 * POST is issuance AND rotation — see `issueApiKey` for why those are one
 * operation. The secret comes back in that response and nowhere else; a
 * subsequent GET returns the prefix and the dates, because only the hash
 * was kept.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'private, no-store' }

export const GET = withJsonErrors('billing/key', async () => {
  const gate = await requirePro('Licence keys')
  if ('response' in gate) return gate.response

  return NextResponse.json(
    { key: await getApiKeyRecord(gate.userId) },
    { headers: NO_STORE },
  )
})

export const POST = withJsonErrors('billing/key', async () => {
  const gate = await requirePro('Licence keys')
  if ('response' in gate) return gate.response

  const secret = await issueApiKey(gate.userId)

  return NextResponse.json(
    {
      key: await getApiKeyRecord(gate.userId),
      secret,
      // Said in the payload as well as in the UI. A client that stores this
      // response somewhere and reads it back later should find the warning
      // attached to the thing it is warning about.
      note: 'This is the only time this key is shown. Store it now — a lost key is rotated, not recovered.',
    },
    { headers: NO_STORE },
  )
})

export const DELETE = withJsonErrors('billing/key', async () => {
  const gate = await requirePro('Licence keys')
  if ('response' in gate) return gate.response

  await revokeApiKey(gate.userId)
  return NextResponse.json({ key: null }, { headers: NO_STORE })
})
