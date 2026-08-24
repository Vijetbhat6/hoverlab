import 'server-only'

/**
 * The gate for workspace-shared routes.
 *
 * Sibling of `./require-pro`, and the difference between them is the whole
 * distinction between the two paid shapes:
 *
 *   requirePro    a licence. Studio and Team seats include it.
 *   requireTeam   a live per-seat subscription. Studio does NOT include it.
 *
 * That second line is the one worth being careful about. Studio is ten Pro
 * licences bought together; Team is a shared workspace. Both hang seats off
 * the same `teams/{id}` document, so it would be easy to let a Studio seat
 * through here — and doing so would delete the only thing Team sells that
 * Studio does not, which is precisely the confusion `plans.ts` warns about.
 * `canUseTeamFeatures` is `hasTeam` alone, and this reads it rather than
 * re-deriving.
 *
 * Returns the team id as well as the user id, because every route behind
 * this gate writes to a workspace and none of them should have to look it
 * up a second time.
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { getEntitlements } from '@/lib/billing/entitlements'

export type TeamGate = { userId: string; teamId: string } | { response: NextResponse }

export async function requireTeam(feature: string): Promise<TeamGate> {
  const user = await getCurrentUser()
  if (!user) {
    return {
      response: NextResponse.json({ error: 'Unauthorized.' }, { status: 401 }),
    }
  }

  const ent = await getEntitlements(user.id)

  if (!ent.canUseTeamFeatures || !ent.teamId) {
    /*
     * 402 and an upgrade target, matching requirePro: this is a purchase
     * away rather than a permission the caller will never have.
     *
     * The message names Team specifically. A Studio holder landing here
     * already has a workspace and seats, so "upgrade" would read as
     * nonsense unless it says which plan and why.
     */
    return {
      response: NextResponse.json(
        {
          error: `${feature} is part of the Team plan.`,
          upgrade: '/#pricing',
          hint: ent.hasStudio
            ? 'Studio covers the licence for ten people; the shared workspace is what Team adds.'
            : undefined,
        },
        { status: 402 },
      ),
    }
  }

  return { userId: user.id, teamId: ent.teamId }
}
