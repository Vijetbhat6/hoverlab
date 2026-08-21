import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'
import type { Entitlements } from './entitlements'
import { DAILY_EXPORTS, METERS, type MeterId, type QuotaAction } from './quota-limits'

export { DAILY_EXPORTS, METERS, isQuotaAction, type MeterId, type QuotaAction } from './quota-limits'

/**
 * Daily export quota — the meter that makes the free tier run out.
 *
 * Why a meter rather than another gate. Everything in this catalog is
 * readable and copyable for free, on purpose: browsing is the funnel and
 * `/api/v1` is public (see `lib/api/public.ts`). That leaves Pro selling a
 * licence plus two feature flags, which is a thin thing to ask $79 for,
 * because nothing a free user does ever stops working. A gate would fix
 * that by taking the product away. A meter fixes it by letting the free
 * tier be complete and finite — the wall arrives at the moment of highest
 * intent, and only for someone taking things in bulk.
 *
 * UI8 reached the same answer from the other direction: All-Access is
 * capped at 30 downloads a day, which is what stops a group-buy account
 * reselling the catalog without gating a single page.
 *
 * WHAT IS METERED: packaging actions — a bundle built as ZIP/CSS/HTML, an
 * artifact archive. Things that hand over many artifacts at once.
 *
 * WHAT IS NOT: copying, browsing, search, the CLI's `add`, `/api/v1`, DNA
 * and skill exports. Copying one effect is the product working as
 * advertised, and metering it would break the standing decision that
 * nothing is gated at browse or copy. The distinction is bulk, not access.
 *
 * Anonymous visitors are metered by a hashed IP rather than turned away.
 * The hash is not an identity — it exists so one visitor cannot spend the
 * whole world's quota — and signing in raises the limit, which is the
 * cheapest honest reason this product has to ask for an email.
 *
 * Firestore layout:
 *   quotas/{day}__{subject}   { day, subject, count, updatedAt }
 *
 * Documents are per-day and never read again after midnight UTC. They are
 * left to accumulate rather than deleted on a schedule: a cron that has to
 * run for correctness is a cron that can fail silently, and these are ~80
 * bytes each. Set a Firestore TTL policy on `updatedAt` if the collection
 * ever needs sweeping.
 */

/**
 * Who a quota is charged to.
 *
 * `kind` is carried rather than inferred from the key so the limit lookup
 * cannot drift from the subject: an anonymous subject must never be able
 * to present itself as a signed-in one by shaping its key.
 */
export type QuotaSubject =
  | { kind: 'user'; key: string }
  | { kind: 'anonymous'; key: string }

export interface QuotaState {
  /** Exports already spent today. */
  used: number
  /** Exports allowed today. `null` means unlimited. */
  limit: number | null
  /** Exports left today. `null` means unlimited. */
  remaining: number | null
  /** True when a paid licence has removed the meter entirely. */
  unlimited: boolean
  /** ISO instant the counter resets — the next UTC midnight. */
  resetsAt: string
}

/** The daily limit a set of entitlements is worth on one meter. */
export function limitFor(
  subject: QuotaSubject,
  ent: Entitlements,
  meter: MeterId = 'exports',
): number {
  const limits = METERS[meter].limits
  /*
   * Pro+ lifts the AI meters as well as Pro lifting the export one. A
   * subscriber paying monthly for AI credits who then hit a daily search
   * cap would be metered twice for the same thing.
   */
  const paid =
    meter === 'exports' ? ent.canUseProFeatures : ent.canUseProFeatures || ent.hasPlus
  if (paid) return limits.paid
  return subject.kind === 'user' ? limits.free : limits.anonymous
}

/** Today's key, in UTC so the reset cannot drift with the caller's clock. */
function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10)
}

/** Next UTC midnight, as an ISO instant. */
function nextReset(now = new Date()): string {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  )
  return next.toISOString()
}

function docIdFor(subject: QuotaSubject, day: string, meter: MeterId): string {
  // Three segments joined by a separator that cannot appear in any of
  // them: a day is digits and dashes, the prefixes are single letters, and
  // both subject keys are hex. The meter prefix is what keeps the counters
  // independent — without it, searching would spend downloads.
  return `${day}__${METERS[meter].prefix}${subject.kind === 'user' ? 'u' : 'a'}_${subject.key}`
}

function unlimitedState(): QuotaState {
  return {
    used: 0,
    limit: null,
    remaining: null,
    unlimited: true,
    resetsAt: nextReset(),
  }
}

/**
 * Read the quota without spending it.
 *
 * Used to render "3 of 10 exports left today" before the user commits to
 * anything. Never writes, so a page view cannot consume quota.
 */
export async function peekQuota(
  subject: QuotaSubject,
  ent: Entitlements,
  meter: MeterId = 'exports',
): Promise<QuotaState> {
  const limit = limitFor(subject, ent, meter)
  if (!Number.isFinite(limit)) return unlimitedState()

  const day = todayKey()
  const snap = await adminDb().collection('quotas').doc(docIdFor(subject, day, meter)).get()
  const data = snap.data() ?? {}
  const used = data.day === day && typeof data.count === 'number' ? data.count : 0

  return {
    used,
    limit,
    remaining: Math.max(limit - used, 0),
    unlimited: false,
    resetsAt: nextReset(),
  }
}

export type QuotaResult =
  | { ok: true; state: QuotaState }
  | { ok: false; state: QuotaState }

/**
 * Charge one export against the subject's daily quota.
 *
 * One transaction, so two downloads in flight cannot both spend the last
 * export. Callers charge BEFORE handing anything over and refund on
 * failure — the reverse leaves an export that is free to anyone willing to
 * make the packaging step throw.
 *
 * The day is re-read inside the transaction rather than trusted from the
 * document id, so a counter written just before midnight rolls to zero on
 * the first request after it instead of carrying yesterday's total.
 */
export async function consumeQuota(
  subject: QuotaSubject,
  ent: Entitlements,
  action: QuotaAction | 'ai-search',
  meter: MeterId = 'exports',
): Promise<QuotaResult> {
  const limit = limitFor(subject, ent, meter)
  if (!Number.isFinite(limit)) return { ok: true, state: unlimitedState() }

  const db = adminDb()
  const day = todayKey()
  const ref = db.collection('quotas').doc(docIdFor(subject, day, meter))
  const resetsAt = nextReset()

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.data() ?? {}
    const used = data.day === day && typeof data.count === 'number' ? data.count : 0

    if (used >= limit) {
      return {
        ok: false as const,
        state: { used, limit, remaining: 0, unlimited: false, resetsAt },
      }
    }

    tx.set(ref, {
      day,
      subject: subject.key,
      kind: subject.kind,
      action,
      count: used + 1,
      updatedAt: Timestamp.now(),
    })

    return {
      ok: true as const,
      state: {
        used: used + 1,
        limit,
        remaining: limit - used - 1,
        unlimited: false,
        resetsAt,
      },
    }
  })
}

/**
 * Give back an export that was charged for work that then failed.
 *
 * Floors at zero rather than decrementing blindly: a refund that arrives
 * after midnight would otherwise push the new day's counter negative and
 * hand out a free export every time a packaging step errored near the
 * rollover.
 */
export async function refundQuota(
  subject: QuotaSubject,
  meter: MeterId = 'exports',
): Promise<void> {
  const db = adminDb()
  const day = todayKey()
  const ref = db.collection('quotas').doc(docIdFor(subject, day, meter))

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.data() ?? {}
    if (data.day !== day || typeof data.count !== 'number' || data.count <= 0) return
    tx.update(ref, { count: data.count - 1, updatedAt: Timestamp.now() })
  })
}
