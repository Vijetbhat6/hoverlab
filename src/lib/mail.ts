/**
 * Transactional email.
 *
 * Resend is called over plain `fetch` rather than through its SDK — the API
 * is one POST, and skipping the dependency keeps this importable from any
 * runtime.
 *
 * Following the same rule as analytics and billing: a missing key disables
 * sending instead of erroring. In development that means the message is
 * written to the server console, which is what makes the password reset flow
 * usable locally with no mail account at all — the reset link is right there
 * in the terminal running `npm run dev`.
 *
 * Set RESEND_API_KEY and EMAIL_FROM to send for real.
 */

export interface MailMessage {
  to: string
  subject: string
  /** Plain-text body. Also used as the fallback part of the HTML mail. */
  text: string
  html?: string
}

export type MailResult =
  | { delivered: true }
  /** Not sent. `reason` is for server logs, never for the HTTP response. */
  | { delivered: false; reason: string }

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

export async function sendMail(msg: MailMessage): Promise<MailResult> {
  if (!isMailConfigured()) {
    const reason = 'RESEND_API_KEY / EMAIL_FROM not set'
    if (process.env.NODE_ENV === 'production') {
      // Loud, because in production this means a user asked for a reset
      // email and will never receive one.
      console.error(`[mail] NOT SENT (${reason}) → ${msg.to}: ${msg.subject}`)
    } else {
      console.log(
        `\n[mail] ${reason} — printing instead of sending.\n` +
          `  to:      ${msg.to}\n` +
          `  subject: ${msg.subject}\n` +
          `${msg.text.replace(/^/gm, '  ')}\n`,
      )
    }
    return { delivered: false, reason }
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [msg.to],
        subject: msg.subject,
        text: msg.text,
        ...(msg.html ? { html: msg.html } : {}),
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`[mail] Resend responded ${res.status}: ${detail.slice(0, 500)}`)
      return { delivered: false, reason: `resend ${res.status}` }
    }
    return { delivered: true }
  } catch (err) {
    console.error('[mail] send failed:', err)
    return { delivered: false, reason: 'network error' }
  }
}
