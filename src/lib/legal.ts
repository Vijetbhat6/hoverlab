/**
 * Who is behind Hoverlab, for the pages that have to say so.
 *
 * ────────────────────────────────────────────────────────────────────────
 *  SET THE FOUR `OPERATOR_*` VARIABLES BEFORE TAKING REAL MONEY.
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
 * They come from the environment rather than being written in as literals
 * because a registered address is deployment configuration, not source: it
 * differs between whoever is operating this, it changes without the code
 * changing, and putting a home address in a git history is a decision that
 * cannot be taken back. The fallbacks keep the placeholders, so an unset
 * variable still fails `legalDetailsPending()` rather than rendering an
 * empty line where a company name belongs.
 *
 * ⚠ Server-only, deliberately un-prefixed. Every consumer today is a server
 * component; import `OPERATOR` into a client one and `process.env` gives it
 * nothing, so the pages would silently fall back to the placeholders in the
 * browser while looking correct in a build log. If a client component ever
 * needs these, pass them down as props rather than adding NEXT_PUBLIC_.
 *
 * These are read at module scope, which on a statically rendered route means
 * build time — so setting them in a hosting dashboard takes effect on the
 * next deploy, not the next request.
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

/**
 * Read one operator detail, falling back to its placeholder.
 *
 * Whitespace-only counts as unset. An environment variable set to a space —
 * which is what a dashboard field cleared with the space bar leaves behind —
 * would otherwise pass every presence check and render a legal page whose
 * operator name is blank, which is worse than one that says TO BE SET
 * because nothing downstream can detect it.
 */
function operatorDetail(value: string | undefined, placeholder: string): string {
  return value && value.trim() ? value.trim() : `${PENDING} — ${placeholder}`
}

export const OPERATOR: Operator = {
  legalName: operatorDetail(
    process.env.OPERATOR_LEGAL_NAME,
    'registered company or sole-trader name',
  ),
  // Not read from the environment: the trading name is the product's name,
  // it is the one value that does not vary by operator, and it is already
  // written into a hundred other strings on this site.
  tradingName: 'Hoverlab',
  address: operatorDetail(process.env.OPERATOR_ADDRESS, 'registered address'),
  jurisdiction: operatorDetail(
    process.env.OPERATOR_JURISDICTION,
    'e.g. India, or England and Wales',
  ),
  contactEmail: operatorDetail(
    process.env.OPERATOR_CONTACT_EMAIL,
    'e.g. hello@yourdomain.com',
  ),
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
