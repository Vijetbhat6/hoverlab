import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import type { Entitlements } from './entitlements'

/**
 * AI credits — the meter behind Pro+.
 *
 * Two buckets, and the distinction is the whole design:
 *
 *   allowance   granted by an active Pro+ subscription or Team seat, reset
 *               at the start of each billing month. Unused credits do NOT
 *               roll over, because an allowance that accumulates is a
 *               liability that grows while the subscription is idle.
 *   purchased   paid for outright. Never expires and never resets, because
 *               someone paid for it — expiring it would be taking money for
 *               something we then took away.
 *
 *               Two things land here, and they are the same thing from the
 *               customer's side: a top-up pack, and the credits included in
 *               a Pro or Studio licence (`includedCredits` in ./plans).
 *               Bundling the licence grant into the perpetual bucket rather
 *               than inventing a third is what keeps "you own these" true
 *               for both.
 *
 * Allowance is spent first. Spending the perpetual bucket while a monthly
 * one sits unused would quietly convert a purchase into a subscription
 * benefit.
 *
 * The reset is lazy: the period is checked on read rather than by a cron.
 * A monthly job to reset a counter is a scheduled thing that can fail
 * silently and leave a paying customer at zero, where a lazy check can
 * only fail in the direction of granting credits to someone who came back.
 *
 * Firestore layout:
 *   users/{uid}.credits            { allowance, purchased, periodStart }
 *   users/{uid}/creditLedger/{id}  an append-only audit trail
 */

/* ------------------------------------------------------------------ *
 *  What each plan grants
 * ------------------------------------------------------------------ */

/**
 * Monthly credit allowance, by what the user holds.
 *
 * Pro and Studio are absent on purpose, and their absence is now load-
 * bearing rather than incidental. They are one-time licences, and attaching
 * a perpetual MONTHLY grant to a single payment is an unbounded cost with
 * no revenue behind it — the exact mistake that makes a lifetime deal
 * unprofitable three years later.
 *
 * What they carry instead is `includedCredits`: a one-time grant into the
 * `purchased` bucket at the moment of purchase. Bounded, owned by the
 * customer forever, and it never appears here — an allowance is something
 * that resets, and these do not.
 *
 * `plus` remains because people still hold it. It is no longer sold; see
 * `sold` in ./plans.
 */
export const MONTHLY_ALLOWANCE = {
  plus: 500,
  team: 500,
} as const

/**
 * Free AI actions per day, for everyone without an allowance.
 *
 * Not zero, deliberately: the point of the free tier is that people can
 * find out whether the thing is any good. A daily cap is also what stops
 * an anonymous endpoint being someone else's free LLM — the same reason
 * UI8 caps All-Access downloads rather than gating the catalog.
 */
export const FREE_DAILY_ACTIONS = 5

/** What one AI action costs, when the caller does not say. */
export const ACTION_COST = 1

/**
 * What each AI action costs, in credits.
 *
 * Credits were worth one thing when there was one endpoint. Now that they
 * buy several, a flat price would either overcharge for a recolour or
 * undercharge for composing a section from a brief — and a meter that
 * charges the same for a thirty-token edit and a two-thousand-token
 * generation stops meaning anything to the person watching their balance.
 *
 * The numbers track roughly what each call costs us to serve, not what it
 * is worth to the customer. Pricing by value here would be guessing, and
 * guessing high is how a credit balance turns into a grievance.
 *
 * Only cost-1 actions can draw on the free daily allowance — see
 * `spendCredits`. That is deliberate: five free composes a day is a
 * different product from five free recolours, and the free tier is sized
 * for the cheap one.
 */
export const ACTION_COSTS = {
  /** Edit or vary one component. The original action. */
  variant: 1,
  /** Recolour a component to a brand. Same size of call as a variant. */
  brand: 1,
  /** Build a section from a brief. Several times the output tokens. */
  compose: 3,
} as const

export type AiAction = keyof typeof ACTION_COSTS

export function costOf(action: AiAction): number {
  return ACTION_COSTS[action]
}

export function isAiAction(value: unknown): value is AiAction {
  return typeof value === 'string' && value in ACTION_COSTS
}

/* ------------------------------------------------------------------ *
 *  Packs
 * ------------------------------------------------------------------ */

export interface CreditPack {
  id: string
  name: string
  credits: number
  priceCents: number
  priceInrPaise: number
  polarProductId: string | null
}

/**
 * Top-up packs. One-time purchases that never expire.
 *
 * Priced so the bigger pack is the better deal without making the small
 * one feel like a punishment — 500 at 1¢ each, 2,000 at 0.75¢. Both sit
 * near what the comparable metered products charge for a refill
 * (21st.dev's $5 per 100 is the outlier; Magic Patterns' $0.02 per credit
 * is the ceiling).
 */
export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'credits-500',
    name: '500 credits',
    credits: 500,
    priceCents: 500,
    priceInrPaise: 47500,
    polarProductId: process.env.POLAR_PRODUCT_ID_CREDITS_500 ?? null,
  },
  {
    id: 'credits-2000',
    name: '2,000 credits',
    credits: 2000,
    priceCents: 1500,
    priceInrPaise: 142500,
    polarProductId: process.env.POLAR_PRODUCT_ID_CREDITS_2000 ?? null,
  },
]

export function getCreditPack(id: string): CreditPack | null {
  return CREDIT_PACKS.find((pack) => pack.id === id) ?? null
}

/* ------------------------------------------------------------------ *
 *  State
 * ------------------------------------------------------------------ */

export interface CreditState {
  /** Credits from the current billing month. Resets. */
  allowance: number
  /** Credits bought in a pack. Never expires. */
  purchased: number
  /** allowance + purchased, for display. */
  balance: number
  /** What a full month grants this user, or 0 if they hold no allowance. */
  monthlyAllowance: number
  /** Free actions left today, for users with no allowance. */
  freeRemaining: number
  /** When the current allowance period resets. Null when there is none. */
  renewsAt: string | null
}

/** The allowance a set of entitlements is worth per month. */
export function allowanceFor(ent: Entitlements): number {
  if (ent.hasTeam) return MONTHLY_ALLOWANCE.team
  if (ent.hasPlus) return MONTHLY_ALLOWANCE.plus
  return 0
}

/** First moment of the current allowance period (calendar month, UTC). */
function currentPeriodStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

function nextPeriodStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
}

/** Today's key for the free-action counter, in UTC so it cannot drift. */
function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10)
}

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return null
}

/**
 * Read a user's credit state, resetting the monthly allowance if the period
 * has rolled over.
 *
 * Writes when it resets, which makes this not quite a read — but the
 * alternative is every caller remembering to reset first, and the one that
 * forgets serves a paying customer a zero balance.
 */
export async function getCreditState(
  userId: string,
  ent: Entitlements,
): Promise<CreditState> {
  const db = adminDb()
  const ref = db.collection('users').doc(userId)
  const snap = await ref.get()
  const data = snap.data() ?? {}
  const credits = (data.credits ?? {}) as Record<string, unknown>

  const monthlyAllowance = allowanceFor(ent)
  const periodStart = currentPeriodStart()
  const storedStart = toDate(credits.periodStart)

  let allowance = typeof credits.allowance === 'number' ? credits.allowance : 0
  const purchased = typeof credits.purchased === 'number' ? credits.purchased : 0

  // Rolled into a new month, or gained an allowance since the last read.
  if (!storedStart || storedStart.getTime() < periodStart.getTime()) {
    allowance = monthlyAllowance
    if (snap.exists) {
      await ref.update({
        'credits.allowance': allowance,
        'credits.purchased': purchased,
        'credits.periodStart': Timestamp.fromDate(periodStart),
      })
    }
  }

  const usedToday =
    credits.freeDay === todayKey() && typeof credits.freeUsed === 'number'
      ? credits.freeUsed
      : 0

  return {
    allowance,
    purchased,
    balance: allowance + purchased,
    monthlyAllowance,
    freeRemaining: Math.max(FREE_DAILY_ACTIONS - usedToday, 0),
    renewsAt: monthlyAllowance > 0 ? nextPeriodStart().toISOString() : null,
  }
}

/* ------------------------------------------------------------------ *
 *  Spending
 * ------------------------------------------------------------------ */

export type SpendResult =
  | { ok: true; source: 'free' | 'allowance' | 'purchased'; remaining: number }
  | { ok: false; reason: 'out_of_free' | 'out_of_credits' }

/**
 * Charge a user for one AI action.
 *
 * The order is free daily actions → allowance → purchased. Free first
 * because a paying customer should not burn credits while a free quota
 * sits unused, and purchased last because it is the only bucket that
 * cannot come back.
 *
 * One transaction, so two requests in flight cannot both spend the last
 * credit. Callers must spend BEFORE doing the work and refund on failure —
 * the reverse leaves an opening where a request that always errors is free
 * to repeat forever.
 */
export async function spendCredits(
  userId: string,
  ent: Entitlements,
  cost = ACTION_COST,
): Promise<SpendResult> {
  const db = adminDb()
  const ref = db.collection('users').doc(userId)
  const periodStart = currentPeriodStart()
  const day = todayKey()
  const monthlyAllowance = allowanceFor(ent)

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.data() ?? {}
    const credits = (data.credits ?? {}) as Record<string, unknown>

    const storedStart = toDate(credits.periodStart)
    const rolledOver = !storedStart || storedStart.getTime() < periodStart.getTime()

    const allowance = rolledOver
      ? monthlyAllowance
      : typeof credits.allowance === 'number'
        ? credits.allowance
        : 0
    const purchased = typeof credits.purchased === 'number' ? credits.purchased : 0
    const freeUsed =
      credits.freeDay === day && typeof credits.freeUsed === 'number'
        ? credits.freeUsed
        : 0

    // Free actions are per-day and per-action, not per-credit: a costlier
    // action in future should draw on credits rather than silently eating
    // several days of someone's free quota.
    if (cost === ACTION_COST && freeUsed < FREE_DAILY_ACTIONS) {
      tx.set(
        ref,
        {
          credits: {
            allowance,
            purchased,
            periodStart: Timestamp.fromDate(periodStart),
            freeDay: day,
            freeUsed: freeUsed + 1,
          },
        },
        { merge: true },
      )
      return {
        ok: true as const,
        source: 'free' as const,
        remaining: FREE_DAILY_ACTIONS - freeUsed - 1,
      }
    }

    if (allowance >= cost) {
      tx.set(
        ref,
        {
          credits: {
            allowance: allowance - cost,
            purchased,
            periodStart: Timestamp.fromDate(periodStart),
            freeDay: day,
            freeUsed,
          },
        },
        { merge: true },
      )
      return {
        ok: true as const,
        source: 'allowance' as const,
        remaining: allowance - cost + purchased,
      }
    }

    if (purchased >= cost) {
      tx.set(
        ref,
        {
          credits: {
            allowance,
            purchased: purchased - cost,
            periodStart: Timestamp.fromDate(periodStart),
            freeDay: day,
            freeUsed,
          },
        },
        { merge: true },
      )
      return {
        ok: true as const,
        source: 'purchased' as const,
        remaining: allowance + purchased - cost,
      }
    }

    return {
      ok: false as const,
      // Told apart so the UI can offer the right thing: someone who has
      // simply used today's five free tries needs to hear "tomorrow, or
      // Pro+", and someone out of credits needs a top-up.
      reason: monthlyAllowance > 0 ? ('out_of_credits' as const) : ('out_of_free' as const),
    }
  })
}

/**
 * Put back what a failed action spent.
 *
 * Refunds to the bucket it came from, except for free actions, which
 * decrement the day's counter instead.
 */
export async function refundCredits(
  userId: string,
  source: 'free' | 'allowance' | 'purchased',
  cost = ACTION_COST,
): Promise<void> {
  const ref = adminDb().collection('users').doc(userId)
  if (source === 'free') {
    await ref.update({ 'credits.freeUsed': FieldValue.increment(-1) })
    return
  }
  await ref.update({ [`credits.${source}`]: FieldValue.increment(cost) })
}

/**
 * Add purchased credits, and record why.
 *
 * The ledger entry is keyed by the Polar order id, so a redelivered
 * webhook cannot credit the same pack twice — the same document-id
 * idempotency the purchase records use.
 */
export async function revokePurchasedCredits(
  userId: string,
  credits: number,
): Promise<void> {
  if (credits <= 0) return
  // Deliberately not clamped at zero. Clamping would let someone buy a
  // pack, spend it, refund it and keep the work; a negative balance just
  // means the next purchase settles the debt first.
  await adminDb()
    .collection('users')
    .doc(userId)
    .set(
      { credits: { purchased: FieldValue.increment(-credits) } },
      { merge: true },
    )
}

export async function addPurchasedCredits(
  userId: string,
  credits: number,
  orderId: string,
  packId: string,
  /*
   * Ledger document id, defaulting to the order id.
   *
   * An order is normally either a plan or a credit pack, so the order id
   * alone is a fine idempotency key. It stops being one now that a Pro
   * order ALSO grants credits: if a future order ever carried both, the
   * second write would find the first ledger entry and silently do nothing.
   * The licence grant passes `${orderId}-licence` so the two can never be
   * mistaken for each other, and a redelivery of either is still a no-op.
   */
  ledgerId: string = orderId,
): Promise<void> {
  const db = adminDb()
  const userRef = db.collection('users').doc(userId)
  const ledgerRef = userRef.collection('creditLedger').doc(ledgerId)

  await db.runTransaction(async (tx) => {
    if ((await tx.get(ledgerRef)).exists) return
    tx.set(ledgerRef, {
      credits,
      packId,
      polarOrderId: orderId,
      createdAt: Timestamp.now(),
    })
    tx.set(
      userRef,
      { credits: { purchased: FieldValue.increment(credits) } },
      { merge: true },
    )
  })
}
