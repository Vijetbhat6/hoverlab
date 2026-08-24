import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { resolveRequestSubject } from '@/lib/billing/request-subject'
import {
  consumeQuota,
  peekQuota,
  isQuotaAction,
  DAILY_EXPORTS,
} from '@/lib/billing/quota'

/**
 * The daily export meter.
 *
 *   GET  → the current state, without spending anything
 *   POST { action } → spends one export, or refuses with 429
 *
 * Bundle archives are built in the browser — the client already holds
 * every source it needs, and shipping them back to a server to be zipped
 * would double the traffic to produce the same bytes. So the meter is a
 * separate call the client makes first, and it is honest about what that
 * means: a determined user can build the zip without asking. That is true
 * of every client-side export in this market, and it is not what the
 * licence protects.
 *
 * What this does buy is the thing a meter is actually for: an ordinary
 * user meets a limit at the moment they are taking the most value, and the
 * two ways past it — sign in, or buy the licence — are both offered right
 * there. See `lib/billing/quota.ts` for why this is metered rather than
 * gated.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withJsonErrors('api/quota', async (request: Request) => {
  const { subject, entitlements } = await resolveRequestSubject(request)
  const state = await peekQuota(subject, entitlements)

  return NextResponse.json(
    {
      ...state,
      signedIn: subject.kind === 'user',
      // What the next step up is worth, so the client can say "signing in
      // gives you 10 a day" without hardcoding the number twice.
      signedInLimit: DAILY_EXPORTS.free,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
})

export const POST = withJsonErrors('api/quota', async (request: Request) => {
  let body: { action?: unknown }
  try {
    body = (await request.json()) as { action?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!isQuotaAction(body.action)) {
    return NextResponse.json({ error: 'Unknown export action' }, { status: 400 })
  }

  const { subject, entitlements } = await resolveRequestSubject(request)
  const result = await consumeQuota(subject, entitlements, body.action)

  if (!result.ok) {
    return NextResponse.json(
      {
        ...result.state,
        error:
          subject.kind === 'user'
            ? `That's your ${result.state.limit} exports for today.`
            : `That's ${result.state.limit} exports from this connection today.`,
        // The two refusals need different offers and the client should not
        // have to infer which from the wording: an anonymous visitor is one
        // free click from a bigger limit, a signed-in one is looking at the
        // licence.
        offer: subject.kind === 'user' ? 'pro' : 'signin',
        signedIn: subject.kind === 'user',
        signedInLimit: DAILY_EXPORTS.free,
      },
      { status: 429, headers: { 'Cache-Control': 'private, no-store' } },
    )
  }

  return NextResponse.json(
    { ...result.state, signedIn: subject.kind === 'user' },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
})
