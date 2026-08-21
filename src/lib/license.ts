/**
 * The licence — what Hoverlab actually sells.
 *
 * Worth stating plainly, because the obvious objection to this business is
 * correct on its own terms: every artifact in the catalog ships to the
 * browser as readable source, `/api/v1` is public and unauthenticated, and
 * `npx hoverlab add` needs no account. Anyone can take the code.
 *
 * That is not the thing being sold. Permission is. A freelancer shipping
 * client work, an agency with a procurement process, anyone inside a company
 * with a legal team — all of them need a defensible answer to "where did
 * this come from and are we allowed to ship it?", and copying the file does
 * not produce one. This module is that answer, written down once so the
 * pricing page, the licence page and the certificate on /account cannot
 * drift into describing three different products.
 *
 * There is no activation server and no licence check in the code. A licence
 * id here identifies a purchase; it does not unlock anything, and nothing
 * anywhere validates it. Saying so in the open is deliberate — a key that
 * implies enforcement it does not have is the kind of claim that turns a
 * support question into a trust problem.
 *
 * Data-free and isomorphic: the terms are the same strings on the server,
 * in the client bundle, and in whatever a customer prints.
 */

import type { PlanId } from '@/lib/billing/plans'

/* ------------------------------------------------------------------ *
 *  The two licences
 * ------------------------------------------------------------------ */

export type LicenseKind = 'free' | 'commercial'

export interface LicenseTerms {
  kind: LicenseKind
  name: string
  /** One sentence: who this is for. */
  summary: string
  /** What the holder may do. */
  grants: string[]
  /** What the licence does not cover. Identical in both, deliberately. */
  restrictions: string[]
}

/**
 * Restrictions are shared verbatim between the two licences.
 *
 * Buying Pro does not buy the right to become a competitor, and the free
 * licence is not more restrictive about it — a customer who reads both
 * should find the same two sentences, not a hint that paying widens them.
 */
const SHARED_RESTRICTIONS: string[] = [
  'You may not redistribute the catalog itself — in whole or in substantial part — as files, as a dataset, or through an API of your own.',
  'You may not sell or give away a component library, template, theme or UI kit that is substantially built from these artifacts. Shipping a product that uses them is fine; shipping them as the product is not.',
  'Hoverlab is provided as-is, with no warranty. You are responsible for testing what you ship.',
]

export const FREE_LICENSE: LicenseTerms = {
  kind: 'free',
  name: 'Free licence',
  summary:
    'Everyone gets this, with or without an account. It covers learning, side projects and anything you are not paid for.',
  grants: [
    'Use any effect, block, page or template in personal, educational and non-commercial projects.',
    'Modify the source however you like. Nothing here is meant to be pasted unchanged.',
    'No attribution required, ever. Credit is welcome and never obligatory.',
    'Keep using anything you have already shipped, permanently.',
  ],
  restrictions: SHARED_RESTRICTIONS,
}

export const COMMERCIAL_LICENSE: LicenseTerms = {
  kind: 'commercial',
  name: 'Commercial licence',
  summary:
    'Included with Pro, Studio and Team. It covers work you are paid for — client projects, products that charge money, anything shipped under a company name.',
  grants: [
    'Everything in the free licence.',
    'Unlimited commercial projects — client work, paid products, SaaS, internal company tools.',
    'Unlimited end users. There is no seat count on the people who see what you ship.',
    'Perpetual and irrevocable for anything already shipped. A refund or a lapsed subscription never reaches back into work you have delivered.',
    // Was "All future catalog updates, at no further cost." That promise
    // grew more expensive every week it was kept — every artifact added
    // after a purchase was value delivered against no revenue — and it is
    // not what the comparable products sell. What did NOT change: the
    // licence to ship what you already have is still perpetual and
    // irrevocable, which is the line above this one.
    'Twelve months of catalog updates from the date of purchase. Everything published in that window is yours permanently, whether or not you renew.',
    'Subscriptions include updates for as long as they are live — there is no separate window.',
  ],
  restrictions: SHARED_RESTRICTIONS,
}

export const LICENSES: LicenseTerms[] = [FREE_LICENSE, COMMERCIAL_LICENSE]

/* ------------------------------------------------------------------ *
 *  A held licence
 * ------------------------------------------------------------------ */

/** What `/api/billing/license` returns for the signed-in caller. */
export interface HeldLicense {
  kind: LicenseKind
  /** The plan the licence came with. */
  plan: PlanId
  /** Display name of the plan, e.g. "Studio". */
  planName: string
  /** Quotable identifier for the purchase. Identifies; does not unlock. */
  licenseId: string | null
  /** Name on the licence — the account's name, or its email. */
  holder: string
  holderEmail: string
  /** ISO 8601, when the licence was granted. Null for the free licence. */
  issuedAt: string | null
  /**
   * ISO 8601, the end of the included update window. Null when there is
   * none to show — the free licence, or a subscription, where updates run
   * with the plan.
   *
   * Nothing enforces this. The catalog is static, public and unauthenticated
   * below the template rung, and no code path anywhere reads this date. It
   * is a term of the licence, stated on the certificate so a customer knows
   * what they bought without having to re-read the licence page.
   */
  updatesUntil: string | null
  /** People the licence covers. Null when it is not counted in seats. */
  seats: number | null
  /**
   * True when the licence is a subscription and therefore ends if it
   * lapses — for future work, never for what has already shipped.
   */
  recurring: boolean
}

/**
 * A quotable licence id from a Polar order id.
 *
 * `HL-PRO-4F2A-91C7-6B0E`: long enough to be unambiguous in an email to a
 * procurement inbox, short enough to read aloud. Derived rather than stored
 * so it can never disagree with the order it names, and uppercase-hex so
 * there are no characters a reader has to guess the case of.
 *
 * Not a secret and not a key. Nothing validates it — see the note at the
 * top of this file.
 */
export function licenseIdFor(plan: PlanId, orderId: string): string {
  const clean = orderId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  // Polar order ids are UUIDs, so 12 characters is plenty; the padding is
  // for any id short enough that slicing would produce a stub.
  const body = (clean + '000000000000').slice(0, 12)
  const groups = [body.slice(0, 4), body.slice(4, 8), body.slice(8, 12)]
  return `HL-${plan.toUpperCase()}-${groups.join('-')}`
}

/**
 * End of the included update window, from a purchase date.
 *
 * Calendar months rather than 365 days, so a licence bought on 3 March
 * runs to 3 March — the date a customer would work out themselves, and the
 * one they will complain about if it disagrees.
 *
 * JavaScript rolls 31 January + 12 months to 31 January correctly, and
 * would roll an impossible date (29 February + 12 months) forward into
 * March rather than throwing. That is the right direction for the rounding
 * to go: it errs a day in the customer's favour.
 */
export function updatesUntilFor(issuedAt: string, months: number | null): string | null {
  if (months === null) return null
  const start = new Date(issuedAt)
  if (Number.isNaN(start.getTime())) return null
  const end = new Date(start)
  end.setMonth(end.getMonth() + months)
  return end.toISOString()
}

/** The terms a held licence resolves to. */
export function termsFor(kind: LicenseKind): LicenseTerms {
  return kind === 'commercial' ? COMMERCIAL_LICENSE : FREE_LICENSE
}
