/**
 * <EmailProductAnnouncement> — a feature-launch email, as HTML that survives Outlook.
 *
 * `/tools/email` ships the four TRANSACTIONAL emails every product sends
 * (welcome, verify, reset, receipt) — one action, no marketing. This is the
 * other half: an email you send to a whole list on purpose, which is a
 * different design problem with different obligations.
 *
 * WHAT A MARKETING EMAIL CARRIES THAT A TRANSACTIONAL ONE DOES NOT.
 * `/tools/email`'s footer is one line because a receipt owes the reader
 * nothing but the receipt. This one is sent to people who did not ask for
 * this specific message, so the footer carries a physical postal address and
 * an unsubscribe link — required by CAN-SPAM in the US and expected by GDPR
 * consent rules in the EU, and the two lines a compliance review checks
 * first on any email a customer forwards to their legal team.
 *
 * THE MARKUP IS THE SAME DISCIPLINE AS `/tools/email`, restated because it
 * still is not optional: nested `<table role="presentation">`s rather than
 * flexbox, because Outlook renders through Word's layout engine and ignores
 * it; inline styles rather than a `<style>` block, because Gmail strips
 * `<style>` in some contexts; a hidden preheader `<div>` before the visible
 * body, because that is the grey line an inbox list shows after the subject
 * and the alternative is the client guessing from your first heading.
 *
 * `role="presentation"` on every layout table is not decoration — it is
 * what stops a screen reader announcing "table, 1 column, 1 row" before
 * every section of an email that has no tabular data in it at all.
 *
 * PREVIEWED IN A SANDBOXED IFRAME, srcDoc rather than a rendered `<table>`
 * on this page. Two reasons: the email's inline styles must not leak onto
 * or inherit from the surrounding catalog page, and this is the same
 * document a recipient's mail client actually parses — a `<table>` written
 * as JSX on this page would prove the layout renders in a browser, which is
 * not the same claim as "this HTML survives Outlook".
 */

const BRAND = 'Acme'
const SITE_URL = 'https://acme.com'
const ACCENT = '#6366f1'
const POSTAL_ADDRESS = '548 Market Street, PMB 12345, San Francisco, CA 94104'

const SUBJECT = `Introducing Workflows — automate the parts of ${BRAND} you repeat`
const PREHEADER = 'Set a trigger once, and Acme does the rest from now on.'

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
            <td style="padding: 28px 32px 0;">
              <div style="display: inline-block; padding: 4px 10px; border-radius: 999px; background-color: ${ACCENT}1a; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: ${ACCENT};">
                New
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 12px 32px 0;">
              <h1 style="margin: 0; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 26px; line-height: 1.3; font-weight: 700; color: #18181b;">
                Workflows: set a trigger once
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 12px 32px 0;">
              <p style="margin: 0; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; color: #52525b;">
                You have told us the same thing three different ways: the busywork between two ${BRAND} actions is the part nobody wants to do by hand. Workflows watches for an event and runs the next step for you — no code, no Zapier account, no third tool to keep signed into.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e4e4e7; border-radius: 10px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 14px; font-weight: 700; color: #18181b;">
                      "New invoice paid" &rarr; "Add to accounting export"
                    </div>
                    <div style="margin-top: 4px; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 13px; line-height: 1.5; color: #71717a;">
                      One of ninety starting templates. Yours is already running for three of your teammates.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 28px 32px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="${ACCENT}" style="border-radius: 8px;">
                    <a href="${SITE_URL}/workflows/new"
                       style="display: inline-block; padding: 12px 24px; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      Build your first workflow
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 32px 32px;">
              <div style="border-top: 1px solid #e4e4e7; padding-top: 16px; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 12px; line-height: 1.6; color: #a1a1aa;">
                You are receiving this because you have a ${BRAND} account and opted in to product updates.
                <a href="${SITE_URL}/preferences" style="color: #71717a;">Update your preferences</a>
                &nbsp;or&nbsp;
                <a href="${SITE_URL}/unsubscribe?list=product-updates" style="color: #71717a;">unsubscribe</a>.
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

export function EmailProductAnnouncement() {
  const html = buildEmailHtml()

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">Subject:</span> {SUBJECT}
        </span>
        <span className="text-muted-foreground/80">{PREHEADER}</span>
      </div>
      {/*
        Sandboxed: this is untrusted-shaped content rendered as a document,
        and an iframe is also the only honest preview — the email's own
        styles must not inherit anything from the catalog page around it.
      */}
      <iframe
        title={`${SUBJECT} — email preview`}
        srcDoc={html}
        sandbox=""
        className="h-[620px] w-full rounded-xl border border-border/60 bg-white"
      />
    </div>
  )
}
