import 'server-only'
import { NextResponse } from 'next/server'
import { OPERATOR, legalDetailsPending } from '@/lib/legal'
import { buildExpiredSessionCookie } from '@/lib/session'

/**
 * Small things the four account routes all need, in one place so they cannot
 * drift apart.
 */

/** Never cache anything here: it is one person's data, keyed by a cookie. */
export const NO_STORE = { 'Cache-Control': 'private, no-store' } as const

/**
 * The address to send someone to when a self-serve tool cannot finish.
 *
 * Null while the operator's details are placeholders, exactly as
 * `supportChannels()` withholds the email channel in that state: an error
 * message that says "email TO BE SET" is worse than one that points at the
 * support page. The client falls back to `/support` on null.
 */
export function supportEmail(): string | null {
  return legalDetailsPending() ? null : OPERATOR.contactEmail
}

export function json(body: Record<string, unknown>, status = 200, headers: HeadersInit = {}) {
  return NextResponse.json(body, { status, headers: { ...NO_STORE, ...headers } })
}

export function unauthenticated(clearCookie = false) {
  const res = json({ error: 'Sign in to do that.', code: 'unauthenticated' }, 401)
  // A cookie that no longer verifies still reads as "signed in" to
  // proxy.ts. Expiring it is what lets the person land on /login instead of
  // bouncing off it. See the note on `SessionResolution` in lib/session.ts.
  if (clearCookie) res.headers.set('Set-Cookie', buildExpiredSessionCookie())
  return res
}

export function notConfigured() {
  return json(
    {
      error:
        'The account service is not configured on this deployment, so nothing was read or changed.',
      code: 'not_configured',
    },
    503,
  )
}

export function rateLimited(retryAfterSeconds: number, what: string) {
  return json(
    {
      error: `You have reached today's limit for ${what}. Try again tomorrow, or email us and we will do it by hand.`,
      code: 'rate_limited',
      supportEmail: supportEmail(),
    },
    429,
    { 'Retry-After': String(retryAfterSeconds) },
  )
}

/**
 * Refuse a state-changing request that a browser says came from another site.
 *
 * The session cookie is `SameSite=Lax`, which already stops it riding along
 * on a cross-site POST, so this is a second lock rather than the first.
 * `Sec-Fetch-Site` is the reliable signal and is sent by every current
 * browser; `Origin` is the fallback for the rest. A request with neither
 * (curl, a server-side caller) is not a browser-CSRF vector and passes.
 */
export function isCrossSite(request: Request): boolean {
  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite) return fetchSite !== 'same-origin' && fetchSite !== 'none'

  const origin = request.headers.get('origin')
  if (!origin) return false
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  try {
    return host !== null && new URL(origin).host !== host
  } catch {
    return true
  }
}

export function crossSiteRefused() {
  return json({ error: 'That request did not come from this site.', code: 'cross_site' }, 403)
}
