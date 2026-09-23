/**
 * POST /api/newsletter        body { email, source?, website? } → { ok, confirmationEmail }
 * DELETE /api/newsletter      body { email }                    → { ok: true }
 *
 * Where the newsletter band's email addresses actually go.
 *
 * Before this route existed, `<NewsletterSignup>`'s submit handler was
 * `setTimeout(() => setStatus('done'), 800)`. It rendered "You're in" and
 * stored nothing. That is the launch list the project most needs thrown
 * away one address at a time, and — because the section promises "no spam"
 * and "unsubscribe in one click" — a promise made to a named person about
 * data that was never kept. It is also the fallback CTA for any pricing
 * tier that is not purchasable, so the highest-intent visitors were the
 * ones being discarded.
 *
 * Storage is Firestore, through the Admin SDK this app already configures
 * for accounts and bundles. No new vendor, no new key, and it works the
 * moment this deploys. The logic — states, tokens, the confirmation email —
 * lives in `lib/firebase/subscribers.ts` and `lib/newsletter-state.ts`, and
 * is shared with `/api/subscribe` so there is one list and one consent
 * shape, not two.
 *
 * ── DOUBLE OPT-IN ──────────────────────────────────────────────────────
 *
 * Submitting an address records it as PENDING and asks its owner to confirm
 * (GET /api/newsletter/confirm?token=…). Only a confirmed address is ever
 * mailed a digest or a sequence. That is what makes `consentedTo` true of
 * the person on the row rather than of whoever typed their address.
 *
 * RESEND_API_KEY is unset in production today, so no confirmation email can
 * be sent yet. The response says so through `confirmationEmail: false`, and
 * the form must not say "check your inbox" when it is — see
 * `components/landing/newsletter-signup.tsx`. The row is kept as pending
 * with `confirmationSent: false`, and `scripts/send-pending-confirmations.mts`
 * sends them the day a key exists.
 *
 * The answer is 200 with the SAME body whether the address is new, pending
 * or already confirmed. A different answer would make this form an oracle
 * for whether a given person is on the list.
 *
 * The promises in the band's copy are kept here rather than assumed:
 *
 *   "unsubscribe in one click"  Every subscriber gets an `unsubscribeToken`
 *                               at signup. GET /api/newsletter/unsubscribe
 *                               ?token=… flips status to 'unsubscribed'
 *                               with no login and no confirmation step.
 *
 *   consent is recorded         `consentedTo` stores the exact sentence the
 *                               person agreed to, with the timestamp. GDPR
 *                               asks you to be able to show consent, not to
 *                               remember having asked for it.
 *
 * No IP address and no user agent are stored on the subscriber row. Neither
 * is needed to send an email, and the least interesting way to fail a
 * privacy notice is to collect something you had no use for. The rate
 * limiter that guards this route stores a salted hash of the address in a
 * counter document, not on the row (lib/rate-limit.ts).
 *
 * `website` is a honeypot: a field no human sees and no browser autofills.
 * A bot that fills it gets the same success answer and nothing is stored —
 * telling it it was caught would only teach it to leave the field empty.
 */

import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { SIGNUP_SOURCES } from '@/lib/sequences'
import { adminDb, isAdminConfigured } from '@/lib/firebase/admin'
import {
  CONFIRM_CLAUSE,
  normalizeEmail,
  subscribe,
  subscriberId,
  SUBSCRIBERS_COLLECTION,
} from '@/lib/firebase/subscribers'
import { isMailConfigured } from '@/lib/newsletter-mail'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { FieldValue } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

/**
 * The exact promise shown above the field, stored with every signup.
 *
 * Keep these in sync with the copy beside each form. If the two ever
 * disagree, the stored one is the record of what was actually agreed.
 *
 * Per source, not one string for everyone, and that is not bookkeeping.
 * Someone signing up from /for-authors is agreeing to a five-email sequence
 * over about a fortnight; someone signing up from the landing page is
 * agreeing to be told when things are added. Recording the second promise
 * against the first person is a false record of consent — and it is a false
 * record we would only discover when they replied to email three asking why
 * they were getting it.
 *
 * Each ends with the double opt-in sentence, because that is now part of
 * what was agreed: nothing is sent until the address is confirmed.
 */
const CONSENT_TEXT: Record<string, string> = {
  default:
    'Four emails over about a month — what is free, the four ways into the ' +
    'catalog, the one line in the licence that matters, and what has been ' +
    'added — then only mail when something is added. No spam, no promotions. ' +
    'Unsubscribe in one click.' +
    CONFIRM_CLAUSE,
  tools:
    'Three emails over about two weeks — how the tools connect to the catalog, ' +
    'the other nineteen tools, and where the one wall is — then only mail when ' +
    'something is added. No spam, no promotions. Unsubscribe in one click.' +
    CONFIRM_CLAUSE,
  authors:
    'A five-email sequence over about two weeks about the licence, the catalog ' +
    'and how it is reached, then only mail when something is added. No spam, no ' +
    'promotions. Unsubscribe in one click.' +
    CONFIRM_CLAUSE,
}

/**
 * Where the signup happened — for knowing which surface converts, and for
 * choosing the sequence.
 *
 * Imported from `lib/sequences.ts` rather than typed out again. A source
 * this route accepts is a promise that somebody who signed up there
 * receives something, so the list belongs with the sequences that honour
 * it; `sequences.test.ts` asserts every member reaches one.
 */
const SOURCES = new Set<string>(SIGNUP_SOURCES)

export const POST = withJsonErrors('newsletter', async (req: Request) => {
  // Per-IP, first: this route writes a document for any address a stranger
  // can type, and (with a transport) sends a message to it.
  const limited = await enforceRateLimit(req, RATE_LIMITS.newsletter)
  if (limited) return limited

  // Say so rather than accepting the address and dropping it — silently
  // succeeding is exactly the behaviour this route replaces.
  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          'The mailing list is not configured on this deployment, so your ' +
          'address was not stored. Nothing was saved — please try again later.',
      },
      { status: 503 },
    )
  }

  const body = (await req.json().catch(() => null)) as {
    email?: unknown
    source?: unknown
    website?: unknown
  } | null

  const email = normalizeEmail(body?.email)
  if (!email) {
    return NextResponse.json(
      { error: "That doesn't look like an email address." },
      { status: 400 },
    )
  }

  // Honeypot. Same answer as a real signup, nothing stored.
  if (typeof body?.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ ok: true, confirmationEmail: isMailConfigured() })
  }

  const source =
    typeof body?.source === 'string' && SOURCES.has(body.source)
      ? body.source
      : 'landing'

  const { mailConfigured } = await subscribe({
    email,
    source,
    consentText: CONSENT_TEXT[source] ?? CONSENT_TEXT.default,
  })

  return NextResponse.json({ ok: true, confirmationEmail: mailConfigured })
})

/**
 * Unsubscribe by address, for anyone who asks directly rather than through
 * the one-click link. Idempotent: an address that was never subscribed
 * gets the same answer as one that was.
 */
export const DELETE = withJsonErrors('newsletter', async (req: Request) => {
  const limited = await enforceRateLimit(req, RATE_LIMITS.newsletter)
  if (limited) return limited

  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: 'The mailing list is not configured on this deployment.' },
      { status: 503 },
    )
  }

  const body = (await req.json().catch(() => null)) as { email?: unknown } | null
  const email = normalizeEmail(body?.email)
  if (!email) {
    return NextResponse.json(
      { error: "That doesn't look like an email address." },
      { status: 400 },
    )
  }

  await adminDb()
    .collection(SUBSCRIBERS_COLLECTION)
    .doc(subscriberId(email))
    .set(
      { status: 'unsubscribed', unsubscribedAt: FieldValue.serverTimestamp() },
      { merge: true },
    )

  return NextResponse.json({ ok: true })
})
