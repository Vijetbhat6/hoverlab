import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { CONFIRM_CLAUSE, looksLikeEmail, subscribe } from '@/lib/firebase/subscribers'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { isAdminConfigured } from '@/lib/firebase/admin'

/**
 * POST /api/subscribe  body { email, source?, website? } → { ok, confirmationEmail }
 *
 * The inline "want to hear when there are more?" prompt shown after a
 * download. It shares its storage, its double opt-in and its confirmation
 * link with `/api/newsletter` — see `lib/firebase/subscribers.ts` for why
 * there is one list rather than two, and `lib/newsletter-state.ts` for what
 * `pending` and `confirmed` mean.
 *
 * Rate-limited per client IP (`lib/rate-limit.ts`), not on the daily
 * export-meter family. This endpoint writes a Firestore document for any
 * address a stranger can type, so it needs a ceiling — but joining a
 * mailing list must not spend someone's downloads. The daily `subscribe`
 * meter this used to charge is now unused: one limiter per route, and the
 * same budget as `/api/newsletter` so the two forms cannot be used to double it.
 *
 * ALWAYS ANSWERS 200 for a well-formed address, whether or not it was
 * already on the list. Telling an anonymous caller "that address is
 * already subscribed" turns the form into an oracle for whether a given
 * person uses this site, which is not a thing a signup form should leak.
 *
 * `confirmationEmail` says whether this deployment can actually email the
 * confirmation link. Where it cannot (RESEND_API_KEY unset), the form must
 * not say "check your inbox" — the address is recorded as pending and
 * nothing is mailed until the resend script runs.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** What the inline prompt promises. Recorded verbatim against the address. */
const INLINE_CONSENT =
  'One email when something new lands. No digests, no promotions. ' +
  'Unsubscribe in one click.' +
  CONFIRM_CLAUSE

export const POST = withJsonErrors('api/subscribe', async (request: Request) => {
  const limited = await enforceRateLimit(request, RATE_LIMITS.newsletter)
  if (limited) return limited

  let body: { email?: unknown; source?: unknown; website?: unknown }
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

  // Say so rather than accepting the address and dropping it.
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: 'The mailing list is not configured on this deployment. Nothing was saved.' },
      { status: 503 },
    )
  }

  // Honeypot: same answer as a real signup, nothing stored.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ ok: true, confirmationEmail: false })
  }

  const source = typeof body.source === 'string' ? body.source : 'unknown'

  const { mailConfigured } = await subscribe({
    email: body.email,
    source,
    consentText: INLINE_CONSENT,
  })

  return NextResponse.json(
    { ok: true, confirmationEmail: mailConfigured },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
})
