import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { absoluteUrl } from '@/lib/site'
import {
  decideConfirm,
  decideSubscribe,
  issueToken,
  looksLikeToken,
  hashToken,
  statusOf,
  type ConfirmOutcome,
  type SubscriberRow,
} from '@/lib/newsletter-state'
import { confirmationEmail, isMailConfigured, sendMail } from '@/lib/newsletter-mail'

/**
 * The mailing list, with double opt-in.
 *
 * Worth stating why this exists at all, because the rest of the product is
 * built on the opposite assumption. Every distribution channel here is
 * borrowed: search rankings, an npm package people find through a blog
 * post, an MCP registry. The competitor sweep found what happens when that
 * is the whole strategy — Tailwind Labs' docs traffic fell 40% and revenue
 * 80% once developers started asking agents instead of reading pages, and
 * three of four engineers were laid off. A list is the one channel that
 * cannot be re-ranked.
 *
 * ── ONE COLLECTION, TWO FORMS ──────────────────────────────────────────
 *
 * There used to be two lists. `/api/newsletter` (the landing band, the
 * pricing fallback) wrote `newsletterSubscribers`, which is what the digest
 * script reads; `/api/subscribe` (the inline prompt after a download) wrote
 * a different collection, `subscribers`, that nothing read. Two
 * collections meant two consent shapes and one of them could never be
 * mailed — and with double opt-in it would have meant one list with a
 * confirmation step and one without. Both routes now come through
 * `subscribe()` below and write `newsletterSubscribers`. Rows already in
 * the old `subscribers` collection are untouched and are NOT mailed: they
 * carry `confirmed: false` and no consent text, and nothing reads them.
 *
 * Firestore layout:
 *   newsletterSubscribers/{sha256(email)}
 *     { email, source, status, consentedTo, consentedAt, createdAt,
 *       unsubscribeToken, unsubscribedAt,
 *       confirmationSent, confirmationSentAt,
 *       confirmTokenHash, confirmTokenExpiresAt, confirmedAt }
 *
 * `status` is 'pending' | 'confirmed' | 'unsubscribed' — see
 * `lib/newsletter-state.ts` for the transitions and for why a row with no
 * status counts as unconfirmed. The document id is a hash of the lowercased
 * address, which makes signing up twice idempotent without a query.
 *
 * ── WHAT IS STORED, AND WHAT IS NOT ────────────────────────────────────
 *
 * The address, the source, the consent sentence and its timestamp, the
 * unsubscribe token, and a hash of the confirmation token. No IP address
 * and no user agent: neither is needed to send an email, and the least
 * interesting way to fail a privacy notice is to collect something with no
 * use. (The rate limiter sees the IP but stores only a salted hash of it,
 * keyed to a counter, in `rateLimits` — never on this row.)
 *
 * ── SENDING ─────────────────────────────────────────────────────────────
 *
 * The confirmation goes through `lib/newsletter-mail.ts` when — and only
 * when — a transport is configured. Where it is not, the row is written as
 * pending with `confirmationSent: false`, nothing is mailed, and
 * `scripts/send-pending-confirmations.mts` sends them once a key exists.
 * Neither the row nor the response ever claims a message went out that did
 * not.
 */

/** Collection holding one document per address. */
export const SUBSCRIBERS_COLLECTION = 'newsletterSubscribers'

/**
 * The sentence every stored consent text ends with, and every form shows.
 *
 * Double opt-in is part of what a person agrees to, so it belongs in the
 * record of what they agreed to. Exported so the two signup routes and the
 * two forms cannot drift into describing different things.
 */
export const CONFIRM_CLAUSE =
  ' We email a confirmation link first and send nothing until you follow it.'

/** Normalise for both the hash and storage, so one address is one row. */
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  if (email.length < 3 || email.length > 254) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

export function subscriberId(email: string): string {
  return createHash('sha256').update(email).digest('hex')
}

/**
 * Is this plausibly an email address?
 *
 * Deliberately loose. Strict validation of email syntax is famously
 * impossible to get right, and the failure mode of being too strict is
 * turning away a real subscriber with an unusual address — which is worse
 * than storing one row of junk. Anything with a local part, an @, and a
 * dotted domain gets through.
 */
export function looksLikeEmail(value: unknown): value is string {
  return normalizeEmail(value) !== null
}

function toMillis(value: unknown): number | undefined {
  if (value instanceof Timestamp) return value.toMillis()
  return typeof value === 'number' ? value : undefined
}

/** The subset of a stored document the state machine reads. */
function rowOf(data: FirebaseFirestore.DocumentData | undefined): SubscriberRow | null {
  if (!data) return null
  return {
    status: typeof data.status === 'string' ? data.status : undefined,
    confirmTokenHash:
      typeof data.confirmTokenHash === 'string' ? data.confirmTokenHash : undefined,
    confirmTokenExpiresAt: toMillis(data.confirmTokenExpiresAt),
    confirmationSentAt: toMillis(data.confirmationSentAt),
  }
}

export interface SubscribeResult {
  /**
   * True when this deployment CAN email a confirmation link — a property of
   * the deployment, not of this address. It is the same answer for a new,
   * pending or already-confirmed address on purpose: a response that differed
   * would turn the form into an oracle for who is on the list. The
   * per-address truth is `confirmationSent` on the stored row.
   */
  mailConfigured: boolean
}

/**
 * Record a request to join the list, and ask for confirmation.
 *
 * Idempotent, and it never reveals whether the address was already known:
 * see `decideSubscribe` for the transitions. The consent sentence and time
 * are recorded on every genuine request, including a re-submission after an
 * unsubscribe, so the stored text is always what the latest requester saw.
 */
export async function subscribe(input: {
  email: string
  source: string
  consentText: string
}): Promise<SubscribeResult> {
  const email = normalizeEmail(input.email)
  if (!email) throw new Error('subscribe() needs a validated email')

  const mailConfigured = isMailConfigured()
  const ref = adminDb().collection(SUBSCRIBERS_COLLECTION).doc(subscriberId(email))
  const snap = await ref.get()
  const now = Date.now()

  const existing = snap.data()
  const action = decideSubscribe(rowOf(existing), now, mailConfigured)
  if (action.kind === 'noop') return { mailConfigured }

  // Already pending and nothing to send — either inside the resend cooldown
  // or with no transport. Leave the row exactly as it is: rewriting it
  // would clear the token in the email the person received a minute ago.
  if (statusOf(rowOf(existing)) === 'pending' && !action.send) return { mailConfigured }

  // The token is issued only when there is a message to put it in. A token
  // nobody can be told is not a token; see lib/newsletter-state.ts.
  const issued = action.send ? issueToken(now) : null

  // Kept across re-subscription so any unsubscribe link already sitting in
  // an inbox still works.
  const unsubscribeToken =
    (existing?.unsubscribeToken as string | undefined) ??
    randomBytes(24).toString('base64url')

  await ref.set(
    {
      email,
      source: input.source.slice(0, 40),
      status: 'pending',
      consentedTo: input.consentText,
      consentedAt: FieldValue.serverTimestamp(),
      unsubscribeToken,
      unsubscribedAt: FieldValue.delete(),
      // A new token supersedes the old; with none issued, any old hash is
      // cleared so a link from an earlier round cannot confirm this one.
      confirmTokenHash: issued ? issued.hash : FieldValue.delete(),
      confirmTokenExpiresAt: issued
        ? Timestamp.fromMillis(issued.expiresAt)
        : FieldValue.delete(),
      // Not yet true, and reset even where it was true before: a row coming
      // back from 'unsubscribed' has had no confirmation for THIS request.
      // Flipped below, and only after the provider accepts the message.
      confirmationSent: false,
      confirmationSentAt: FieldValue.delete(),
      ...(snap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  )

  if (issued) {
    const mail = confirmationEmail({
      confirmUrl: absoluteUrl(`/api/newsletter/confirm?token=${issued.token}`),
      unsubscribeUrl: absoluteUrl(`/api/newsletter/unsubscribe?token=${unsubscribeToken}`),
    })
    const sent = await sendMail({ to: email, subject: mail.subject, text: mail.text })
    if (sent) {
      await ref.set(
        { confirmationSent: true, confirmationSentAt: FieldValue.serverTimestamp() },
        { merge: true },
      )
    }
  }

  return { mailConfigured }
}

/**
 * Follow a confirmation link.
 *
 * The row is found by the HASH of the presented token, so the raw value
 * never touches a query, a log line or the database. `decideConfirm` then
 * re-verifies it and checks state and expiry.
 *
 * Returns `unavailable` — not a thrown error — when the list cannot be
 * reached, so the page can say "nothing changed, try again" rather than
 * blame the link.
 */
export async function confirmSubscription(
  token: unknown,
): Promise<ConfirmOutcome | 'unavailable'> {
  if (!looksLikeToken(token)) return 'invalid'

  try {
    const matches = await adminDb()
      .collection(SUBSCRIBERS_COLLECTION)
      .where('confirmTokenHash', '==', hashToken(token))
      .limit(1)
      .get()

    const doc = matches.docs[0]
    const outcome = decideConfirm(doc ? rowOf(doc.data()) : null, token, Date.now())

    if (doc && outcome === 'confirmed') {
      await doc.ref.set(
        { status: 'confirmed', confirmedAt: FieldValue.serverTimestamp() },
        { merge: true },
      )
      await mirrorToAudience(String(doc.data().email ?? ''))
    }
    return outcome
  } catch (err) {
    console.error('[newsletter/confirm] failed:', err)
    return 'unavailable'
  }
}

/**
 * Mirror a CONFIRMED subscriber into Resend's audience, when one is set up.
 *
 * Moved here from the signup route. It used to run on submission, which
 * put unconfirmed addresses into the audience a broadcast would go to —
 * exactly the list double opt-in exists to keep them out of. Only
 * confirmation gets an address there now.
 *
 * Best effort: the row is already confirmed, so an outage here must not
 * turn a successful confirmation into an error page.
 */
async function mirrorToAudience(email: string): Promise<void> {
  const key = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!key || !audienceId || !email) return

  try {
    const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, unsubscribed: false }),
    })
    if (!res.ok) console.error('[newsletter] resend audience mirror failed:', res.status)
  } catch (err) {
    console.error('[newsletter] resend audience mirror threw:', err)
  }
}
