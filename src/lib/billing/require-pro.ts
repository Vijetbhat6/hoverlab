import 'server-only'

/**
 * The gate for Pro-only sync routes.
 *
 * Two routes need it — private collections and the saved brand library —
 * and they are the only two places in the product where a paywall is a wall
 * rather than a product boundary. Everything else Pro sells is a licence
 * (unenforceable by construction) or a client-side transform of public CSS.
 * These two store data on our server, so the check is the feature.
 *
 * Sharing it matters more than the six lines saved: the failure mode of
 * copy-pasting this is a route that checks the session and forgets the
 * entitlement, which is a paywall that isn't one.
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { getEntitlements } from '@/lib/billing/entitlements'

/**
 * Either the caller's id, or the response the handler should return.
 *
 * Returned rather than thrown so the handler's happy path stays flat and
 * the type system forces the `'response' in gate` check.
 */
export type ProGate = { userId: string } | { response: NextResponse }

export async function requirePro(feature: string): Promise<ProGate> {
  const user = await getCurrentUser()
  if (!user) {
    // Built per call, never hoisted: a Response body is a stream that reads
    // once, so a shared instance would serve an empty body to the second
    // request that hit it.
    return {
      response: NextResponse.json({ error: 'Unauthorized.' }, { status: 401 }),
    }
  }

  const ent = await getEntitlements(user.id)
  if (!ent.canUseProFeatures) {
    /*
     * 402, not 403.
     *
     * 403 reads as "you may never", which is wrong — this is a purchase
     * away. The client also has to tell the two apart: one renders an
     * upgrade prompt, the other an error. `upgrade` carries where to send
     * them so the copy lives in one place.
     */
    return {
      response: NextResponse.json(
        { error: `${feature} is part of Pro.`, upgrade: '/pricing' },
        { status: 402 },
      ),
    }
  }

  return { userId: user.id }
}
