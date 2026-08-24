import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

/**
 * The mailing list.
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
 * The form that fed this used to be a `setTimeout` that showed a success
 * tick and threw the address away. That is worse than having no form: it
 * asked people for something, told them it worked, and kept nothing.
 *
 * Firestore layout:
 *   subscribers/{sha256(email)}
 *     { email, source, createdAt, confirmed, unsubscribeToken, unsubscribedAt }
 *
 * The document id is a hash of the lowercased address, which makes signing
 * up twice idempotent without a query. The address itself is stored in the
 * document because a list you cannot read is not a list.
 *
 * WHAT IS NOT BUILT: sending. There is no mail provider wired up, so this
 * collects and holds and nothing goes out yet. That is a deferred promise
 * rather than a broken one, and the copy on the form is written to match —
 * it says what the email will be when it comes, not that one is coming
 * tomorrow. Wire a provider before the first send, and honour
 * `unsubscribedAt` when you do.
 */

export interface SubscribeResult {
  /** False when the address was already on the list. */
  created: boolean
}

/** Normalise for both the hash and storage, so one address is one row. */
function normalize(email: string): string {
  return email.trim().toLowerCase()
}

function idFor(email: string): string {
  return createHash('sha256').update(normalize(email)).digest('hex')
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
  if (typeof value !== 'string') return false
  const email = value.trim()
  if (email.length < 6 || email.length > 254) return false
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email)
}

/**
 * Add an address to the list.
 *
 * Re-subscribing clears `unsubscribedAt` — someone typing their address
 * into the form is asking to be on the list, whatever they did last year,
 * and leaving them marked unsubscribed would silently drop them.
 *
 * `createdAt` is only set on first write, so the original signup date
 * survives a second submission.
 */
export async function addSubscriber(
  rawEmail: string,
  source: string,
): Promise<SubscribeResult> {
  const email = normalize(rawEmail)
  const ref = adminDb().collection('subscribers').doc(idFor(email))

  const existing = await ref.get()

  await ref.set(
    {
      email,
      source: source.slice(0, 40),
      // Not a confirmation flow — there is no mail provider to send one
      // with. Recorded as false so a double opt-in can be added later
      // without having to guess who had already agreed to what.
      confirmed: false,
      unsubscribeToken: existing.exists
        ? (existing.data()?.unsubscribeToken ?? randomBytes(16).toString('hex'))
        : randomBytes(16).toString('hex'),
      unsubscribedAt: FieldValue.delete(),
      ...(existing.exists ? {} : { createdAt: Timestamp.now() }),
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  )

  return { created: !existing.exists }
}
