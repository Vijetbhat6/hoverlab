'use client'

/**
 * <AuthForgotPassword> — request a reset link.
 *
 * The success state confirms that a link was sent *if the account exists*,
 * and says so in those words. Confirming outright that mail went to an
 * address turns this form into an account-enumeration oracle, and it is
 * the one place where the honest-sounding message is the insecure one.
 *
 * The whole card swaps to the sent state rather than showing a banner above
 * the form — leaving the field in place invites a second submit, and a
 * resend is a different action with its own cooldown.
 */

import * as React from 'react'
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react'

export interface AuthForgotPasswordProps {
  heading?: string
  subheading?: string
  onSubmit?: (email: string) => Promise<void>
  loginHref?: string
  /**
   * Render as a demo inside a larger page, which drops the email field's
   * `autoFocus`. Focusing an input scrolls the browser to it, so a card in
   * a preview grid would drag the visitor down the page on load.
   */
  embedded?: boolean
  className?: string
}

export function AuthForgotPassword({
  heading = 'Reset your password',
  subheading = 'Enter your email and we will send you a link to set a new one.',
  onSubmit,
  loginHref = '/login',
  embedded = false,
  className = '',
}: AuthForgotPasswordProps) {
  // Per-instance ids. A literal id in a reusable component is a
  // collision waiting for the second copy on the page — and a <label>
  // then resolves to whichever input rendered first.
  const uid = React.useId()
  const [email, setEmail] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [sent, setSent] = React.useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      await onSubmit?.(email)
      setSent(true)
    } catch {
      // Same outcome either way — see the note above.
      setSent(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`flex min-h-96 w-full items-center justify-center p-6 ${className}`}>
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card/80 p-7 shadow-sm backdrop-blur">
        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <MailCheck className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Check your inbox</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              If an account exists for{' '}
              <span className="font-medium text-foreground">{email}</span>, a reset
              link is on its way. It expires in 30 minutes.
            </p>

            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-6 text-sm font-semibold hover:underline"
            >
              Use a different address
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subheading}</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor={`${uid}-forgot-email`} className="mb-1.5 block text-sm font-medium">
                  Email
                </label>
                <input
                  id={`${uid}-forgot-email`}
                  type="email"
                  required
                  autoFocus={!embedded}
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:[animation-duration:1.6s]" /> : null}
                {busy ? 'Sending' : 'Send reset link'}
              </button>
            </form>
          </>
        )}

        <a
          href={loginHref}
          className="mt-6 inline-flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Back to sign in
        </a>
      </div>
    </div>
  )
}
