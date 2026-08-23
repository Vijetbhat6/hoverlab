/**
 * POST /api/newsletter        body { email, source? } → { ok: true }
 * DELETE /api/newsletter      body { email }          → { ok: true }
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
 * moment this deploys. When a real sending platform is chosen, set
 * RESEND_API_KEY + RESEND_AUDIENCE_ID and each new address is mirrored
 * there too (see forwardToResend below) — the Firestore collection stays
 * the record of what was consented to and when.
 *
 * Document id is a SHA-256 of the normalised address, not the address
 * itself. Firestore document ids appear in paths, logs and index keys;
 * hashing keeps the plaintext to a single field, and makes re-subscribing
 * an idempotent write rather than a duplicate row.
 *
 * The two promises in the band's copy are kept here rather than assumed:
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
 * No IP address and no user agent are stored. Neither is needed to send an
 * email, and the least interesting way to fail a privacy notice is to
 * collect something you had no use for.
 */

import { NextResponse } from 'next/server'
import { createHash, randomBytes } from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { withJsonErrors } from '@/lib/route-errors'
import { adminDb, isAdminConfigured } from '@/lib/firebase/admin'

export const runtime = 'nodejs'

/** Collection holding one document per address. */
const COLLECTION = 'newsletterSubscribers'

/**
 * The exact promise shown above the field, stored with every signup.
 *
 * Keep this in sync with the copy in `newsletter-signup.tsx`. If the two
 * ever disagree, the stored one is the record of what was actually agreed.
 */
const CONSENT_TEXT =
  'One email when new effects are added. No spam, no promotions, no digests. ' +
  'Unsubscribe in one click.'

/** Where the signup happened — for knowing which surface converts. */
const SOURCES = new Set(['landing', 'pricing', 'footer', 'docs'])

/**
 * Deliberately loose.
 *
 * A regex strict enough to reject every invalid address also rejects valid
 * ones (plus-addressing, new TLDs, unicode domains), and the only real
 * validation of an email address is sending to it. This rejects what is
 * obviously not an address and lets the rest through.
 */
function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  if (email.length < 3 || email.length > 254) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

function docId(email: string): string {
  return createHash('sha256').update(email).digest('hex')
}

/**
 * Mirror a new subscriber into Resend's audience, when one is configured.
 *
 * Best effort on purpose: the address is already durably stored by the
 * time this runs, so a Resend outage must not turn into a failed signup
 * for the visitor. A failure is logged and swallowed.
 */
async function forwardToResend(email: string): Promise<void> {
  const key = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!key || !audienceId) return

  try {
    const res = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, unsubscribed: false }),
      },
    )
    if (!res.ok) {
      console.error('[newsletter] resend forward failed:', res.status)
    }
  } catch (err) {
    console.error('[newsletter] resend forward threw:', err)
  }
}

export const POST = withJsonErrors('newsletter', async (req: Request) => {
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
  } | null

  const email = normalizeEmail(body?.email)
  if (!email) {
    return NextResponse.json(
      { error: "That doesn't look like an email address." },
      { status: 400 },
    )
  }

  const source =
    typeof body?.source === 'string' && SOURCES.has(body.source)
      ? body.source
      : 'landing'

  const ref = adminDb().collection(COLLECTION).doc(docId(email))
  const existing = await ref.get()

  // A second signup from the same address re-subscribes rather than
  // duplicating — including for someone who had unsubscribed and changed
  // their mind. The original token is kept so any unsubscribe link already
  // sitting in their inbox still works.
  await ref.set(
    {
      email,
      source,
      status: 'subscribed',
      consentedTo: CONSENT_TEXT,
      consentedAt: FieldValue.serverTimestamp(),
      unsubscribeToken:
        (existing.data()?.unsubscribeToken as string | undefined) ??
        randomBytes(24).toString('base64url'),
      ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  )

  await forwardToResend(email)

  return NextResponse.json({ ok: true })
})

/**
 * Unsubscribe by address, for anyone who asks directly rather than through
 * the one-click link. Idempotent: an address that was never subscribed
 * gets the same answer as one that was.
 */
export const DELETE = withJsonErrors('newsletter', async (req: Request) => {
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
    .collection(COLLECTION)
    .doc(docId(email))
    .set(
      { status: 'unsubscribed', unsubscribedAt: FieldValue.serverTimestamp() },
      { merge: true },
    )

  return NextResponse.json({ ok: true })
})
