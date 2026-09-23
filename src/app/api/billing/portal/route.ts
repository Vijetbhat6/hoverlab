/**
 * POST /api/billing/portal → { url }
 *
 * Opens the Polar customer portal for the signed-in caller: receipts, the
 * card on file, cancelling a subscription. Polar is the merchant of record,
 * so those things live on Polar's side and this route only mints the
 * short-lived link that signs the customer into them.
 *
 * ── THE PART THAT MAY NOT WORK YET ──────────────────────────────────────
 *
 * The Polar token this deployment runs on was found to lack read scopes
 * (403 `insufficient_scope`), and creating a customer session needs its own
 * scope, `customer_sessions:write`, which it may also lack. That cannot be
 * verified from here, so this route is written to be truthful in both
 * worlds: every 401, 403, 404, 422, 429 and 5xx is mapped by
 * `lib/account/portal.ts` to a stable `code` and a sentence that is true
 * whether or not the token is ever fixed, and the screen replaces the button
 * with that sentence and a way to reach a human. A dead button is the one
 * outcome this is built to make impossible.
 *
 * Who the customer is. Every checkout this app creates sets
 * `externalCustomerId` to the uid, and the webhook stores Polar's own
 * customer id on the profile once it has seen an event. The stored id goes
 * first, because it is the only handle for an order somebody made by hand in
 * the dashboard; the uid is the fallback and the only handle for a customer
 * never linked. A "no such customer" on the first falls through to the
 * second; anything else stops, because retrying a 403 with a different id
 * is just a second 403.
 *
 * Refused up front, without calling Polar at all, when billing is not
 * configured or the account has never bought anything. Both are things the
 * client already knows from `/api/account/orders` and does not offer a
 * button for; this is the same rule enforced where it cannot be bypassed.
 */

import { getPolar, billingEnabled } from '@/lib/billing/polar'
import { getSession } from '@/lib/session'
import { isAdminConfigured } from '@/lib/firebase/admin'
import { absoluteUrl } from '@/lib/site'
import { consumeAccountAction, firestoreAccountStore } from '@/lib/account/firestore-store'
import { secondsUntilReset } from '@/lib/account/limits'
import {
  PORTAL_FAILURES,
  classifyPortalError,
  customerRefs,
  isCustomerMissing,
  type PortalFailure,
} from '@/lib/account/portal'
import {
  crossSiteRefused,
  isCrossSite,
  json,
  notConfigured,
  supportEmail,
  unauthenticated,
} from '@/lib/account/route-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function failure(f: PortalFailure, headers: HeadersInit = {}) {
  return json({ error: f.error, code: f.code, supportEmail: supportEmail() }, f.status, headers)
}

export async function POST(request: Request) {
  if (!billingEnabled()) return failure(PORTAL_FAILURES.not_configured)

  const session = await getSession()
  if (!session) return unauthenticated()
  if (isCrossSite(request)) return crossSiteRefused()
  if (!isAdminConfigured()) return notConfigured()

  try {
    const store = firestoreAccountStore()

    const purchases = await store.list('purchases', { userId: session.uid })
    if (purchases.length === 0) return failure(PORTAL_FAILURES.no_purchase)

    const limit = await consumeAccountAction(session.uid, 'portal')
    if (!limit.ok) {
      return failure(PORTAL_FAILURES.rate_limited, {
        'Retry-After': String(secondsUntilReset()),
      })
    }

    const profile = (await store.getDoc(`users/${session.uid}`))?.data ?? null
    const linked =
      typeof profile?.polarCustomerId === 'string' && profile.polarCustomerId
        ? profile.polarCustomerId
        : null

    const refs = customerRefs(session.uid, linked)
    let last: unknown = null
    for (const ref of refs) {
      try {
        const created = await getPolar().customerSessions.create({
          ...ref,
          returnUrl: absoluteUrl('/account/billing'),
        })
        return json({ url: created.customerPortalUrl })
      } catch (err) {
        last = err
        if (isCustomerMissing(err)) continue
        break
      }
    }

    console.error('[billing/portal] Polar refused the customer session:', last)
    return failure(classifyPortalError(last))
  } catch (err) {
    console.error('[billing/portal] unexpected failure:', err)
    return failure(PORTAL_FAILURES.upstream)
  }
}
