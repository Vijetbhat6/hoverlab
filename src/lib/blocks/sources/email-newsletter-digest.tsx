/**
 * <EmailNewsletterDigest> — a periodic roundup email, as HTML that survives Outlook.
 *
 * The layout problem a digest has that `email-product-announcement` does
 * not: several unrelated stories in one message, each competing for the
 * same three seconds of attention a recipient gives an email before
 * archiving it. So every item gets the same shape — a small kicker, one
 * bold line, one line of summary, nothing else — repetition a reader can
 * scan in order rather than a wall of paragraphs they have to parse one at
 * a time to find the one story they care about.
 *
 * See `email-product-announcement.tsx` for why the markup is nested
 * `<table role="presentation">`s and inline styles rather than flexbox and
 * a `<style>` block, why the footer carries a postal address and an
 * unsubscribe link, and why the preview is a sandboxed iframe rather than a
 * `<table>` rendered as JSX on this page.
 *
 * THE DIVIDER BETWEEN ITEMS IS A `<tr>` WITH A BORDER, NOT A GAP. Email
 * clients disagree about `border-spacing` and inconsistently collapse
 * margins between table rows, so the reliable way to draw a rule between
 * two stories is a `border-top` on the row that follows, the same
 * technique the footer's divider already uses one row down.
 */

const BRAND = 'Acme'
const SITE_URL = 'https://acme.com'
const ACCENT = '#6366f1'
const POSTAL_ADDRESS = '548 Market Street, PMB 12345, San Francisco, CA 94104'
const ISSUE = 'Issue 42 — September 2026'

const SUBJECT = `${ISSUE}: what shipped, what we learned, one thing to try`
const PREHEADER = 'Three things from this month, in the order we would read them ourselves.'

interface Story {
  kicker: string
  title: string
  summary: string
  href: string
}

const STORIES: Story[] = [
  {
    kicker: 'Shipped',
    title: 'Workflows is out of beta',
    summary:
      'Automate the step between two Acme actions — no code, and it runs on your existing plan.',
    href: `${SITE_URL}/changelog/workflows`,
  },
  {
    kicker: 'From the team',
    title: 'Why we rebuilt search from scratch',
    summary:
      'The old index answered in 400ms on a good day. The new one answers in 40 — here is what changed underneath.',
    href: `${SITE_URL}/blog/search-rebuild`,
  },
  {
    kicker: 'Worth trying',
    title: 'Keyboard shortcuts most people never turn on',
    summary: 'Five minutes with Cmd+K removes the mouse from your busiest hour of the day.',
    href: `${SITE_URL}/docs/shortcuts`,
  },
]

function buildEmailHtml(): string {
  const rows = STORIES.map(
    (story, i) => `
                <tr>
                  <td style="padding: ${i === 0 ? '0' : '20px'} 0 0; ${i > 0 ? 'border-top: 1px solid #e4e4e7;' : ''}">
                    <div style="${i > 0 ? 'padding-top: 20px;' : ''} font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: ${ACCENT};">
                      ${story.kicker}
                    </div>
                    <a href="${story.href}" style="display: block; margin-top: 4px; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 17px; font-weight: 700; color: #18181b; text-decoration: none;">
                      ${story.title}
                    </a>
                    <p style="margin: 6px 0 0; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6; color: #52525b;">
                      ${story.summary}
                    </p>
                    <a href="${story.href}" style="display: inline-block; margin-top: 8px; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 13px; font-weight: 600; color: ${ACCENT}; text-decoration: none;">
                      Read more &rarr;
                    </a>
                  </td>
                </tr>`,
  ).join('')

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
              <div style="font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #a1a1aa;">
                ${BRAND} &middot; ${ISSUE}
              </div>
              <h1 style="margin: 6px 0 0; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 22px; line-height: 1.3; font-weight: 700; color: #18181b;">
                What shipped, and one thing to try
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${rows}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 32px 32px;">
              <div style="border-top: 1px solid #e4e4e7; padding-top: 16px; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 12px; line-height: 1.6; color: #a1a1aa;">
                You get this because you subscribed to the ${BRAND} monthly digest.
                <a href="${SITE_URL}/preferences" style="color: #71717a;">Change how often we email you</a>
                &nbsp;or&nbsp;
                <a href="${SITE_URL}/unsubscribe?list=digest" style="color: #71717a;">unsubscribe</a>.
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

export function EmailNewsletterDigest() {
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
        className="h-[700px] w-full rounded-xl border border-border/60 bg-white"
      />
    </div>
  )
}
