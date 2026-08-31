/**
 * What support each plan actually gets.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────────
 *
 * Support was the one row in `/compare` where a competitor beat us and we
 * had nothing at all to put in the cell. Aceternity sells a private Discord
 * and a 48-hour response as line items on a $199 licence; this site made no
 * commitment anywhere, in either direction. That is worse than a modest
 * promise, because a buyer comparing two libraries reads silence as "none".
 *
 * ── THE RULE THIS FILE FOLLOWS ──────────────────────────────────────────
 *
 * The same one `what Pro gates` follows: never state a commitment with no
 * mechanism behind it. So every target here is a *business-hours* target,
 * deliberately more conservative than the competitor's 48 hours, and every
 * channel degrades honestly — `supportChannels()` returns only the channels
 * that are actually configured, so a deployment with no Discord invite and
 * no operator email advertises neither. A promise the operator cannot keep
 * is a refund request with extra steps.
 *
 * These numbers are a business decision, not an engineering one. They are
 * in one place so they can be changed in one place.
 */

import { SOCIAL, isPlaceholder } from '@/lib/social'
import { OPERATOR, legalDetailsPending } from '@/lib/legal'
import type { PlanId } from '@/lib/billing/plans'

export type SupportTierId = 'community' | 'email' | 'priority'

export interface SupportTier {
  id: SupportTierId
  label: string
  /** Business days, or null where nothing is promised. */
  responseDays: number | null
  /** One sentence, as it appears on the pricing table and `/support`. */
  summary: string
}

export const SUPPORT_TIERS: Record<SupportTierId, SupportTier> = {
  community: {
    id: 'community',
    label: 'Community',
    responseDays: null,
    summary:
      'Ask in the community or open an issue. Answered when someone gets to it — no target, stated plainly rather than implied.',
  },
  email: {
    id: 'email',
    label: 'Email support',
    responseDays: 2,
    summary:
      'Email the maintainers about anything in the catalog or your licence. First reply within two business days.',
  },
  priority: {
    id: 'priority',
    label: 'Priority support',
    responseDays: 1,
    summary:
      'Your team’s questions go to the front of the queue, with a first reply within one business day.',
  },
}

/**
 * Exhaustive by `PlanId` on purpose.
 *
 * A new plan added to `plans.ts` will not compile until somebody decides
 * what its buyers are owed. That decision has been made implicitly — as
 * "nothing" — for every plan on this site until now.
 */
export const SUPPORT_BY_PLAN: Record<PlanId, SupportTierId> = {
  free: 'community',
  // The catalog licence. Two business days is what a one-time purchase at
  // this price can sustain without a support hire.
  pro: 'email',
  // Pro+ is an AI credit add-on rather than a catalog tier, so it carries
  // whatever the buyer's underlying plan carries. Listed as `email` because
  // it cannot be bought without Pro.
  plus: 'email',
  studio: 'priority',
  team: 'priority',
  'team-annual': 'priority',
  // A renewal buys another update window on a licence already held; the
  // support tier is the one that licence already had.
  renewal: 'email',
  'renewal-studio': 'priority',
}

export function supportFor(plan: PlanId): SupportTier {
  return SUPPORT_TIERS[SUPPORT_BY_PLAN[plan]]
}

export interface SupportChannel {
  id: 'email' | 'discord' | 'github'
  label: string
  href: string
  /** What this channel is the right door for. */
  use: string
}

/**
 * The channels that actually exist on this deployment.
 *
 * Everything here is configuration-dependent, and the honest failure mode
 * is omission rather than a dead link — the same call `lib/social.ts` makes
 * and for the same reason. A `/support` page listing a Discord that resolves
 * to discord.com is worse than one listing only email.
 */
export function supportChannels(): SupportChannel[] {
  const channels: SupportChannel[] = []
  if (!legalDetailsPending()) {
    channels.push({
      id: 'email',
      label: OPERATOR.contactEmail,
      href: `mailto:${OPERATOR.contactEmail}`,
      use: 'Licences, invoices, refunds, and anything you would rather not ask in public.',
    })
  }

  if (!isPlaceholder(SOCIAL.discord)) {
    channels.push({
      id: 'discord',
      label: 'Discord',
      href: SOCIAL.discord.href,
      use: 'Implementation questions, and the fastest answer when someone else has hit the same thing.',
    })
  }

  if (!isPlaceholder(SOCIAL.github)) {
    channels.push({
      id: 'github',
      label: 'GitHub issues',
      href: `${SOCIAL.github.href.replace(/\/$/, '')}/issues`,
      use: 'Bugs in a block, a broken export, a token that renders wrong.',
    })
  }

  return channels
}
