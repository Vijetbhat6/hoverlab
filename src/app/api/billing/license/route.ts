/**
 * GET /api/billing/license → HeldLicense
 *
 * The signed-in caller's licence, as it should appear on a certificate.
 *
 * Derived on every read rather than denormalized onto the profile, for the
 * same reason entitlements are: a refund lands as a webhook that flips
 * `proLicense`, and a certificate rendered from a cached copy would keep
 * attesting to a licence that no longer exists.
 *
 * Signed-out callers get the free licence rather than a 401. Everyone holds
 * that one, and the /license page renders the same component for a visitor
 * as for a customer — a 401 here would make the public page's "your licence"
 * block an error state for the majority of the people reading it.
 */

import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { getCurrentUser } from '@/lib/session'
import { getEntitlements } from '@/lib/billing/entitlements'
import { adminDb } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'
import { PLANS, type PlanId } from '@/lib/billing/plans'
import { licenseIdFor, updatesUntilFor, type HeldLicense } from '@/lib/license'

export const runtime = 'nodejs'
/** Reads the session cookie and Firestore — never cache it. */
export const dynamic = 'force-dynamic'

const ANONYMOUS: Omit<HeldLicense, 'holder' | 'holderEmail'> = {
  kind: 'free',
  plan: 'free',
  planName: 'Free',
  licenseId: null,
  issuedAt: null,
  updatesUntil: null,
  seats: null,
  recurring: false,
}

/**
 * The order that granted this licence.
 *
 * Ordered by `createdAt` descending and limited to one: an account can hold
 * several purchases — a Pro licence, then credit packs, then a Studio seat
 * bought for the team — and the certificate should name the one that
 * actually carries the licence, not the most recent receipt.
 *
 * Falls back to null rather than failing the request. A licence with no id
 * still renders; a certificate that 500s because a purchase document is
 * missing does not.
 */
async function grantingOrder(
  userId: string,
  plan: PlanId,
): Promise<{ orderId: string; createdAt: string } | null> {
  try {
    const snap = await adminDb()
      .collection('purchases')
      .where('userId', '==', userId)
      .where('plan', '==', plan)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get()

    const doc = snap.docs[0]
    if (!doc) return null

    const data = doc.data()
    const createdAt =
      typeof data.createdAt?.toDate === 'function'
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString()

    return { orderId: doc.id, createdAt }
  } catch (err) {
    // A missing composite index is the likely cause, and it should not cost
    // the customer their certificate — it costs them the id printed on it.
    console.error('[billing/license] could not read granting order:', err)
    return null
  }
}

/**
 * A renewed update window, if this account has one.
 *
 * Written by the webhook when a renewal is paid. Preferred over the date
 * derived from the original purchase, because after a renewal the derived
 * date is simply stale — it still describes the twelve months that ran
 * from the first order.
 *
 * Returns null on a read failure rather than throwing. The fallback is the
 * derived date, which is correct for every account that has never renewed
 * and merely conservative for one that has.
 */
async function renewedUntil(userId: string): Promise<string | null> {
  try {
    const snap = await adminDb().collection('users').doc(userId).get()
    const value = snap.data()?.updatesUntil
    return value instanceof Timestamp ? value.toDate().toISOString() : null
  } catch (err) {
    console.error('[billing/license] could not read updatesUntil:', err)
    return null
  }
}

async function handleGet() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({
      ...ANONYMOUS,
      holder: 'Unregistered',
      holderEmail: '',
    } satisfies HeldLicense)
  }

  const ent = await getEntitlements(user.id)

  const base: HeldLicense = {
    ...ANONYMOUS,
    holder: user.name ?? user.email,
    holderEmail: user.email,
  }

  if (!ent.canUseProFeatures) return NextResponse.json(base)

  // Which plan the licence is attributed to, highest first. A Team seat and
  // a Studio seat both carry the commercial licence; the certificate names
  // whichever the account actually holds.
  const plan: PlanId = ent.hasTeam ? 'team' : ent.hasStudio ? 'studio' : 'pro'
  const [order, renewed] = await Promise.all([
    grantingOrder(user.id, plan),
    renewedUntil(user.id),
  ])

  return NextResponse.json({
    ...base,
    kind: 'commercial',
    plan,
    planName: PLANS[plan].name,
    licenseId: order ? licenseIdFor(plan, order.orderId) : null,
    issuedAt: order?.createdAt ?? null,
    /*
     * Null when the granting order could not be read — the composite index
     * on `purchases` may be missing, and `grantingOrder` returns null
     * rather than failing the certificate. A window with no start is not a
     * window, and inventing one from "now" would print a date that moves
     * every time the page is loaded.
     */
    // A renewal wins over the derived date; see `renewedUntil`. Falls back
    // to the original purchase plus the window, and to null when even that
    // is unavailable — a window with no start is not a window, and
    // inventing one from "now" would print a date that moved on every load.
    updatesUntil:
      renewed ??
      (order ? updatesUntilFor(order.createdAt, PLANS[plan].updateWindowMonths) : null),
    seats: PLANS[plan].includedSeats,
    // Team is the only recurring licence. Studio and Pro are bought outright,
    // so there is nothing for the certificate to caveat.
    recurring: PLANS[plan].interval === 'month',
  } satisfies HeldLicense)
}

export const GET = withJsonErrors('billing/license', handleGet)
