/**
 * Send the confirmation email to everyone who is waiting for one.
 *
 *   npx tsx scripts/send-pending-confirmations.mts                   # dry run
 *   npx tsx scripts/send-pending-confirmations.mts --include-legacy  # count them too
 *   npx tsx scripts/send-pending-confirmations.mts --send            # actually mails
 *
 * WHY THIS EXISTS
 *
 * Signing up now records an address as PENDING and emails its owner a
 * confirmation link (lib/newsletter-state.ts). That email needs a sending
 * key, and RESEND_API_KEY is unset in production — so every address
 * collected until one exists is stored as pending with
 * `confirmationSent: false` and nothing is mailed. The forms say exactly
 * that ("We'll email a confirmation link before we send anything"). This is
 * the script that keeps the promise the day a key is set.
 *
 * ── DRY RUN IS THE DEFAULT ──────────────────────────────────────────────
 *
 * Like `send-catalog-digest.mts`: there is no undo on an email, and every
 * address here belongs to a person who has not yet agreed to hear from us.
 * Without `--send` this prints who WOULD be mailed (addresses masked) and
 * changes nothing.
 *
 * ── WHO IS A CANDIDATE ──────────────────────────────────────────────────
 *
 *   pending rows with `confirmationSent !== true` — asked to join, never
 *   got a link because there was no transport or the provider refused.
 *
 *   with --include-legacy: rows written BEFORE double opt-in, which carry
 *   status 'subscribed' or no status. They never confirmed anything and are
 *   not mailed by the digest. Emailing them one confirmation request is the
 *   honest way to find out which of them still want to hear from us; it is
 *   off by default because it is mail to people who signed up under the
 *   old, single-opt-in form, and whether to send it is the owner's call.
 *
 * Never a candidate: confirmed rows, unsubscribed rows, and pending rows
 * that already have `confirmationSent: true` (they have a link; re-sending
 * on a script run would be the same as the resubmit button, without the
 * cooldown that stops it being a mail bomb).
 *
 * ── TOKENS ARE MINTED HERE, NOT READ BACK ───────────────────────────────
 *
 * Only a hash of each confirmation token is stored, so the original cannot
 * be recovered to put in an email. Each candidate gets a FRESH token, the
 * hash of which replaces whatever was there, and the new raw token goes in
 * the message and nowhere else. The hash is written BEFORE the send, so a
 * click can never race ahead of the record that would honour it; if the send
 * fails the row simply stays `confirmationSent: false` and the next run
 * tries again.
 *
 * ── WHAT IT NEEDS TO SEND ───────────────────────────────────────────────
 *
 *   RESEND_API_KEY        the sending key
 *   NEWSLETTER_FROM       e.g. "Hoverlab <hello@hoverlab.dev>"
 *   NEXT_PUBLIC_SITE_URL  the origin the confirm link points at. There is
 *                         deliberately no default: a link to localhost in a
 *                         real inbox is worse than no email.
 *   Firebase Admin        for the subscriber list
 *
 * Any of them missing and `--send` refuses loudly rather than pretending.
 */

import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { randomBytes } from 'node:crypto'
import { adminDb, isAdminConfigured } from '../src/lib/firebase/admin.ts'
import { issueToken, statusOf } from '../src/lib/newsletter-state.ts'
import { confirmationEmail, isMailConfigured, sendMail } from '../src/lib/newsletter-mail.ts'

const argv = process.argv.slice(2)
const SEND = argv.includes('--send')
const INCLUDE_LEGACY = argv.includes('--include-legacy')

const COLLECTION = 'newsletterSubscribers'

/** `jane.doe@example.com` -> `j***@example.com`, for logs that get pasted. */
function mask(email: string): string {
  const [local, domain] = email.split('@')
  return `${(local ?? '').slice(0, 1)}***@${domain ?? ''}`
}

interface Candidate {
  ref: FirebaseFirestore.DocumentReference
  email: string
  legacy: boolean
  unsubscribeToken: string | null
}

async function candidates(): Promise<{ list: Candidate[]; skippedLegacy: number }> {
  // The whole collection, in one read. The list is small, and "rows with no
  // status" cannot be expressed as a Firestore query, so classification has
  // to happen here anyway.
  const snap = await adminDb().collection(COLLECTION).get()
  const list: Candidate[] = []
  let skippedLegacy = 0

  for (const doc of snap.docs) {
    const data = doc.data()
    const email = typeof data.email === 'string' ? data.email : null
    if (!email) continue

    const status = statusOf({ status: typeof data.status === 'string' ? data.status : undefined })
    const unsubscribeToken =
      typeof data.unsubscribeToken === 'string' ? data.unsubscribeToken : null

    if (status === 'pending' && data.confirmationSent !== true) {
      list.push({ ref: doc.ref, email, legacy: false, unsubscribeToken })
    } else if (status === 'legacy') {
      // A legacy row that unsubscribed under the old scheme carries
      // `unsubscribedAt`; never mail it, whatever its status field says.
      if (data.unsubscribedAt) continue
      if (INCLUDE_LEGACY) list.push({ ref: doc.ref, email, legacy: true, unsubscribeToken })
      else skippedLegacy++
    }
  }
  return { list, skippedLegacy }
}

const siteBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function sendOne(person: Candidate): Promise<boolean> {
  const issued = issueToken()
  const unsubscribeToken = person.unsubscribeToken ?? randomBytes(24).toString('base64url')

  // Hash first, send second — see "TOKENS ARE MINTED HERE".
  await person.ref.set(
    {
      status: 'pending',
      unsubscribeToken,
      confirmTokenHash: issued.hash,
      confirmTokenExpiresAt: Timestamp.fromMillis(issued.expiresAt),
      confirmationSent: false,
    },
    { merge: true },
  )

  const mail = confirmationEmail({
    confirmUrl: `${siteBase}/api/newsletter/confirm?token=${issued.token}`,
    unsubscribeUrl: `${siteBase}/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`,
  })
  const ok = await sendMail({
    to: person.email,
    subject: mail.subject,
    text: mail.text,
    headers: {
      'List-Unsubscribe': `<${siteBase}/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  })

  if (ok) {
    await person.ref.set(
      { confirmationSent: true, confirmationSentAt: FieldValue.serverTimestamp() },
      { merge: true },
    )
  }
  return ok
}

async function main(): Promise<void> {
  if (!isAdminConfigured()) {
    console.error('Firebase Admin credentials are not configured, so the list cannot be read.')
    process.exit(1)
  }

  const { list, skippedLegacy } = await candidates()
  const pending = list.filter((c) => !c.legacy).length
  const legacy = list.length - pending

  console.log(`Pending, never sent a link: ${pending}`)
  console.log(
    INCLUDE_LEGACY
      ? `Legacy (pre double opt-in), included:  ${legacy}`
      : `Legacy (pre double opt-in), NOT included: ${skippedLegacy}  (pass --include-legacy to ask them to confirm)`,
  )
  for (const person of list.slice(0, 10)) {
    console.log(`  ${mask(person.email)}${person.legacy ? '  (legacy)' : ''}`)
  }
  if (list.length > 10) console.log(`  ... and ${list.length - 10} more`)
  console.log()

  if (list.length === 0) {
    console.log('Nobody is waiting for a confirmation email.')
    return
  }

  if (!SEND) {
    console.log('Dry run. Nothing was sent and no row was changed.')
    console.log('Re-run with --send to mail them.')
    return
  }

  const missing = [
    !process.env.RESEND_API_KEY && 'RESEND_API_KEY',
    !process.env.NEWSLETTER_FROM && 'NEWSLETTER_FROM',
    !siteBase && 'NEXT_PUBLIC_SITE_URL',
  ].filter(Boolean)
  if (missing.length > 0 || !isMailConfigured()) {
    console.error(`Cannot send: missing ${missing.join(', ') || 'a mail transport'}.`)
    process.exit(1)
  }

  console.log(`Sending ${list.length} confirmation email(s)...`)
  let sent = 0
  for (const person of list) {
    try {
      if (await sendOne(person)) sent++
      else console.error(`  the provider refused ${mask(person.email)}`)
    } catch (err) {
      // One bad row must not strand the rest.
      console.error(`  failed for ${mask(person.email)}:`, err instanceof Error ? err.message : err)
    }
    // Resend allows a couple of requests a second; stay well under it.
    await sleep(600)
  }

  console.log(`Sent ${sent}/${list.length}. Anyone who failed stays pending and is retried on the next run.`)
  if (sent === 0) process.exit(1)
}

main().catch((err) => {
  console.error('[send-pending-confirmations] failed:', err)
  process.exit(1)
})
