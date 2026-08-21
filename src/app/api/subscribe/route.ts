import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { addSubscriber, looksLikeEmail } from '@/lib/firebase/subscribers'
import { resolveRequestSubject } from '@/lib/billing/request-subject'
import { consumeQuota } from '@/lib/billing/quota'

/**
 * POST /api/subscribe  body { email, source? } → { ok }
 *
 * The mailing list. See `lib/firebase/subscribers.ts` for why this is the
 * one channel worth owning.
 *
 * Rate-limited on its own daily counter, not the export one. This endpoint
 * writes a Firestore document for any address a stranger can type, so it
 * needs a ceiling — but joining a mailing list must not spend someone's
 * downloads, which is the same reason AI search has a counter of its own.
 * See METERS in `billing/quota-limits.ts`.
 *
 * ALWAYS ANSWERS 200 for a well-formed address, whether or not it was
 * already on the list. Telling an anonymous caller "that address is
 * already subscribed" turns the form into an oracle for whether a given
 * person uses this site, which is not a thing a signup form should leak.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const POST = withJsonErrors('api/subscribe', async (request: Request) => {
  let body: { email?: unknown; source?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!looksLikeEmail(body.email)) {
    return NextResponse.json(
      { error: 'That does not look like an email address.' },
      { status: 400 },
    )
  }

  const source = typeof body.source === 'string' ? body.source : 'unknown'

  const { subject, entitlements } = await resolveRequestSubject(request)
  const quota = await consumeQuota(subject, entitlements, 'subscribe', 'subscribe')
  if (!quota.ok) {
    return NextResponse.json(
      { error: 'Too many attempts from here today. Try again tomorrow.' },
      { status: 429 },
    )
  }

  await addSubscriber(body.email, source)

  return NextResponse.json(
    { ok: true },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
})
