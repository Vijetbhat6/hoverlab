import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { joinWorkspaceByCode } from '@/lib/billing/workspace'
import { withJsonErrors } from '@/lib/route-errors'

/**
 * Claim a seat on a Studio license or Team subscription.
 *
 * POST { code: string } → { workspace } | { error }
 *
 * This is the only way a seat is granted to someone who did not pay. The
 * seat limit is enforced inside a transaction in `joinWorkspaceByCode`, so
 * two people redeeming the last seat together cannot both get in.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Refusals worded for the person reading them, not the system. */
const MESSAGES: Record<string, string> = {
  invalid: 'That code does not match any workspace. Check it and try again.',
  expired: 'That workspace is no longer active, so its seats are closed.',
  full: 'Every seat on that workspace is taken. Ask the owner to free one up.',
  already: 'You already have a seat on that workspace.',
}

export const POST = withJsonErrors('api/team/join', async (request: Request) => {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Sign in first, then redeem the code.' },
      { status: 401 },
    )
  }

  let body: { code?: unknown }
  try {
    body = (await request.json()) as { code?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const code = typeof body.code === 'string' ? body.code : ''
  if (!code.trim()) {
    return NextResponse.json({ error: 'Enter a workspace code.' }, { status: 400 })
  }

  const result = await joinWorkspaceByCode(session.uid, code)
  if (!result.ok) {
    // 409 for "already a member" — the request is well-formed and the state
    // is fine, it just conflicts with what is already true.
    const status = result.reason === 'already' ? 409 : 400
    return NextResponse.json({ error: MESSAGES[result.reason] }, { status })
  }

  return NextResponse.json({ workspace: result.workspace })
})
