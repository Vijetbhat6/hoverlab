import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getEntitlements, FREE_ENTITLEMENTS, bundleLimit } from '@/lib/billing/entitlements'

/**
 * What the current user is entitled to.
 *
 * Client components read this to decide whether to show a paywall or the
 * real feature. It is a display aid only — every gated action is checked
 * again server-side, so a user who edits the response in devtools gets a
 * nicer-looking button and nothing else.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({
      ...FREE_ENTITLEMENTS,
      bundleLimit: bundleLimit(FREE_ENTITLEMENTS),
    })
  }

  const ent = await getEntitlements(session.sub)
  return NextResponse.json({ ...ent, bundleLimit: bundleLimit(ent) })
}
