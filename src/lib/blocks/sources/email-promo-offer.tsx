/**
 * <EmailPromoOffer> — a time-boxed discount email, as HTML that survives Outlook.
 *
 * The layout problem specific to a promo: a single number has to read as
 * the whole email from an inbox thumbnail, because that is genuinely most
 * of what decides whether it gets opened. So the discount sits alone at
 * the top in oversized type, before the headline that explains it — the
 * opposite reading order from `email-product-announcement`, where the
 * headline comes first and the detail earns the click.
 *
 * A discount code is set in a MONOSPACE font-family and letter-spaced, so
 * `S4V3-20` cannot be misread as `54V3-2O` when it is copied out of an
 * inbox rather than clicked from the button beside it — the two ways a
 * recipient actually uses one.
 *
 * See `email-product-announcement.tsx` for why the markup is nested
 * `<table role="presentation">`s and inline styles rather than flexbox and
 * a `<style>` block, why the footer carries a postal address and an
 * unsubscribe link, and why the preview is a sandboxed iframe rather than a
 * `<table>` rendered as JSX on this page.
 *
 * THE EXPIRY IS A DATE STRING, NOT A LIVE COUNTDOWN. Email has no
 * JavaScript to update a timer after delivery, and most clients cache
 * images — a countdown gif frozen at "3 days left" a week after send is a
 * dishonest email, not an urgent one. State the deadline and let the
 * reader do the subtraction.
 */

const BRAND = 'Acme'
const SITE_URL = 'https://acme.com'
const ACCENT = '#dc2626'
const POSTAL_ADDRESS = '548 Market Street, PMB 12345, San Francisco, CA 94104'
const CODE = 'SAVE20'
const EXPIRES = 'Ends 30 September, 11:59pm your time'

const SUBJECT = '20% off Pro, through the end of the month'
const PREHEADER = `Use ${CODE} at checkout — ${EXPIRES.toLowerCase()}.`

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
            <td align="center" bgcolor="${ACCENT}" style="padding: 28px 32px;">
              <div style="font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 40px; font-weight: 800; letter-spacing: -0.01em; color: #ffffff;">
                20% off
              </div>
              <div style="margin-top: 4px; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 13px; font-weight: 600; color: #fecaca;">
                ${EXPIRES}
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 28px 32px 0;">
              <h1 style="margin: 0; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 22px; line-height: 1.3; font-weight: 700; color: #18181b;">
                One month left on your Pro trial. Make it permanent for less.
              </h1>
              <p style="margin: 12px 0 0; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; color: #52525b;">
                This is the price we send once a year, and only to accounts that already know what Pro does for them. Apply it at checkout — it stacks with nothing else, so there is no better time to switch off the free plan.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px dashed #d4d4d8; border-radius: 10px;">
                <tr>
                  <td align="center" style="padding: 16px;">
                    <div style="font-family: 'SFMono-Regular', Consolas, monospace; font-size: 20px; font-weight: 700; letter-spacing: 0.08em; color: #18181b;">
                      ${CODE}
                    </div>
                    <div style="margin-top: 2px; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 12px; color: #a1a1aa;">
                      Applies automatically from the button below
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 32px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" bgcolor="${ACCENT}" style="border-radius: 8px;">
                    <a href="${SITE_URL}/upgrade?code=${CODE}"
                       style="display: block; padding: 14px 24px; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      Upgrade to Pro — 20% off
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 16px 32px 32px;">
              <p style="margin: 0; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 12px; line-height: 1.6; color: #a1a1aa;">
                One redemption per account. Cannot be combined with another offer or applied retroactively to an existing annual plan.
              </p>
              <div style="border-top: 1px solid #e4e4e7; margin-top: 16px; padding-top: 16px; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 12px; line-height: 1.6; color: #a1a1aa;">
                You are getting this because you have an active ${BRAND} trial.
                <a href="${SITE_URL}/preferences" style="color: #71717a;">Update your preferences</a>
                &nbsp;or&nbsp;
                <a href="${SITE_URL}/unsubscribe?list=offers" style="color: #71717a;">unsubscribe</a>.
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

export function EmailPromoOffer() {
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
        className="h-[660px] w-full rounded-xl border border-border/60 bg-white"
      />
    </div>
  )
}
