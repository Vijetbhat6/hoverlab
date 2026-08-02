/**
 * Turn an unhandled throw in a route handler into JSON.
 *
 * Next.js renders an uncaught error as an HTML 500 page. Client code that
 * does `res.json().catch(() => ({}))` — which is every fetch wrapper,
 * including this app's — then has no error to show and falls back to
 * something generic. That is how a missing AUTH_SECRET reached a user as
 * "Sign in failed. Please try again.": a sentence about their password,
 * describing a server that could not sign tokens.
 *
 * Wrapping the auth routes guarantees the client always receives a JSON
 * `error` it can display, the real cause is logged server-side, and the
 * status (503) says "the server is broken" rather than 500's "something
 * happened".
 */

import { NextResponse } from 'next/server'

export function withJsonErrors<A extends unknown[]>(
  route: string,
  handler: (...args: A) => Promise<Response>,
): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    try {
      return await handler(...args)
    } catch (err) {
      console.error(`[${route}] unhandled error:`, err)
      return NextResponse.json(
        {
          error:
            'The server could not complete this request — it is misconfigured, ' +
            'not your credentials. Check /api/health/auth.',
        },
        { status: 503 },
      )
    }
  }
}
