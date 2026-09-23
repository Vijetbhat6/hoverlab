/**
 * Turning "Polar said no" into something a person can act on.
 *
 * The portal route can fail in ways that are the operator's problem and in
 * ways that are the customer's, and the screen must not blur them. The
 * Polar organisation token this deployment runs on has already been found
 * to lack read scopes (403 `insufficient_scope`), and it may equally lack
 * `customer_sessions:write`. None of that can be verified from here, so
 * every one of those outcomes has to end in a sentence that is true whether
 * or not the token is ever fixed:
 *
 *   - It says the portal is not available, not that something is "wrong
 *     with your account".
 *   - It says what to do instead (email support).
 *   - It never invites a retry that cannot succeed.
 *
 * Pure, so the mapping is testable without a network or an SDK. Polar's SDK
 * errors all extend `PolarError`, which carries `statusCode`; reading that
 * one property is the whole dependency.
 */

export type PortalFailureCode =
  | 'not_configured'
  | 'unauthenticated'
  | 'no_purchase'
  | 'no_customer'
  | 'portal_unavailable'
  | 'rate_limited'
  | 'upstream'

export interface PortalFailure {
  status: number
  code: PortalFailureCode
  error: string
}

/** The sentence the button is replaced by when the portal cannot be opened. */
export const PORTAL_UNAVAILABLE_MESSAGE =
  "Billing portal isn't available yet — email support and we'll sort it out by hand."

export const PORTAL_FAILURES: Record<PortalFailureCode, PortalFailure> = {
  not_configured: {
    status: 503,
    code: 'not_configured',
    error: 'Billing is not configured on this deployment, so there is no portal to open.',
  },
  unauthenticated: {
    status: 401,
    code: 'unauthenticated',
    error: 'Sign in to manage your billing.',
  },
  no_purchase: {
    status: 404,
    code: 'no_purchase',
    error: 'There is nothing to manage yet — this account has no purchases.',
  },
  no_customer: {
    status: 404,
    code: 'no_customer',
    error:
      "We couldn't find a billing profile for this account with our payment provider. Email support and we'll link it.",
  },
  portal_unavailable: {
    status: 503,
    code: 'portal_unavailable',
    error: PORTAL_UNAVAILABLE_MESSAGE,
  },
  rate_limited: {
    status: 429,
    code: 'rate_limited',
    error: 'Too many attempts today. Try again tomorrow, or email support.',
  },
  upstream: {
    status: 502,
    code: 'upstream',
    error: "The payment provider didn't answer. Try again in a minute, or email support.",
  },
}

/** The HTTP status carried by an SDK error, or null for anything else. */
export function statusOf(err: unknown): number | null {
  if (typeof err !== 'object' || err === null) return null
  const status = (err as { statusCode?: unknown; status?: unknown }).statusCode
  if (typeof status === 'number') return status
  const alt = (err as { status?: unknown }).status
  return typeof alt === 'number' ? alt : null
}

/**
 * Does this failure mean "that customer does not exist, try another way to
 * identify them"? 404 is the plain case; Polar answers 422 when an external
 * id fails validation against a customer it cannot find.
 */
export function isCustomerMissing(err: unknown): boolean {
  const status = statusOf(err)
  return status === 404 || status === 422
}

/**
 * Map an error from `customerSessions.create` to what the client is told.
 *
 *   401 / 403   the token is rejected or lacks `customer_sessions:write` —
 *               the operator's to fix, reported as "not available yet".
 *   404 / 422   Polar has no such customer — reported as a link problem.
 *   429         Polar is rate-limiting the operator — told as such.
 *   5xx, none   Polar down or unreachable — a retry is reasonable.
 */
export function classifyPortalError(err: unknown): PortalFailure {
  const status = statusOf(err)
  if (status === 401 || status === 403) return PORTAL_FAILURES.portal_unavailable
  if (status === 404 || status === 422) return PORTAL_FAILURES.no_customer
  if (status === 429) return PORTAL_FAILURES.rate_limited
  return PORTAL_FAILURES.upstream
}

/**
 * The ways to name this customer to Polar, best first.
 *
 * The Polar customer id the webhook linked is the most direct — it was read
 * off a real event — and the only one that works for an order someone
 * created by hand in the dashboard, whose customer has no external id.
 * `externalCustomerId` is what every checkout this app creates sets, so it
 * is the fallback and, for a customer never linked, the only option.
 */
export type CustomerRef = { customerId: string } | { externalCustomerId: string }

export function customerRefs(uid: string, polarCustomerId: string | null): CustomerRef[] {
  const refs: CustomerRef[] = []
  if (polarCustomerId) refs.push({ customerId: polarCustomerId })
  refs.push({ externalCustomerId: uid })
  return refs
}

/**
 * Whether the deployment can offer a portal at all, for the button to be
 * drawn or not.
 *
 * Shown only when billing is configured AND the account has bought
 * something. A "Manage billing" button on an account with no purchases
 * opens an empty portal at best and a 404 at worst, and one on a deployment
 * with no billing is a dead button — the thing this feature was told never
 * to ship.
 */
export function portalOffered(input: { billingConfigured: boolean; orderCount: number }): {
  available: boolean
  reason: 'not_configured' | 'no_purchase' | null
} {
  if (!input.billingConfigured) return { available: false, reason: 'not_configured' }
  if (input.orderCount === 0) return { available: false, reason: 'no_purchase' }
  return { available: true, reason: null }
}
