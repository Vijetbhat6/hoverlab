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
  /** Member of a Team with a live subscription. */
  hasTeam: boolean
  /** Team id when hasTeam, else null. */
  teamId: string | null
  /** Unlimited bundle size, all export formats, CLI/MCP token. */
  canUseProFeatures: boolean
  /** Shared brand tokens, shared collections, seat management. */
  canUseTeamFeatures: boolean
}

/** What an anonymous or free user gets — browsing and copying stay free. */
export const FREE_ENTITLEMENTS: Entitlements = {
  plan: 'free',
  hasPro: false,
  hasTeam: false,
  teamId: null,
  canUseProFeatures: false,
  canUseTeamFeatures: false,
}

/**
 * A team subscription counts as live while Polar reports it active, and
 * also while it's past_due or canceled but still inside the period the
 * customer already paid for. Cutting access the instant a card fails
 * would punish users for a billing hiccup they can still fix.
 */
function teamIsLive(status: string, currentPeriodEnd: Date | null): boolean {
  if (status === 'active') return true
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
  if (teamIds.length) {
    // getAll is a single round trip for all of them, not one read per team.
    const teamRefs = teamIds.map((id) => db.collection('teams').doc(id))
    const teamSnaps = await db.getAll(...teamRefs)
    for (const team of teamSnaps) {
      if (!team.exists) continue
      const t = team.data() ?? {}
      const status =
        typeof t.subscriptionStatus === 'string' ? t.subscriptionStatus : 'inactive'
      if (teamIsLive(status, toDateOrNull(t.currentPeriodEnd))) {
        liveTeamId = team.id
        break
      }
    }
  }

  const hasTeam = liveTeamId !== null

  return {
    // Team is the higher plan for display purposes.
    plan: hasTeam ? 'team' : hasPro ? 'pro' : 'free',
    hasPro,
    hasTeam,
    teamId: liveTeamId,
    // A Team seat includes everything Pro grants.
    canUseProFeatures: hasPro || hasTeam,
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
