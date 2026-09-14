/**
 * The affiliate programme, as terms rather than as a pitch.
 *
 * ── WHY THE TERMS ARE DATA ──────────────────────────────────────────────
 *
 * Every number below is a promise to pay somebody money. A commission rate
 * written into JSX gets edited the way copy gets edited — casually, by
 * whoever is on the page for another reason — and the person it was promised
 * to has no way to know it moved. Keeping it here means a change to the rate
 * is a change to a file whose entire purpose is the rate, reviewed as such,
 * and the page cannot disagree with the terms because it renders them.
 *
 * It is also what lets `/llms.txt` and the page quote the same 30% without
 * anyone remembering to update both.
 *
 * ── WHY 30%, AND WHY IT IS NOT RECURRING ────────────────────────────────
 *
 * 30% of a one-time licence is roughly what this category pays, and on a
 * $79 Pro licence it is $23.70 for one link — enough to be worth writing a
 * post for, which is the only affiliate behaviour worth paying for.
 *
 * It is not "30% recurring" and the page says so plainly, because almost
 * nothing here recurs: Pro, Studio and Enterprise are one-time licences.
 * Advertising a recurring rate against a product that does not recur is the
 * standard way this kind of programme misleads, and it is discovered by the
 * affiliate a month in, after they have already done the work.
 *
 * ── WHY IT MAY RENDER AS "NOT OPEN YET" ─────────────────────────────────
 *
 * Attribution, payouts and tax reporting for affiliates are a platform
 * feature, not something to hand-roll against a spreadsheet — getting it
 * wrong means either not paying someone who earned it or paying someone
 * twice, and both are worse than not running a programme. So the signup URL
 * comes from the environment, and until it is set the page explains the
 * terms and says the door is not open yet. Same rule as `lib/social.ts`:
 * never render a door that opens onto nothing.
 *
 * Set NEXT_PUBLIC_AFFILIATE_SIGNUP_URL to the platform's application page.
 * It is a NEXT_PUBLIC_ variable on purpose — unlike the discount codes in
 * `billing/codes.ts`, a public signup URL is meant to be in the bundle.
 */

export interface AffiliateTerm {
  label: string
  value: string
  /** Why it is this and not something else. Rendered under the value. */
  detail: string
}

/** Commission percentage. One constant, quoted everywhere. */
export const AFFILIATE_PERCENT = 30

/** Days a click is attributed for. */
export const AFFILIATE_COOKIE_DAYS = 60

export const AFFILIATE_TERMS: AffiliateTerm[] = [
  {
    label: 'Commission',
    value: `${AFFILIATE_PERCENT}% of the first purchase`,
    detail:
      'On every licence tier, including the regional prices — a sale into a discounted country pays 30% of what was actually charged, not 30% of list. Credit packs and renewals are excluded; they are follow-on purchases from customers you already earned.',
  },
  {
    label: 'Attribution window',
    value: `${AFFILIATE_COOKIE_DAYS} days`,
    detail:
      'Last click wins. Sixty days rather than thirty because a one-time developer-tool licence is frequently a considered purchase that waits for a project to start.',
  },
  {
    label: 'Not recurring',
    value: 'By design, not by omission',
    detail:
      'Pro, Studio and Enterprise are one-time licences — there is no second payment to take a percentage of. Only Team is a subscription, and it pays the same 30% on its first term.',
  },
  {
    label: 'Payout',
    value: 'After the refund window closes',
    detail:
      'Commission is held until the purchase is past the refund period in the refund policy, then paid. A commission paid on a refunded sale has to be clawed back, which is a worse conversation than waiting.',
  },
  {
    label: 'Self-referrals',
    value: 'Not eligible',
    detail:
      'Using your own link to take 30% off your own licence is a discount code with extra steps. If you want a lower price, the regional pricing and the student discount are both real and neither needs a workaround.',
  },
]

/**
 * What an affiliate is not allowed to do.
 *
 * Short, specific and about the two things that actually cause damage:
 * bidding on the brand name pushes up the cost of our own traffic and earns
 * commission on people who were already coming, and inventing claims puts
 * statements we cannot stand behind under our name. Vague "act
 * professionally" clauses enforce nothing and warn nobody.
 */
export const AFFILIATE_PROHIBITED: string[] = [
  'Bidding on the brand name, or close variants of it, in paid search.',
  'Coupon and deal sites that intercept a visitor who was already checking out.',
  'Claims we do not make ourselves — counts, customers, endorsements, benchmarks. Everything on this site is sourced, and a review that invents a number invents it in our name.',
  'Presenting the catalog as your own work, or a review as independent while the link is an affiliate one. Disclose it; most jurisdictions require it and readers spot it anyway.',
]

/** The application URL, or null when the programme is not open on this deployment. */
export function affiliateSignupUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_AFFILIATE_SIGNUP_URL?.trim()
  return url && /^https?:\/\//.test(url) ? url : null
}
