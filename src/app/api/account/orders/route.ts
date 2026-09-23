/**
 * GET /api/account/orders → { orders, subscriptions, portal, supportEmail }
 *
 * What /account/billing renders: the caller's purchases, any recurring
 * subscription still charging them, and whether a "manage billing" button
 * should be drawn at all.
 *
 * Read straight from the `purchases` collection the webhook already writes
 * (one document per Polar order, keyed by order id). Nothing is fetched from
 * Polar here — the token this deployment runs on cannot read from it — so
 * this list is exactly as complete as the webhook has been: an order whose
 * webhook never arrived is not on it, and the page says where to look
 * instead of pretending the list is authoritative.
 *
 * `portal.available` is false when billing is not configured or the account
 * has bought nothing; the client draws no button in either case. When it is
 * true the button can still fail at Polar, and that is handled at click time
 * by `/api/billing/portal`.
 */

import { getSession } from '@/lib/session'
import { isAdminConfigured } from '@/lib/firebase/admin'
import { billingEnabled } from '@/lib/billing/polar'
import { firestoreAccountStore } from '@/lib/account/firestore-store'
import { activeSubscriptions, loadTeams, sortOrders, toOrderRow } from '@/lib/account/billing'
import { portalOffered } from '@/lib/account/portal'
import { json, notConfigured, supportEmail, unauthenticated } from '@/lib/account/route-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthenticated()
  if (!isAdminConfigured()) return notConfigured()

  try {
    const store = firestoreAccountStore()
    const [purchases, profileDoc] = await Promise.all([
      store.list('purchases', { userId: session.uid }),
      store.getDoc(`users/${session.uid}`),
    ])
    const profile = profileDoc?.data ?? null
    const teams = await loadTeams(store, session.uid, profile)

    const orders = sortOrders(purchases.map(toOrderRow))
    return json({
      orders,
      subscriptions: activeSubscriptions({ uid: session.uid, profile, teams }),
      portal: portalOffered({ billingConfigured: billingEnabled(), orderCount: orders.length }),
      supportEmail: supportEmail(),
    })
  } catch (err) {
    console.error('[account/orders] failed:', err)
    return json(
      {
        error: "We couldn't load your orders just now. Try again in a minute.",
        code: 'orders_failed',
        supportEmail: supportEmail(),
      },
      500,
    )
  }
}
