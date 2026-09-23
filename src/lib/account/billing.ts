/**
 * The billing-shaped decisions the account tools make, as pure functions.
 *
 * Three questions live here, each of which has to be answered the same way
 * by more than one caller:
 *
 *   - Is something still charging this person? Deletion refuses while it is
 *     (`findBlockers`), and the billing page names it (`activeSubscriptions`).
 *   - What did they buy, in words? The receipts list and the export both
 *     read a `purchases` document (`toOrderRow`).
 *   - What must be kept, and what must be cut, when the account goes?
 *     (`purchaseTombstone`, `webhookEventPaths`, `planTeamAction`.)
 *
 * No Firestore and no `server-only`: the test drives these directly.
 */

import { PLANS } from '../billing/plans'
import type { AccountStore, Doc } from './store'

/* ------------------------------------------------------------------ *
 *  Subscriptions and workspaces
 * ------------------------------------------------------------------ */

/**
 * Polar subscription statuses under which money is still being taken, or
 * will be, unless someone cancels.
 *
 * `canceled` is deliberately absent. The webhook writes it when a
 * cancellation is scheduled, and from that moment nothing further is
 * charged: the customer is paid through the period they bought and the
 * subscription then ends. Refusing to delete an account over a subscription
 * that has already been cancelled would be a wall with nothing behind it.
 *
 * Errs toward blocking. `subscription.updated` writes Polar's own status
 * back over `canceled`, so a cancelled-but-not-yet-ended subscription can
 * read `active` here — and the cost of that is a person being sent to the
 * billing portal to confirm what they already did, which is a far smaller
 * mistake than deleting the account under a live card.
 */
export const RECURRING_LIVE_STATUSES: ReadonlySet<string> = new Set([
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'incomplete',
])

/** A workspace and who is in it, as the planner needs it. */
export interface TeamView {
  id: string
  data: Record<string, unknown>
  /** Uids with a member document. */
  memberIds: string[]
}

export type Blocker =
  | {
      code: 'team-subscription'
      teamId: string
      teamName: string
      message: string
    }
  | { code: 'plus-subscription'; message: string }
  | {
      code: 'workspace-has-members'
      teamId: string
      teamName: string
      members: number
      message: string
    }

function str(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null
}

function millis(value: unknown): number | null {
  if (value instanceof Date) return value.getTime()
  if (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().getTime()
  }
  return null
}

/**
 * Whether a workspace still entitles anyone. Mirrors `isLive()` in
 * `billing/workspace.ts` and `subscriptionIsLive()` in
 * `billing/entitlements.ts`; it is restated here because both are behind
 * `server-only`, and a copy that drifts errs the same safe way — toward
 * treating a workspace as live and asking the owner to hand it over.
 */
export function workspaceIsLive(data: Record<string, unknown>, now = Date.now()): boolean {
  const status = str(data.subscriptionStatus)
  if (status === 'active' || status === 'lifetime') return true
  if (status === 'term' || status === 'past_due' || status === 'canceled') {
    const end = millis(data.currentPeriodEnd)
    return end !== null && end > now
  }
  return false
}

const CANCEL_IN_PORTAL =
  'Cancel it from your billing page first, then come back to delete your account.'

/**
 * Everything that must be resolved before an account can be deleted.
 *
 * Empty means go ahead. Non-empty means nothing has been touched and the
 * caller should say so, because a refusal that had already deleted half the
 * data would be the worst of both outcomes.
 */
export function findBlockers(input: {
  uid: string
  profile: Record<string, unknown> | null
  teams: TeamView[]
}): Blocker[] {
  const { uid, profile, teams } = input
  const blockers: Blocker[] = []

  for (const team of teams) {
    if (str(team.data.ownerId) !== uid) continue
    const name = str(team.data.name) ?? 'your workspace'
    const status = str(team.data.subscriptionStatus)

    if (
      str(team.data.polarSubscriptionId) !== null &&
      status !== null &&
      RECURRING_LIVE_STATUSES.has(status)
    ) {
      blockers.push({
        code: 'team-subscription',
        teamId: team.id,
        teamName: name,
        message: `${name} is on a recurring Team subscription that is still active. ${CANCEL_IN_PORTAL}`,
      })
      continue
    }

    const others = team.memberIds.filter((member) => member !== uid).length
    if (others > 0 && workspaceIsLive(team.data)) {
      blockers.push({
        code: 'workspace-has-members',
        teamId: team.id,
        teamName: name,
        members: others,
        message:
          `${name} still has ${others} other ${others === 1 ? 'member' : 'members'} using seats you own. ` +
          'Deleting your account would end their access, so we will not do it automatically. ' +
          'Email us to transfer the workspace or to agree a date, and we will finish the deletion with you.',
      })
    }
  }

  const plusStatus = str(profile?.plusStatus)
  if (
    str(profile?.plusSubscriptionId) !== null &&
    plusStatus !== null &&
    RECURRING_LIVE_STATUSES.has(plusStatus)
  ) {
    blockers.push({
      code: 'plus-subscription',
      message: `Your Pro+ subscription is still active. ${CANCEL_IN_PORTAL}`,
    })
  }

  return blockers
}

export interface ActiveSubscription {
  kind: 'team' | 'plus'
  name: string
  status: string
  /** ISO date the paid period ends, when known. */
  periodEnd: string | null
}

/** The recurring subscriptions still charging this person. For display. */
export function activeSubscriptions(input: {
  uid: string
  profile: Record<string, unknown> | null
  teams: TeamView[]
}): ActiveSubscription[] {
  const out: ActiveSubscription[] = []
  for (const team of input.teams) {
    if (str(team.data.ownerId) !== input.uid) continue
    const status = str(team.data.subscriptionStatus)
    if (
      str(team.data.polarSubscriptionId) === null ||
      status === null ||
      !RECURRING_LIVE_STATUSES.has(status)
    ) {
      continue
    }
    const end = millis(team.data.currentPeriodEnd)
    out.push({
      kind: 'team',
      name: str(team.data.name) ?? 'Team',
      status,
      periodEnd: end === null ? null : new Date(end).toISOString(),
    })
  }
  const plusStatus = str(input.profile?.plusStatus)
  if (
    str(input.profile?.plusSubscriptionId) !== null &&
    plusStatus !== null &&
    RECURRING_LIVE_STATUSES.has(plusStatus)
  ) {
    const end = millis(input.profile?.plusPeriodEnd)
    out.push({
      kind: 'plus',
      name: 'Pro+',
      status: plusStatus,
      periodEnd: end === null ? null : new Date(end).toISOString(),
    })
  }
  return out
}

/**
 * Every workspace this person owns or belongs to, with its members.
 *
 * Owned ones are found by query, so a workspace that never made it into the
 * profile's `teamIds` mirror (a webhook that wrote the team and died before
 * the profile update) is still found. Belonging ones come from `teamIds`,
 * which is the only place that list is kept.
 */
export async function loadTeams(
  store: AccountStore,
  uid: string,
  profile: Record<string, unknown> | null,
): Promise<TeamView[]> {
  const found = new Map<string, Doc>()

  for (const doc of await store.list('teams', { ownerId: uid })) found.set(doc.id, doc)

  const teamIds = Array.isArray(profile?.teamIds)
    ? (profile.teamIds as unknown[]).filter((id): id is string => typeof id === 'string' && !!id)
    : []
  for (const id of teamIds) {
    if (found.has(id)) continue
    const doc = await store.getDoc(`teams/${id}`)
    if (doc) found.set(id, doc)
  }

  const teams: TeamView[] = []
  for (const doc of found.values()) {
    const members = await store.list(`teams/${doc.id}/members`)
    teams.push({ id: doc.id, data: doc.data, memberIds: members.map((m) => m.id) })
  }
  return teams
}

export type TeamAction = 'delete' | 'orphan' | 'leave'

/**
 * What to do with one workspace when its member deletes their account.
 *
 *   leave    not the owner: give the seat back, take their name off what
 *            they added.
 *   delete   the owner and nobody else is in it: nothing depends on it.
 *   orphan   the owner, others are in it, and it is not live (a term that
 *            ran out, a revoked licence). Nothing is being taken from
 *            anyone, so it stays, with no owner. The live case never gets
 *            here — `findBlockers` refused it.
 */
export function planTeamAction(uid: string, team: TeamView): TeamAction {
  if (str(team.data.ownerId) !== uid) return 'leave'
  const others = team.memberIds.filter((member) => member !== uid).length
  return others === 0 ? 'delete' : 'orphan'
}

/* ------------------------------------------------------------------ *
 *  Purchases and receipts
 * ------------------------------------------------------------------ */

export interface OrderRow {
  /** The Polar order id. */
  id: string
  /** ISO timestamp the order was recorded. */
  date: string | null
  plan: string
  /** What to print: a plan name, or "500 AI credits" for a pack. */
  label: string
  interval: string
  amountCents: number
  currency: string
  status: 'paid' | 'refunded'
  refundedAt: string | null
  /** Credits the order granted, for a pack. */
  credits: number | null
}

function iso(value: unknown): string | null {
  const ms = millis(value)
  return ms === null || Number.isNaN(ms) ? null : new Date(ms).toISOString()
}

/** One `purchases` document, in the shape the receipts list renders. */
export function toOrderRow(doc: { id: string; data: Record<string, unknown> }): OrderRow {
  const d = doc.data
  const plan = str(d.plan) ?? 'pro'
  const credits = typeof d.credits === 'number' && d.credits > 0 ? d.credits : null
  const isPack = str(d.packId) !== null
  const catalogName = (PLANS as Record<string, { name: string } | undefined>)[plan]?.name

  const refundedAt = iso(d.refundedAt)
  return {
    id: doc.id,
    date: iso(d.createdAt),
    plan,
    label: isPack && credits ? `${credits.toLocaleString('en-US')} AI credits` : (catalogName ?? plan),
    interval: str(d.interval) ?? 'one_time',
    amountCents: typeof d.amountCents === 'number' ? d.amountCents : 0,
    currency: (str(d.currency) ?? 'usd').toLowerCase(),
    status: refundedAt ? 'refunded' : 'paid',
    refundedAt,
    credits,
  }
}

/** Newest first. Rows with no date sort last rather than first. */
export function sortOrders(rows: OrderRow[]): OrderRow[] {
  return [...rows].sort((a, b) => {
    const at = a.date ? Date.parse(a.date) : -Infinity
    const bt = b.date ? Date.parse(b.date) : -Infinity
    return bt - at
  })
}

/**
 * The write the refund webhook adds to a purchase, or null when it has
 * already been made.
 *
 * `now` is a parameter so the caller passes a Firestore `Timestamp` and this
 * stays free of the Admin SDK. Null-when-marked is what keeps a redelivered
 * refund from moving the date, and — because the webhook releases its claim
 * and retries when a later step throws — from moving it on every retry.
 */
export function refundMarker<T>(
  purchase: Record<string, unknown>,
  now: T,
): { refundedAt: T } | null {
  return purchase.refundedAt ? null : { refundedAt: now }
}

/**
 * The patch that cuts a purchase loose from its owner.
 *
 * What stays is what a tax authority would ask for and nothing else: order
 * id (the document id), plan, interval, amount, currency, timestamps, pack
 * and credits, the checkout id Polar quotes back. `userId` is cleared, which
 * is what makes it pseudonymous: the record no longer points at an account.
 * Clearing it also makes the refund webhook a safe no-op for this order — it
 * sees no user and returns, instead of trying to update a profile that no
 * longer exists.
 *
 * `undefined` is "delete this field" in the store, so the personal fields a
 * future webhook version might start recording are removed by name even
 * though today's writes do not include them. Belt and braces, and free.
 */
export function purchaseTombstone<T>(now: T): Record<string, unknown> {
  return {
    userId: null,
    accountDeletedAt: now,
    retainedFor: 'tax-records',
    name: undefined,
    customerName: undefined,
    email: undefined,
    customerEmail: undefined,
    billingName: undefined,
    billingAddress: undefined,
  }
}

/* ------------------------------------------------------------------ *
 *  Webhook events
 * ------------------------------------------------------------------ */

const ORDER_EVENTS = ['order.created', 'order.updated', 'order.paid', 'order.refunded']
const SUBSCRIPTION_EVENTS = [
  'subscription.created',
  'subscription.active',
  'subscription.updated',
  'subscription.canceled',
  'subscription.uncanceled',
  'subscription.revoked',
  'subscription.past_due',
]
const CHECKOUT_EVENTS = ['checkout.created', 'checkout.updated', 'checkout.expired']
const CUSTOMER_EVENTS = [
  'customer.created',
  'customer.updated',
  'customer.deleted',
  'customer.state_changed',
]

/**
 * The `webhookEvents` documents that can hold this person's details.
 *
 * The webhook stores the whole Polar payload under an id of
 * `type:objectId` — see `webhookEvents` in `billing/webhook/route.ts` — so
 * they cannot be queried by user. They can be addressed, though: the ids the
 * account already knows (orders, subscriptions, checkouts, the Polar
 * customer) crossed with the event types Polar sends for each.
 *
 * Reading a document that does not exist is cheap and returns nothing; the
 * alternative, missing a payload with a name and address in it, is not.
 * What this cannot reach is an event type Polar adds that is not listed
 * above. `policy.ts` says as much, and the report to the owner says it too.
 */
export function webhookEventPaths(ids: {
  orders: string[]
  subscriptions: string[]
  checkouts: string[]
  customers: string[]
}): string[] {
  const paths = new Set<string>()
  const add = (types: string[], objectIds: string[]) => {
    for (const objectId of objectIds) {
      if (!objectId) continue
      for (const type of types) {
        paths.add(`webhookEvents/${encodeURIComponent(`${type}:${objectId}`)}`)
      }
    }
  }
  add(ORDER_EVENTS, ids.orders)
  add(SUBSCRIPTION_EVENTS, ids.subscriptions)
  add(CHECKOUT_EVENTS, ids.checkouts)
  add(CUSTOMER_EVENTS, ids.customers)
  return [...paths]
}

/** What a stored event keeps once its payload is blanked. */
export function redactedEventPatch<T>(now: T): Record<string, unknown> {
  return { payload: null, redactedAt: now, redactedBecause: 'account-deleted' }
}
