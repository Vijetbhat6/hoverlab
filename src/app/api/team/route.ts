import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getWorkspaceForUser, rotateInviteCode } from '@/lib/billing/workspace'
import { withJsonErrors } from '@/lib/route-errors'

/**
 * The current user's workspace — the seats behind Studio and Team.
 *
 * GET  → { workspace: Workspace | null }
 * POST → { workspace } with a freshly rotated invite code (owner only)
 *
 * The invite code is only ever included for the owner: anyone holding it can
 * take a seat, so it is a credential, not a display field.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withJsonErrors('api/team', async () => {
  const session = await getSession()
  if (!session) return NextResponse.json({ workspace: null })

  return NextResponse.json(
    { workspace: await getWorkspaceForUser(session.uid) },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
})

export const POST = withJsonErrors('api/team', async () => {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
  }

  const workspace = await getWorkspaceForUser(session.uid)
  if (!workspace) {
    return NextResponse.json({ error: 'No workspace on this account.' }, { status: 404 })
  }
  if (!workspace.isOwner) {
    // Rotating would lock out everyone the owner has already sent the code
    // to, so it is not a member's decision to make.
    return NextResponse.json(
      { error: 'Only the workspace owner can change the invite code.' },
      { status: 403 },
    )
  }

  const inviteCode = await rotateInviteCode(workspace.id)
  return NextResponse.json({ workspace: { ...workspace, inviteCode } })
})
