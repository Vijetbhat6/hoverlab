/**
 * Who is behind Hoverlab, for the pages that have to say so.
 *
 * ────────────────────────────────────────────────────────────────────────
 *  EDIT THE FIVE VALUES IN `OPERATOR` BEFORE TAKING REAL MONEY.
 * ────────────────────────────────────────────────────────────────────────
 *
 * Terms, Privacy, Refunds and the Licence all need to name a real legal
 * person at a real address with a real contact route. A policy that names
 * nobody is not a policy — a payment processor will reject it, and a
 * customer with a complaint has nowhere to send it.
 *
 * They live here rather than being typed into four pages so that they are
 * changed once, and so that `legalDetailsPending()` can tell whether they
 * have been changed at all. `scripts/check-deploy.mjs` asks the deployed
 * site the same question, which is why the placeholders below are shaped
 * to be detectable rather than plausible.
 *
 * `EFFECTIVE_DATE` is the date the current text took effect. Move it when
 * the terms materially change, not on every typo — the date is what a
 * customer relies on to know which version they agreed to.
 */

export interface Operator {
  /** The legal person: a registered company, or your own name if a sole trader. */
  legalName: string
  /** Trading name, if it differs. Shown in prose. */
  tradingName: string
  /** Registered address, one line. Required by most payment processors. */
  address: string
  /** Country whose law governs, and whose courts hear a dispute. */
  jurisdiction: string
  /** Where a human replies. Support, privacy requests and legal notices. */
  contactEmail: string
}

/** The placeholder marker. Any value containing it is not real. */
const PENDING = 'TO BE SET'

export const OPERATOR: Operator = {
  legalName: `${PENDING} — registered company or sole-trader name`,
  tradingName: 'Hoverlab',
  address: `${PENDING} — registered address`,
  jurisdiction: `${PENDING} — e.g. India, or England and Wales`,
  contactEmail: `${PENDING} — e.g. hello@yourdomain.com`,
}

/** ISO date the current version of these documents took effect. */
export const EFFECTIVE_DATE = '2026-08-22'

/**
 * True while any operator detail is still a placeholder.
 *
 * Exported so a check can fail on it. It deliberately does NOT make the
 * pages render a warning banner: a "DRAFT" stripe across a live Terms page
 * damages trust more than the missing address does, and the fix is to
 * fill in the values rather than to decorate the gap.
 */
export function legalDetailsPending(): boolean {
  return Object.values(OPERATOR).some((v) => v.includes(PENDING))
}

/** "22 August 2026" — matches the ledger's en-GB, UTC formatting. */
export function formatLegalDate(iso: string = EFFECTIVE_DATE): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
