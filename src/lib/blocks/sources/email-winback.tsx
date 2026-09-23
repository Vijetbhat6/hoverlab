/**
 * <EmailWinback> — a re-engagement email to a dormant account, as HTML that
 * survives Outlook.
 *
 * The layout problem specific to a win-back: the reader has already decided
 * this product is not worth their time, so the email cannot open by asking
 * for more of it. It opens with the ONE reason they might be wrong — a
 * fact about their own account, not a feature list — and asks for the
 * smallest possible action: a single question with two answers, not a
 * click straight back into a product they stopped opening. A "yes, still
 * interested" that costs one tap is the whole design, because a win-back
 * that leads with the upsell is indistinguishable from the promo that
 * follows it into the same folder.
 *
 * See `email-product-announcement.tsx` for why the markup is nested
 * `<table role="presentation">`s and inline styles rather than flexbox and
 * a `<style>` block, why the footer carries a postal address and an
 * unsubscribe link, and why the preview is a sandboxed iframe rather than a
 * `<table>` rendered as JSX on this page.
 *
 * THE UNSUBSCRIBE LINK IS NOT SMALLER OR GREYER THAN USUAL. Sending to a
 * dormant list is exactly the send most likely to be marked as spam rather
 * than unsubscribed from, which costs sender reputation for every other
 * email a mailbox provider decides whether to deliver. Making the opt-out
 * easy to find is a deliverability decision here, not only a legal one.
 */

const BRAND = 'Acme'
const SITE_URL = 'https://acme.com'
const ACCENT = '#6366f1'
const POSTAL_ADDRESS = '548 Market Street, PMB 12345, San Francisco, CA 94104'
const LAST_ACTIVE = '4 months ago'

const SUBJECT = 'Your 1,204 saved items are still there'
const PREHEADER = "We have not changed anything without telling you — here's what's waiting."

function buildEmailHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${SUBJECT}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
    ${PREHEADER}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="padding: 32px 32px 0;">
              <div style="font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 18px; font-weight: 700; color: #18181b;">
                ${BRAND}
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 32px 0;">
              <h1 style="margin: 0; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 22px; line-height: 1.35; font-weight: 700; color: #18181b;">
                Your 1,204 saved items are still there
              </h1>
              <p style="margin: 12px 0 0; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; color: #52525b;">
                You have not opened ${BRAND} since ${LAST_ACTIVE}, and we have not deleted anything in the meantime. Before your account moves to our free tier's storage limit, we wanted to ask a smaller question than "come back": is this still useful to you at all?
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e4e4e7; border-radius: 10px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="50%" align="center" bgcolor="${ACCENT}" style="border-radius: 8px;">
                          <a href="${SITE_URL}/login?ref=winback-yes"
                             style="display: block; padding: 11px 16px; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                            Still interested
                          </a>
                        </td>
                        <td width="12"></td>
                        <td width="50%" align="center" style="border: 1px solid #e4e4e7; border-radius: 8px;">
                          <a href="${SITE_URL}/feedback/churn?ref=winback-no"
                             style="display: block; padding: 11px 16px; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 14px; font-weight: 600; color: #52525b; text-decoration: none; border-radius: 8px;">
                            Not anymore
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 32px 0;">
              <p style="margin: 0; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 13px; line-height: 1.6; color: #71717a;">
                Either answer is useful to us, and neither commits you to anything today. If it was something specific that did not work, "not anymore" takes you to a two-question form — we read every one.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 32px 32px;">
              <div style="border-top: 1px solid #e4e4e7; padding-top: 16px; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 12px; line-height: 1.6; color: #a1a1aa;">
                You are getting this because your ${BRAND} account has been inactive for a while.
                <a href="${SITE_URL}/preferences" style="color: #71717a; font-weight: 600;">Update your preferences</a>
                &nbsp;or&nbsp;
                <a href="${SITE_URL}/unsubscribe?list=winback" style="color: #71717a; font-weight: 600;">unsubscribe from these emails</a>.
                <br /><br />
                ${BRAND}, ${POSTAL_ADDRESS}
              </div>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`
}

export function EmailWinback() {
  const html = buildEmailHtml()

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">Subject:</span> {SUBJECT}
        </span>
        <span className="text-muted-foreground/80">{PREHEADER}</span>
      </div>
      <iframe
        title={`${SUBJECT} — email preview`}
        srcDoc={html}
        sandbox=""
        className="h-[600px] w-full rounded-xl border border-border/60 bg-white"
      />
    </div>
  )
}
