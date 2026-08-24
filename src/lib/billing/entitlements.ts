import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'
import type { PlanId } from './plans'

/**
 * What a given user is allowed to do.
 *
 * Entitlements are DERIVED, never stored as a single "tier" field: a
 * user can hold a one-time Pro license and separately belong to a paid
 * Team, and those grant different things. Deriving from the underlying
 * records (the profile's proLicense, a team's subscriptionStatus) means a
 * refund or a failed renewal takes effect the moment the webhook lands,
 * with no denormalized field left to drift.
 *
 * This is the only module that decides access. Route handlers and server
 * components ask it; they never read `proLicense` directly.
 *
 * Firestore layout:
 *   users/{uid}                 { proLicense, teamIds: string[] }
 *   teams/{teamId}              { subscriptionStatus, currentPeriodEnd, … }
 *   teams/{teamId}/members/{uid}
 *
 * Membership is recorded on both sides on purpose. `teamIds` on the profile
 * answers "which teams is this user in?" in one document read, where the
 * relational version used a join. The alternative — a collection-group query
 * across every members subcollection — needs a composite index and spends a
 * query on the hot path of every gated action.
 */

export interface Entitlements {
  /** Highest plan the user holds, for display ("You're on Pro"). */
  plan: PlanId
  /** Paid one-time Pro license. */
  hasPro: boolean
  /** Seat on a one-time Studio license. Grants Pro, not Team. */
  hasStudio: boolean
  /**
   * Active Pro+ subscription — a monthly AI credit allowance.
   *
   * Grants no catalog rights at all, which is why it is a separate flag
   * rather than a rung: a Pro+ subscriber with no licence can generate
   * variations and still may not ship them commercially.
   */
  hasPlus: boolean
  /** Member of a Team with a live subscription. */
  hasTeam: boolean
  /**
   * The live workspace this user belongs to — a Team subscription or a
   * Studio license — else null.
   *
   * Both ride the same `teams/{id}` documents because seat management is
   * identical for the two; what differs is what the seat entitles you to,
   * which is `hasTeam` versus `hasStudio`, not where the members live.
   */
  teamId: string | null
  /**
   * Everything a paid licence carries. Sorted by how real the wall is,
   * because two of these are enforceable and the rest are boundaries.
   *
   * Server-held, and genuinely enforced:
   *   the commercial licence      /licence, plus a dated certificate
   *   unlimited bundle size       LIMITS.bundleSize, checked server-side
   *   no daily export meter       DAILY_EXPORTS in ./quota-limits
   *   private collections         Firestore, per account
   *   saved brand libraries       Firestore, per account
   *   a licence key               ./api-key, resolved by /api/v1
   *   the design-system export    generated per customer on request
   *
   * A product boundary on this website, and not a lock:
   *   Vue/Svelte/styled-components/Tailwind exports. The conversion runs
   *   in the browser and `/api/v1` hands every format to any caller by
   *   design, so this narrows the website's panel and nothing else. See
   *   FREE_FRAMEWORK_IDS in lib/export/index.ts, which says the same at
   *   the point of enforcement, and the pricing footnote, which says it
   *   to the buyer before they pay.
   *
   * An earlier revision of this comment struck the last four items on the
   * enforced list as unbuildable-or-dishonest, which was true of the tree
   * it was written against and is no longer true of this one. Anything
   * added here has to be checkable against a call site in the same commit.
   */
  canUseProFeatures: boolean
  /** Shared brand tokens, shared collections, seat management. */
  canUseTeamFeatures: boolean
}

/** What an anonymous or free user gets — browsing and copying stay free. */
export const FREE_ENTITLEMENTS: Entitlements = {
  plan: 'free',
  hasPro: false,
  hasStudio: false,
  hasPlus: false,
  hasTeam: false,
  teamId: null,
  canUseProFeatures: false,
  canUseTeamFeatures: false,
}

/**
 * A subscription counts as live while Polar reports it active, and also
 * while it's past_due or canceled but still inside the period the customer
 * already paid for. Cutting access the instant a card fails would punish
 * users for a billing hiccup they can still fix.
 *
 * Shared by workspaces and by Pro+, which have the same lifecycle even
 * though one lives on a team document and the other on a profile.
 */
function subscriptionIsLive(status: string, currentPeriodEnd: Date | null): boolean {
  if (status === 'active') return true
  // A Studio license is bought outright, so its workspace has no renewal to
  // fail and no period to run out. The webhook writes this status once and
  // never revisits it — only a refund takes the seats away.
  if (status === 'lifetime') return true
  // A fixed term bought outright — 'team-annual'. It has no renewal to fail
  // either, but unlike 'lifetime' it does run out, so it is live only while
  // the term it paid for still is. Anything that widens this must widen
  // `isLive()` in workspace.ts with it.
  if (status === 'term') {
    return currentPeriodEnd !== null && currentPeriodEnd.getTime() > Date.now()
  }
  if (status === 'past_due' || status === 'canceled') {
    return currentPeriodEnd !== null && currentPeriodEnd.getTime() > Date.now()
  }
  return false
}

function toDateOrNull(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return null
}

/** Resolve entitlements for a user id. Returns free access for unknown ids. */
export async function getEntitlements(
  userId: string | null,
): Promise<Entitlements> {
  if (!userId) return FREE_ENTITLEMENTS

  const db = adminDb()
  const snap = await db.collection('users').doc(userId).get()
  if (!snap.exists) return FREE_ENTITLEMENTS

  const data = snap.data() ?? {}
  const hasPro = data.proLicense === true

  const teamIds = Array.isArray(data.teamIds)
    ? data.teamIds.filter((id): id is string => typeof id === 'string' && !!id)
    : []

  let liveTeamId: string | null = null
  let liveStudioId: string | null = null
  if (teamIds.length) {
    // getAll is a single round trip for all of them, not one read per team.
    const teamRefs = teamIds.map((id) => db.collection('teams').doc(id))
    const teamSnaps = await db.getAll(...teamRefs)
    for (const team of teamSnaps) {
      if (!team.exists) continue
      const t = team.data() ?? {}
      const status =
        typeof t.subscriptionStatus === 'string' ? t.subscriptionStatus : 'inactive'
      if (!subscriptionIsLive(status, toDateOrNull(t.currentPeriodEnd))) continue

      // Both kinds of workspace live in `teams`, so which one this is has to
      // be read off the document rather than inferred from membership. An
      // older team document has no `kind` at all, and predates Studio — it
      // is a subscription.
      if (t.kind === 'studio') {
        liveStudioId ??= team.id
      } else {
        liveTeamId ??= team.id
      }
      // A subscription outranks a Studio license for display, so keep
      // looking only while we haven't found one.
      if (liveTeamId) break
    }
  }

  const hasTeam = liveTeamId !== null
  const hasStudio = liveStudioId !== null

  // Pro+ is a subscription on the profile rather than a workspace: it seats
  // exactly one person and shares nothing, so a teams/ document for it
  // would be a workspace of one.
  const hasPlus = subscriptionIsLive(
    typeof data.plusStatus === 'string' ? data.plusStatus : 'inactive',
    toDateOrNull(data.plusPeriodEnd),
  )

  return {
    // Team is the higher plan for display, then Studio — a Pro licence with
    // company on it. Pro+ is deliberately not in this ladder: it is an
    // add-on, and someone holding it alone is still on the free catalog
    // licence, so it shows beside the plan rather than instead of it.
    plan: hasTeam ? 'team' : hasStudio ? 'studio' : hasPro ? 'pro' : 'free',
    hasPro,
    hasStudio,
    hasPlus,
    hasTeam,
    teamId: liveTeamId ?? liveStudioId,
    // A Team seat and a Studio seat both include everything Pro grants.
    canUseProFeatures: hasPro || hasStudio || hasTeam,
    // Shared brand tokens and shared collections are the subscription's
    // product. Studio buys the license for ten people, not the workspace.
    canUseTeamFeatures: hasTeam,
  }
}

/** Limits that differ by plan. Free stays generous — it's the SEO funnel. */
export const LIMITS = {
  /** Bundle size. Free is capped; paid is unlimited. */
  bundleSize: { free: 10, paid: Number.POSITIVE_INFINITY },
} as const

/** Max bundle entries for a set of entitlements. */
export function bundleLimit(ent: Entitlements): number {
  return ent.canUseProFeatures ? LIMITS.bundleSize.paid : LIMITS.bundleSize.free
}
