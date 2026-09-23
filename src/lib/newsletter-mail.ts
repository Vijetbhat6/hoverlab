/**
 * The one email transport the mailing list has: Resend, over fetch.
 *
 * Nothing is installed and no SDK is imported — `scripts/send-catalog-
 * digest.mts` already talks to `api.resend.com/emails` this way, and this
 * is the same call lifted out so the route that sends the confirmation and
 * the script that re-sends pending ones say it once.
 *
 * ── HONESTY ABOUT WHETHER MAIL CAN GO OUT ──────────────────────────────
 *
 * RESEND_API_KEY is unset in production today, so `isMailConfigured()` is
 * false and NO EMAIL LEAVES THIS APPLICATION — not the confirmation, not
 * the digest, not a sequence. That is a fact the product copy has to be
 * built around rather than paper over: the signup form must not say "check
 * your inbox" while no inbox will ever receive anything. Every caller asks
 * `isMailConfigured()` and records what actually happened
 * (`confirmationSent`), so the stored state is true even when the
 * transport is not.
 *
 * Both variables are required. A key with no `NEWSLETTER_FROM` cannot
 * produce a valid message (Resend rejects a missing or unverified sender),
 * so counting it as configured would be the same lie one step later.
 *
 * Pure module: no `server-only`, no Firestore. Scripts run under plain tsx
 * and cannot import a module that throws unless a bundler condition is set.
 */

/** True when a message could actually be handed to the provider. */
export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.NEWSLETTER_FROM)
}

export interface OutgoingMail {
  to: string
  subject: string
  text: string
  headers?: Record<string, string>
}

/**
 * Hand one message to Resend. Never throws; returns whether it was
 * accepted.
 *
 * Best effort by design. The caller has already recorded the address, and a
 * provider outage must not turn into a failed signup for the visitor — the
 * row simply stays `confirmationSent: false` and the resend script picks it
 * up. A failure is logged with the status only, never the address.
 */
export async function sendMail(mail: OutgoingMail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.NEWSLETTER_FROM
  if (!key || !from) return false

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        ...(mail.headers ? { headers: mail.headers } : {}),
      }),
    })
    if (!res.ok) console.error('[newsletter-mail] resend rejected the message:', res.status)
    return res.ok
  } catch (err) {
    console.error('[newsletter-mail] resend request failed:', err instanceof Error ? err.message : err)
    return false
  }
}

/**
 * The confirmation email.
 *
 * Plain text, like every other message this project composes: it renders
 * the same everywhere and has nothing for a spam filter to score. It says
 * what will and will not happen, because the person reading it did not
 * necessarily remember filling in a form, and "if this wasn't you, ignore
 * it" is the sentence that makes the whole scheme safe.
 */
export function confirmationEmail(links: {
  confirmUrl: string
  unsubscribeUrl: string
}): { subject: string; text: string } {
  return {
    subject: 'Confirm your Hoverlab subscription',
    text: `Someone — hopefully you — asked for this address to be added to the
Hoverlab mailing list.

To confirm, open this link:

  ${links.confirmUrl}

Until you do, we will not send you anything else. The link works for seven
days. If it was not you, do nothing and this address is never mailed.

If you have already confirmed and would rather leave, one click does it:

  ${links.unsubscribeUrl}

Hoverlab
`,
  }
}
