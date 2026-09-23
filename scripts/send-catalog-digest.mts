/**
 * Send the "something landed" email, or say why there is nothing to send.
 *
 *   npx tsx scripts/send-catalog-digest.mts                  # dry run
 *   npx tsx scripts/send-catalog-digest.mts --since 2026-09-01
 *   npx tsx scripts/send-catalog-digest.mts --send           # actually mails
 *
 * WHY THIS IS A SCRIPT AND NOT A CRON ROUTE
 *
 * Because the trigger is "a wave shipped", and a wave shipping is a deploy.
 * A weekly cron would mail the list on weeks with nothing in them — which
 * `composeDigest` refuses to compose, so the cron would mostly do nothing,
 * and the one week it mattered it would be up to seven days late. Running it
 * from the same place the deploy runs from means the email goes out when the
 * thing it is about goes out.
 *
 * It is also why this is not wired into `prebuild`. A build is not a deploy:
 * previews build, CI builds, and a local `npm run build` builds. Mailing a
 * list from any of those is the kind of mistake you only make once.
 *
 * ── DRY RUN IS THE DEFAULT, AND THAT IS NOT CAUTION THEATRE ─────────────
 *
 * Without `--send` this prints the exact email and the exact recipient count
 * and exits. There is no undo on a send, the list is small enough that every
 * address is a real person who opted in, and the failure mode of a bad
 * digest is not an error message — it is a correct-looking email about the
 * wrong window. Reading it once costs nothing.
 *
 * ── THE WATERMARK ───────────────────────────────────────────────────────
 *
 * One Firestore document, `newsletterState/catalogDigest`, holding the last
 * date successfully sent. It is advanced ONLY after Resend accepts the send,
 * so a failure half way through re-sends rather than skipping — duplicates
 * are recoverable and a silently skipped wave is not.
 *
 * `composeDigest` treats the watermark as exclusive, so a second run with an
 * un-advanced watermark composes null and mails nothing. That is the
 * property that makes re-running safe, and `newsletter-digest.test.ts`
 * asserts it.
 *
 * ── WHAT IT NEEDS TO ACTUALLY SEND ──────────────────────────────────────
 *
 *   RESEND_API_KEY     the sending key
 *   NEWSLETTER_FROM    e.g. "Hoverlab <hello@hoverlab.dev>"
 *   Firebase Admin     for the subscriber list and the watermark
 *
 * Any of them missing and `--send` refuses loudly rather than pretending.
 *
 * ── WHO GETS IT: CONFIRMED SUBSCRIBERS ONLY ─────────────────────────────
 *
 * The list is double opt-in (lib/newsletter-state.ts). This mails rows whose
 * status is exactly 'confirmed' — not 'pending', not 'unsubscribed', and not
 * the rows written before double opt-in existed, which carry status
 * 'subscribed' or none. Those never confirmed anything, so they are counted
 * and reported below rather than mailed. `scripts/send-pending-confirmations
 * .mts` is how they get the chance to confirm.
 */

import { composeDigest } from '../src/lib/newsletter-digest.ts'
import { adminDb, isAdminConfigured } from '../src/lib/firebase/admin.ts'
import { canReceiveMail } from '../src/lib/newsletter-state.ts'

const argv = process.argv.slice(2)
const SEND = argv.includes('--send')

/** `--since 2026-09-01`, overriding the stored watermark. */
function sinceFlag(): string | null {
  const index = argv.indexOf('--since')
  if (index === -1) return null
  const value = argv[index + 1]
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    console.error('--since needs an ISO date, e.g. --since 2026-09-01')
    process.exit(2)
  }
  return value
}

const STATE_DOC = 'newsletterState/catalogDigest'
const SUBSCRIBERS = 'newsletterSubscribers'

async function readWatermark(): Promise<string | null> {
  if (!isAdminConfigured()) return null
  const snap = await adminDb().doc(STATE_DOC).get()
  const value = snap.data()?.lastSent
  return typeof value === 'string' ? value : null
}

async function advanceWatermark(until: string): Promise<void> {
  await adminDb()
    .doc(STATE_DOC)
    .set({ lastSent: until, updatedAt: new Date().toISOString() }, { merge: true })
}

/**
 * Everyone who has CONFIRMED, with the token their unsubscribe link needs.
 *
 * Filtered on status in the query rather than fetched whole and filtered
 * here, because "confirmed" has to mean confirmed at the point of sending —
 * and re-checked per row with `canReceiveMail`, the one predicate every
 * sender shares, so a change to what may be mailed is made in one place.
 * A subscriber with no token is skipped rather than mailed a broken link:
 * the promise in the consent text is one-click unsubscribe, and an email
 * that cannot honour it should not go out.
 */
async function recipients(): Promise<{ email: string; token: string }[]> {
  const snap = await adminDb()
    .collection(SUBSCRIBERS)
    .where('status', '==', 'confirmed')
    .get()

  const out: { email: string; token: string }[] = []
  let missingToken = 0

  for (const doc of snap.docs) {
    const data = doc.data()
    if (!canReceiveMail({ status: typeof data.status === 'string' ? data.status : undefined })) {
      continue
    }
    const email = typeof data.email === 'string' ? data.email : null
    const token = typeof data.unsubscribeToken === 'string' ? data.unsubscribeToken : null
    if (!email) continue
    if (!token) {
      missingToken++
      continue
    }
    out.push({ email, token })
  }

  if (missingToken > 0) {
    console.warn(
      `  ${missingToken} subscriber(s) skipped: no unsubscribe token, so the ` +
        'one-click promise in their recorded consent could not be kept.',
    )
  }

  return out
}

/**
 * A one-line account of who would receive this and who would not.
 *
 * Printed on the dry run so the number is seen BEFORE `--send`, and so the
 * gap between "on the list" and "will be mailed" is never a surprise: until
 * people confirm, that gap is most of the list.
 */
async function audienceSummary(): Promise<string> {
  if (!isAdminConfigured()) {
    return 'Audience: unknown here (Firebase Admin credentials are not configured).'
  }
  const snap = await adminDb().collection(SUBSCRIBERS).select('status').get()
  const counts = { confirmed: 0, pending: 0, unsubscribed: 0, legacy: 0 }
  for (const doc of snap.docs) {
    const status = doc.data().status
    if (status === 'confirmed' || status === 'pending' || status === 'unsubscribed') {
      counts[status]++
    } else {
      counts.legacy++
    }
  }
  return (
    `Audience: ${counts.confirmed} confirmed (would be mailed); ` +
    `${counts.pending} pending and ${counts.legacy} legacy unconfirmed (would NOT); ` +
    `${counts.unsubscribed} unsubscribed.`
  )
}

const siteBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://hoverlab.dev'

/**
 * One request per recipient.
 *
 * Not a single send with everybody in `bcc`, because each body carries that
 * person's own unsubscribe token — a shared bcc would either drop the link
 * or hand everyone the same one, and the same one unsubscribes whoever it
 * belongs to rather than whoever clicked.
 *
 * Sequential rather than parallel. The list is small, Resend rate-limits,
 * and a burst of a thousand parallel fetches would fail a portion of them
 * for no gain in wall-clock time that matters here.
 */
async function send(
  digest: { subject: string; text: string },
  to: { email: string; token: string }[],
): Promise<number> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.NEWSLETTER_FROM
  let sent = 0

  for (const person of to) {
    const body = digest.text.replace(
      '{{unsubscribe_url}}',
      `${siteBase}/api/newsletter/unsubscribe?token=${encodeURIComponent(person.token)}`,
    )

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: person.email,
        subject: digest.subject,
        text: body,
        // Mail clients and Gmail's bulk-sender rules both want this, and it
        // is the same one-click endpoint as the link in the body.
        headers: {
          'List-Unsubscribe': `<${siteBase}/api/newsletter/unsubscribe?token=${encodeURIComponent(person.token)}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    })

    if (res.ok) {
      sent++
    } else {
      // Logged and continued rather than thrown: one bad address must not
      // strand the rest of the list, and the watermark only advances if at
      // least something went out.
      console.error(`  failed for ${person.email}: ${res.status}`)
    }
  }

  return sent
}

async function main(): Promise<void> {
  const since = sinceFlag() ?? (await readWatermark())

  if (!since) {
    console.error(
      'No watermark and no --since. Refusing to guess a window: without one this\n' +
        'would mail the entire history of the catalog to everybody.\n\n' +
        'Pass --since YYYY-MM-DD for the first run. It is exclusive, so use the\n' +
        'date of the last wave you do NOT want included.',
    )
    process.exit(2)
  }

  const digest = composeDigest(since)

  if (!digest) {
    // The expected outcome most of the time, and a success. See the docblock
    // in lib/newsletter-digest.ts about why silence is the correct output.
    console.log(`Nothing has landed since ${since}. No email to send.`)
    return
  }

  console.log(`Window: after ${digest.since}, through ${digest.until}`)
  console.log(`Subject: ${digest.subject}`)
  console.log(`Items:   ${digest.itemCount}\n`)
  console.log(digest.text)
  console.log()

  console.log(await audienceSummary())
  console.log()

  if (!SEND) {
    console.log('Dry run. Nothing was sent and the watermark did not move.')
    console.log('Re-run with --send to mail it.')
    return
  }

  const missing = [
    !process.env.RESEND_API_KEY && 'RESEND_API_KEY',
    !process.env.NEWSLETTER_FROM && 'NEWSLETTER_FROM',
    !isAdminConfigured() && 'Firebase Admin credentials',
  ].filter(Boolean)

  if (missing.length > 0) {
    console.error(`Cannot send: missing ${missing.join(', ')}.`)
    process.exit(1)
  }

  const to = await recipients()
  if (to.length === 0) {
    console.log('Nobody is subscribed. Nothing sent, watermark not moved.')
    return
  }

  console.log(`Sending to ${to.length} subscriber(s)…`)
  const sent = await send(digest, to)

  if (sent === 0) {
    console.error('Every send failed. Watermark not moved, so this wave can be retried.')
    process.exit(1)
  }

  await advanceWatermark(digest.until)
  console.log(`Sent ${sent}/${to.length}. Watermark moved to ${digest.until}.`)
}

main().catch((err) => {
  console.error('[send-catalog-digest] failed:', err)
  process.exit(1)
})
