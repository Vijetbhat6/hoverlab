'use client'

/**
 * Transactional email templates.
 *
 * The four emails every product has to send, as HTML that survives Outlook.
 *
 * This is the one place in the catalog where the modern advice is wrong.
 * Everything else here is flexbox, grid and utility classes; email is
 * nested tables, inline styles and a 600px fixed width, because Outlook
 * renders through Word's layout engine and Gmail strips <style> blocks in
 * some clients. Writing these the way the rest of the site is written
 * produces something that looks perfect in a browser preview and broken in
 * a third of inboxes.
 *
 * So: tables, inline styles, no external images, and a plain-text version
 * beside each one — spam filters treat a missing text/plain part as a
 * signal, and some people genuinely read mail as text.
 */

import * as React from 'react'
import { Mail } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'hoverlab:tool:email'

interface EmailState {
  brand: string
  accent: string
  url: string
}

const DEFAULT_STATE: EmailState = {
  brand: 'Acme',
  accent: '#6366f1',
  url: 'https://acme.com',
}

type TemplateId = 'welcome' | 'verify' | 'reset' | 'receipt'

interface Template {
  id: TemplateId
  name: string
  subject: string
  blurb: string
  /** Preheader — the grey line after the subject in an inbox list. */
  preheader: string
  heading: string
  body: string[]
  cta: { label: string; path: string } | null
  footer: string
}

const TEMPLATES: Template[] = [
  {
    id: 'welcome',
    name: 'Welcome',
    subject: 'Welcome to {brand}',
    blurb: 'The first email. One action, not a tour.',
    preheader: 'Your account is ready — here is the one thing to do first.',
    heading: 'Welcome to {brand}',
    body: [
      'Your account is ready. The fastest way to see whether this is useful is to create your first project — it takes about a minute.',
      'If you get stuck, reply to this email. It goes to a person.',
    ],
    cta: { label: 'Create your first project', path: '/new' },
    footer: 'You are receiving this because you signed up for {brand}.',
  },
  {
    id: 'verify',
    name: 'Verify email',
    subject: 'Confirm your email address',
    blurb: 'One link, no marketing. Anything else lowers the click rate.',
    preheader: 'Confirm your address to finish setting up your account.',
    heading: 'Confirm your email',
    body: [
      'Click the button below to confirm this address and finish setting up your account.',
      'This link expires in 24 hours. If you did not create an account, you can ignore this email.',
    ],
    cta: { label: 'Confirm email address', path: '/verify?token=…' },
    footer: 'If the button does not work, paste this into your browser: {url}/verify?token=…',
  },
  {
    id: 'reset',
    name: 'Password reset',
    subject: 'Reset your {brand} password',
    blurb: 'Say what happens if it was not them — that is the whole security value.',
    preheader: 'A password reset was requested for your account.',
    heading: 'Reset your password',
    body: [
      'Someone requested a password reset for this account. Click below to choose a new one.',
      'This link expires in one hour and can be used once. If you did not request it, nothing has changed and you can ignore this email.',
    ],
    cta: { label: 'Choose a new password', path: '/reset?token=…' },
    footer: 'For your security, we never include your password in email.',
  },
  {
    id: 'receipt',
    name: 'Receipt',
    subject: 'Your {brand} receipt',
    blurb: 'People keep these. Put the number and the date where they can be found.',
    preheader: 'Receipt for your recent payment.',
    heading: 'Thanks for your payment',
    body: [
      'Here is your receipt. A copy is always available in your billing settings.',
      'Order #1043 · 8 August 2026 · $59.00 — Pro licence, one-time',
    ],
    cta: { label: 'View billing history', path: '/account/billing' },
    footer: 'Questions about this charge? Reply to this email.',
  },
]

const fill = (text: string, s: EmailState) =>
  text.replace(/\{brand\}/g, s.brand).replace(/\{url\}/g, s.url)

/**
 * The HTML. Tables and inline styles throughout — see the note at the top.
 *
 * `role="presentation"` on every layout table keeps screen readers from
 * announcing them as data tables, which is what makes a table-based layout
 * tolerable rather than hostile.
 */
function buildHtml(t: Template, s: EmailState): string {
  const f = (text: string) => fill(text, s)

  const cta = t.cta
    ? `
              <tr>
                <td style="padding: 8px 0 24px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" bgcolor="${s.accent}" style="border-radius: 8px;">
                        <a href="${s.url}${t.cta.path}"
                           style="display: inline-block; padding: 12px 24px; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                          ${t.cta.label}
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`
    : ''

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${f(t.subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5;">
  <!-- Preheader: shown after the subject line in the inbox list, hidden in
       the body. Without it, clients show the first words of your markup. -->
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
    ${f(t.preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px;">
          <tr>
            <td style="padding: 32px 32px 0;">
              <div style="font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 18px; font-weight: 700; color: #18181b;">
                ${s.brand}
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 32px 0;">
              <h1 style="margin: 0; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 24px; line-height: 1.3; font-weight: 700; color: #18181b;">
                ${f(t.heading)}
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 16px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${t.body
  .map(
    (p) => `                <tr>
                  <td style="padding-bottom: 16px; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; color: #52525b;">
                    ${f(p)}
                  </td>
                </tr>`,
  )
  .join('\n')}
${cta}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 8px 32px 32px;">
              <div style="border-top: 1px solid #e4e4e7; padding-top: 16px; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 12px; line-height: 1.5; color: #a1a1aa;">
                ${f(t.footer)}
              </div>
            </td>
          </tr>
        </table>

        <div style="padding-top: 16px; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 12px; color: #a1a1aa;">
          ${s.brand} · <a href="${s.url}" style="color: #a1a1aa;">${s.url.replace(/^https?:\/\//, '')}</a>
        </div>

      </td>
    </tr>
  </table>
</body>
</html>`
}

/** The text/plain part. Not optional — see the note at the top. */
function buildText(t: Template, s: EmailState): string {
  const f = (text: string) => fill(text, s)
  return [
    f(t.heading),
    '',
    ...t.body.map(f),
    ...(t.cta ? ['', `${t.cta.label}: ${s.url}${t.cta.path}`] : []),
    '',
    '—',
    f(t.footer),
    `${s.brand} · ${s.url}`,
  ].join('\n')
}

export default function EmailToolPage() {
  const [state, setState] = React.useState<EmailState>(DEFAULT_STATE)
  const [selected, setSelected] = React.useState<Template>(TEMPLATES[0]!)

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setState({ ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<EmailState>) })
    } catch {
      /* ignore */
    }
  }, [])

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  const html = buildHtml(selected, state)

  return (
    <ToolLayout
      name="Email Templates"
      tagline="The four transactional emails every product sends, in HTML that survives Outlook"
      icon={<Mail className="h-5 w-5" />}
    >
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-5">
          <ul className="space-y-1.5 rounded-2xl border border-border/60 bg-card/60 p-4">
            {TEMPLATES.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelected(t)}
                  aria-current={selected.id === t.id ? 'true' : undefined}
                  className={cn(
                    'w-full rounded-lg px-3 py-2.5 text-left transition-colors',
                    selected.id === t.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <span className="block text-sm font-semibold">{t.name}</span>
                  <span className="block text-xs">{t.blurb}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="space-y-4 rounded-2xl border border-border/60 bg-card/60 p-5">
            <div>
              <Label htmlFor="e-brand">Brand</Label>
              <Input
                id="e-brand"
                value={state.brand}
                onChange={(e) => setState((s) => ({ ...s, brand: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="e-url">Site URL</Label>
              <Input
                id="e-url"
                value={state.url}
                onChange={(e) => setState((s) => ({ ...s, url: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="e-accent">Button colour</Label>
              <input
                id="e-accent"
                type="color"
                value={state.accent}
                onChange={(e) => setState((s) => ({ ...s, accent: e.target.value }))}
                className="mt-2 h-9 w-full cursor-pointer rounded-lg border border-field/60 bg-transparent"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <div className="mb-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Subject:</span>{' '}
              {fill(selected.subject, state)}
            </div>
            {/* Sandboxed: this is untrusted-shaped content rendered as a
                document, and an iframe is also the only honest preview —
                the email's styles must not inherit anything from this page. */}
            <iframe
              title={`${selected.name} preview`}
              srcDoc={html}
              sandbox=""
              className="h-[560px] w-full rounded-xl border border-border/60 bg-white"
            />
          </div>

          <CopyCssCard code={html} title={`${selected.id}.html`} language="html" />
          <CopyCssCard
            code={buildText(selected, state)}
            title={`${selected.id}.txt — the text/plain part`}
            language="md"
          />
        </div>
      </div>
    </ToolLayout>
  )
}
