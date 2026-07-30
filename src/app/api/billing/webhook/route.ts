import { NextResponse } from 'next/server'
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks'
import { db } from '@/lib/db'

/**
 * Polar webhook receiver — the ONLY place entitlements are granted.
 *
 * Nothing in the client can grant access: the checkout route just opens a
 * hosted Polar page, and the success redirect is cosmetic. Access is
 * written here, after Polar has signed the event and confirmed payment.
 *
 * Handled events:
 *   order.paid                 → grant Pro license / provision Team seats
 *   order.refunded             → revoke what that order granted
 *   subscription.active        → Team subscription live (or renewed)
 *   subscription.updated       → seat count / period end changed
 *   subscription.canceled      → keep access until the paid period ends
 *   subscription.revoked       → access ends now
 *
 * Idempotency: Polar retries on any non-2xx, so the same event can arrive
 * several times. Every event id is recorded in WebhookEvent before being
 * applied; a duplicate short-circuits. Unhandled event types are still
 * acknowledged with 200 — returning an error would make Polar retry an
 * event we will never act on.
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

/**
 * Resolve the local user for an event.
 *
 * `externalCustomerId` (set at checkout) is the reliable path. Metadata
 * `userId` covers checkouts created before that field existed, and email
 * is a last resort for orders created manually in the Polar dashboard.
 */
async function resolveUserId(data: PolarLike): Promise<string | null> {
  const external = data.customer?.externalId
  if (typeof external === 'string' && external) {
    const byExternal = await db.user.findUnique({
      where: { id: external },
      select: { id: true },
    })
    if (byExternal) return byExternal.id
  }

  const metaUserId = data.metadata?.userId
  if (typeof metaUserId === 'string' && metaUserId) {
    const byMeta = await db.user.findUnique({
      where: { id: metaUserId },
      select: { id: true },
    })
    if (byMeta) return byMeta.id
  }

  const email = data.customer?.email
  if (typeof email === 'string' && email) {
    const byEmail = await db.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (byEmail) return byEmail.id
  }

  return null
}

/** Persist the Polar customer id so later events resolve without a lookup chain. */
async function linkCustomer(userId: string, data: PolarLike): Promise<void> {
  const polarCustomerId = data.customer?.id ?? data.customerId
  if (!polarCustomerId) return
  try {
    await db.user.update({
      where: { id: userId },
      data: { polarCustomerId },
    })
  } catch {
    // Unique constraint: this Polar customer is already linked to another
    // local user. Not fatal — entitlement resolution doesn't depend on it.
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

  // The unique polarOrderId makes this a no-op on redelivery.
  await db.purchase.upsert({
    where: { polarOrderId: orderId },
    create: {
      userId,
      plan,
      interval,
      amountCents: typeof data.amount === 'number' ? data.amount : 0,
      currency: data.currency ?? 'usd',
      polarOrderId: orderId,
      polarCheckoutId: data.checkoutId ?? null,
    },
    update: {},
  })

  if (plan === 'pro') {
    // One-time license: no expiry, nothing to renew.
    await db.user.update({
      where: { id: userId },
      data: { proLicense: true, proLicenseAt: new Date() },
    })
  }
}

/** order.refunded — take back exactly what the order granted. */
async function handleOrderRefunded(data: PolarLike): Promise<void> {
  const orderId = data.id
  if (!orderId) return

  const purchase = await db.purchase.findUnique({
    where: { polarOrderId: orderId },
    select: { userId: true, plan: true },
  })
  if (!purchase) return

  if (purchase.plan === 'pro') {
    await db.user.update({
      where: { id: purchase.userId },
      data: { proLicense: false, proLicenseAt: null },
    })
  }
}

/**
 * Team subscription lifecycle. Seats and period end are mirrored so
 * `getEntitlements()` can honor a paid-through date after cancellation.
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
  const currentPeriodEnd = data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null

  const existing = await db.team.findUnique({
    where: { polarSubscriptionId: subscriptionId },
    select: { id: true },
  })

  if (existing) {
    await db.team.update({
      where: { id: existing.id },
      data: { subscriptionStatus: status, seats, currentPeriodEnd },
    })
    return
  }

  // First activation — create the workspace and seat the buyer as owner.
  const teamName =
    typeof data.metadata?.teamName === 'string' && data.metadata.teamName
      ? data.metadata.teamName
      : 'My team'

  const team = await db.team.create({
    data: {
      name: teamName,
      ownerId: userId,
      polarSubscriptionId: subscriptionId,
      subscriptionStatus: status,
      seats,
      currentPeriodEnd,
    },
  })

  await db.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId } },
    create: { teamId: team.id, userId, role: 'owner' },
    update: { role: 'owner' },
  })
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

  if (eventId) {
    const seen = await db.webhookEvent.findUnique({
      where: { polarEventId: eventId },
      select: { id: true },
    })
    if (seen) {
      // Already applied — acknowledge so Polar stops retrying.
      return NextResponse.json({ ok: true, duplicate: true })
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

    if (eventId) {
      await db.webhookEvent.create({
        data: { polarEventId: eventId, type: event.type, payload: raw },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    // 500 so Polar retries — a transient DB failure shouldn't silently
    // drop a paid order.
    console.error('[billing/webhook] handler failed:', event.type, err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }
}
