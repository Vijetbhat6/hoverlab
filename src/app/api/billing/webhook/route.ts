import { NextResponse } from 'next/server'
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { generateInviteCode } from '@/lib/billing/workspace'

/**
 * Polar webhook receiver — the ONLY place entitlements are granted.
 *
 * Nothing in the client can grant access: the checkout route just opens a
 * hosted Polar page, and the success redirect is cosmetic. Access is
 * written here, after Polar has signed the event and confirmed payment.
 *
 * Handled events:
 *   order.paid                 → grant Pro license / provision Studio seats
 *   order.refunded             → revoke what that order granted
 *   subscription.active        → Team subscription live (or renewed)
 *   subscription.updated       → seat count / period end changed
 *   subscription.canceled      → keep access until the paid period ends
 *   subscription.revoked       → access ends now
 *
 * Idempotency: Polar retries on any non-2xx, so the same event can arrive
 * several times, and applying one twice means granting a paid license for
 * free or double-recording an order.
 *
 * Firestore has no unique constraints, so uniqueness comes from document
 * ids — the mechanism that replaced the `@unique` columns this used to rely
 * on. Every identifier that must not repeat *is* a key:
 *
 *   webhookEvents/{eventId}        an event is applied at most once
 *   purchases/{polarOrderId}       an order is recorded at most once
 *   teams/{polarSubscriptionId}    a subscription owns exactly one team
 *   polarCustomers/{customerId}    a Polar customer maps to one account
 *
 * Writes use `create()` rather than `set()` wherever a repeat must not
 * overwrite: create fails with ALREADY_EXISTS, which is precisely the
 * "already handled" signal, instead of silently clobbering the first write.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Shape we rely on across order/subscription payloads. */
interface PolarLike {
  id?: string
  metadata?: Record<string, unknown>
  customer?: { id?: string; externalId?: string | null; email?: string | null }
  customerId?: string
  amount?: number
  currency?: string
  checkoutId?: string | null
  status?: string
  currentPeriodEnd?: string | Date | null
  quantity?: number
}

/** Firestore surfaces "document already exists" as code 6 (ALREADY_EXISTS). */
function isAlreadyExists(err: unknown): boolean {
  return Boolean(
    err && typeof err === 'object' && (err as { code?: unknown }).code === 6,
  )
}

async function userExists(uid: string): Promise<boolean> {
  const snap = await adminDb().collection('users').doc(uid).get()
  return snap.exists
}

/**
 * Resolve the local user for an event.
 *
 * `externalCustomerId` (set at checkout) is the reliable path. The
 * polarCustomers mapping catches later events from a customer we have
 * already linked. Metadata `userId` covers checkouts created before that
 * field existed, and email is a last resort for orders created manually in
 * the Polar dashboard.
 */
async function resolveUserId(data: PolarLike): Promise<string | null> {
  const external = data.customer?.externalId
  if (typeof external === 'string' && external && (await userExists(external))) {
    return external
  }

  const customerId = data.customer?.id ?? data.customerId
  if (typeof customerId === 'string' && customerId) {
    const mapping = await adminDb().collection('polarCustomers').doc(customerId).get()
    const mapped = mapping.exists ? mapping.data()?.userId : null
    if (typeof mapped === 'string' && mapped && (await userExists(mapped))) {
      return mapped
    }
  }

  const metaUserId = data.metadata?.userId
  if (typeof metaUserId === 'string' && metaUserId && (await userExists(metaUserId))) {
    return metaUserId
  }

  const email = data.customer?.email
  if (typeof email === 'string' && email) {
    const found = await adminDb()
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get()
    if (!found.empty) return found.docs[0]!.id
  }

  return null
}

/** Persist the Polar customer id so later events resolve without a lookup chain. */
async function linkCustomer(userId: string, data: PolarLike): Promise<void> {
  const polarCustomerId = data.customer?.id ?? data.customerId
  if (!polarCustomerId) return

  const db = adminDb()
  await db.collection('users').doc(userId).update({ polarCustomerId })

  try {
    await db.collection('polarCustomers').doc(polarCustomerId).create({ userId })
  } catch (err) {
    if (!isAlreadyExists(err)) throw err
    // This Polar customer is already mapped — to this user (a repeat event)
    // or to another account. Not fatal either way: entitlement resolution
    // does not depend on the mapping, it only shortcuts the lookup.
  }
}

/** order.paid — record the purchase and grant the matching entitlement. */
async function handleOrderPaid(data: PolarLike): Promise<void> {
  const userId = await resolveUserId(data)
  if (!userId) {
    console.error('[billing/webhook] order.paid for unknown user', {
      orderId: data.id,
    })
    return
  }

  const plan = typeof data.metadata?.plan === 'string' ? data.metadata.plan : 'pro'
  const interval =
    typeof data.metadata?.interval === 'string' ? data.metadata.interval : 'one_time'
  const orderId = data.id
  if (!orderId) return

  await linkCustomer(userId, data)

  // The order id as document id makes a redelivery a no-op.
  try {
    await adminDb().collection('purchases').doc(orderId).create({
      userId,
      plan,
      interval,
      amountCents: typeof data.amount === 'number' ? data.amount : 0,
      currency: data.currency ?? 'usd',
      polarOrderId: orderId,
      polarCheckoutId: data.checkoutId ?? null,
      createdAt: Timestamp.now(),
    })
  } catch (err) {
    if (!isAlreadyExists(err)) throw err
  }

  if (plan === 'pro') {
    // One-time license: no expiry, nothing to renew.
    await adminDb().collection('users').doc(userId).update({
      proLicense: true,
      proLicenseAt: Timestamp.now(),
    })
  }

  if (plan === 'studio') {
    await provisionStudioWorkspace(userId, orderId, data)
  }
}

/**
 * Studio — a one-time license covering ten people.
 *
 * Provisioned as a workspace rather than as ten Pro licenses, because the
 * buyer does not know the other nine email addresses at checkout: they buy,
 * then invite. That is the same shape as a Team subscription, so it reuses
 * the same `teams/{id}` documents and the same members subcollection, and
 * differs in exactly two fields — `kind`, which is what stops a Studio seat
 * unlocking shared brand tokens, and a `lifetime` status, which has no
 * renewal to fail.
 *
 * Keyed by the ORDER id (a subscription-backed team is keyed by the
 * subscription id), so a redelivered order.paid re-enters this function and
 * finds the workspace already there instead of creating a second one.
 */
async function provisionStudioWorkspace(
  userId: string,
  orderId: string,
  data: PolarLike,
): Promise<void> {
  const db = adminDb()
  const teamRef = db.collection('teams').doc(orderId)
  if ((await teamRef.get()).exists) return

  const metaSeats = Number(data.metadata?.seats)
  const seats = Number.isFinite(metaSeats) && metaSeats > 0 ? metaSeats : 10

  const teamName =
    typeof data.metadata?.teamName === 'string' && data.metadata.teamName
      ? data.metadata.teamName
      : 'My studio'

  const batch = db.batch()
  batch.set(teamRef, {
    name: teamName,
    kind: 'studio',
    ownerId: userId,
    polarOrderId: orderId,
    // Not a subscription status, but the field every seat check already
    // reads. `teamIsLive()` knows this one never expires.
    subscriptionStatus: 'lifetime',
    seats,
    // The buyer takes the first seat; the other nine are claimed with the
    // code. Without this the license would be ten seats nobody but the
    // purchaser could ever use.
    seatsUsed: 1,
    inviteCode: generateInviteCode(),
    currentPeriodEnd: null,
    createdAt: Timestamp.now(),
  })
  batch.set(teamRef.collection('members').doc(userId), {
    userId,
    role: 'owner',
    joinedAt: Timestamp.now(),
  })
  batch.update(db.collection('users').doc(userId), {
    teamIds: FieldValue.arrayUnion(teamRef.id),
  })
  await batch.commit()
}

/** order.refunded — take back exactly what the order granted. */
async function handleOrderRefunded(data: PolarLike): Promise<void> {
  const orderId = data.id
  if (!orderId) return

  const snap = await adminDb().collection('purchases').doc(orderId).get()
  if (!snap.exists) return

  const purchase = snap.data() ?? {}
  const userId = typeof purchase.userId === 'string' ? purchase.userId : null
  if (!userId) return

  if (purchase.plan === 'pro') {
    await adminDb().collection('users').doc(userId).update({
      proLicense: false,
      proLicenseAt: null,
    })
  }

  if (purchase.plan === 'studio') {
    // The workspace is keyed by this order id. Mark it revoked rather than
    // deleting it: `teamIsLive()` stops recognising the status, every seat
    // loses access at once, and the membership records survive in case the
    // refund was a mistake.
    await adminDb()
      .collection('teams')
      .doc(orderId)
      .update({ subscriptionStatus: 'revoked' })
      .catch(() => {})
  }
}

/**
 * Team subscription lifecycle. Seats and period end are mirrored so
 * `getEntitlements()` can honor a paid-through date after cancellation.
 *
 * The team document is keyed by the Polar subscription id, so "find the
 * team for this subscription" is a direct read and one subscription can
 * never end up owning two teams.
 */
async function handleSubscription(data: PolarLike, status: string): Promise<void> {
  const subscriptionId = data.id
  if (!subscriptionId) return

  const userId = await resolveUserId(data)
  if (!userId) {
    console.error('[billing/webhook] subscription event for unknown user', {
      subscriptionId,
    })
    return
  }

  await linkCustomer(userId, data)

  const seats = typeof data.quantity === 'number' && data.quantity > 0 ? data.quantity : 1
  const currentPeriodEnd = data.currentPeriodEnd
    ? Timestamp.fromDate(new Date(data.currentPeriodEnd))
    : null

  const db = adminDb()
  const teamRef = db.collection('teams').doc(subscriptionId)
  const existing = await teamRef.get()

  if (existing.exists) {
    await teamRef.update({ subscriptionStatus: status, seats, currentPeriodEnd })
    return
  }

  // First activation — create the workspace and seat the buyer as owner.
  const teamName =
    typeof data.metadata?.teamName === 'string' && data.metadata.teamName
      ? data.metadata.teamName
      : 'My team'

  const batch = db.batch()
  batch.set(teamRef, {
    name: teamName,
    kind: 'team',
    ownerId: userId,
    polarSubscriptionId: subscriptionId,
    subscriptionStatus: status,
    seats,
    seatsUsed: 1,
    inviteCode: generateInviteCode(),
    currentPeriodEnd,
    createdAt: Timestamp.now(),
  })
  batch.set(teamRef.collection('members').doc(userId), {
    userId,
    role: 'owner',
    joinedAt: Timestamp.now(),
  })
  // Mirrored onto the profile so getEntitlements() resolves membership in a
  // single read instead of a collection-group query.
  batch.update(db.collection('users').doc(userId), {
    teamIds: FieldValue.arrayUnion(teamRef.id),
  })
  await batch.commit()
}

export async function POST(request: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET
  if (!secret) {
    console.error('[billing/webhook] POLAR_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })
  }

  // Signature verification needs the exact bytes Polar signed, so the raw
  // body is read before any JSON parsing.
  const raw = await request.text()
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })

  let event: { type: string; data: PolarLike }
  try {
    event = validateEvent(raw, headers, secret) as unknown as {
      type: string
      data: PolarLike
    }
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      // Unsigned or tampered — refuse without acknowledging.
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }
    console.error('[billing/webhook] validation failed:', err)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Idempotency guard. The event id is the payload id where Polar provides
  // one; falling back to the webhook-id header keeps replays deduped even
  // for payload shapes without a stable id.
  const eventId =
    (typeof event.data?.id === 'string' ? `${event.type}:${event.data.id}` : null) ??
    headers['webhook-id'] ??
    null

  // Claim the event id *before* applying it, with create() so two concurrent
  // deliveries cannot both win the check. The alternative — check, apply,
  // then record — leaves a window where a retry arriving mid-handler applies
  // the same paid order twice.
  const claimRef = eventId
    ? adminDb().collection('webhookEvents').doc(encodeURIComponent(eventId))
    : null

  if (claimRef) {
    try {
      await claimRef.create({
        polarEventId: eventId,
        type: event.type,
        payload: raw,
        receivedAt: Timestamp.now(),
      })
    } catch (err) {
      if (isAlreadyExists(err)) {
        // Already applied — acknowledge so Polar stops retrying.
        return NextResponse.json({ ok: true, duplicate: true })
      }
      throw err
    }
  }

  try {
    switch (event.type) {
      case 'order.paid':
        await handleOrderPaid(event.data)
        break
      case 'order.refunded':
        await handleOrderRefunded(event.data)
        break
      case 'subscription.active':
      case 'subscription.uncanceled':
        await handleSubscription(event.data, 'active')
        break
      case 'subscription.updated':
        await handleSubscription(event.data, event.data.status ?? 'active')
        break
      case 'subscription.past_due':
        await handleSubscription(event.data, 'past_due')
        break
      case 'subscription.canceled':
        await handleSubscription(event.data, 'canceled')
        break
      case 'subscription.revoked':
        await handleSubscription(event.data, 'revoked')
        break
      default:
        // Acknowledged but not acted on — retrying would never help.
        break
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    // Release the claim so Polar's retry is actually reprocessed rather than
    // being greeted as a duplicate of an attempt that never completed.
    if (claimRef) await claimRef.delete().catch(() => {})
    // 500 so Polar retries — a transient failure shouldn't silently drop a
    // paid order.
    console.error('[billing/webhook] handler failed:', event.type, err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }
}
