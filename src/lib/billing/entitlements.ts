import 'server-only'
import { db } from '@/lib/db'
import type { PlanId } from './plans'

/**
 * What a given user is allowed to do.
 *
 * Entitlements are DERIVED, never stored as a single "tier" column: a
 * user can hold a one-time Pro license and separately belong to a paid
 * Team, and those grant different things. Deriving from the underlying
 * records (User.proLicense, Team.subscriptionStatus) means a refund or a
 * failed renewal takes effect the moment the webhook lands, with no
 * denormalized field left to drift.
 *
 * This is the only module that decides access. Route handlers and server
 * components ask it; they never read `proLicense` directly.
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

/** Resolve entitlements for a user id. Returns free access for unknown ids. */
export async function getEntitlements(userId: string | null): Promise<Entitlements> {
  if (!userId) return FREE_ENTITLEMENTS

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      proLicense: true,
      teamMemberships: {
        select: {
          team: {
            select: {
              id: true,
              subscriptionStatus: true,
              currentPeriodEnd: true,
            },
          },
        },
      },
    },
  })

  if (!user) return FREE_ENTITLEMENTS

  const liveTeam = user.teamMemberships
    .map((m) => m.team)
    .find((t) => teamIsLive(t.subscriptionStatus, t.currentPeriodEnd))

  const hasPro = user.proLicense
  const hasTeam = Boolean(liveTeam)

  return {
    // Team is the higher plan for display purposes.
    plan: hasTeam ? 'team' : hasPro ? 'pro' : 'free',
    hasPro,
    hasTeam,
    teamId: liveTeam?.id ?? null,
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
