'use client'

/**
 * <NewsletterSignup> — an email capture band with inline status.
 *
 * Submission state is a small machine (`idle → submitting → done | error`)
 * rather than a pair of booleans, which is what stops the "sending" and
 * "sent" messages from ever being on screen together.
 *
 * The status line is `aria-live="polite"` and the input owns a real
 * <label>, so the outcome is announced rather than only shown — a success
 * message no one hears is a form that appears to have done nothing.
 */

import * as React from 'react'
import { Mail, Loader2, Check, AlertCircle } from 'lucide-react'

type Status = 'idle' | 'submitting' | 'done' | 'error'

export interface NewsletterSignupProps {
  heading?: string
  subheading?: string
  placeholder?: string
  ctaLabel?: string
  note?: string
  /** Resolve to subscribe, reject to show the error state. */
  onSubmit?: (email: string) => Promise<void>
  className?: string
}

export function NewsletterSignup({
  heading = 'Get the monthly digest',
  subheading = 'New sections, patterns worth stealing, and the occasional teardown. No spam.',
  placeholder = 'you@company.com',
  ctaLabel = 'Subscribe',
  note = 'Unsubscribe in one click. We never share your address.',
  onSubmit,
  className = '',
}: NewsletterSignupProps) {
  const [email, setEmail] = React.useState('')
  const [status, setStatus] = React.useState<Status>('idle')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (status === 'submitting') return

    setStatus('submitting')
    try {
      await onSubmit?.(email)
      setStatus('done')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className={`mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 ${className}`}>
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-8 text-center backdrop-blur sm:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative">
          <div className="mx-auto mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Mail className="h-5 w-5" />
          </div>

          <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
            {heading}
          </h2>
          {subheading ? (
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">{subheading}</p>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              disabled={status === 'submitting'}
              className="flex-1 rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {status === 'submitting' ? (
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              ) : null}
              {status === 'submitting' ? 'Subscribing' : ctaLabel}
            </button>
          </form>

          <p aria-live="polite" className="mt-3 min-h-5 text-sm">
            {status === 'done' ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <Check aria-hidden className="h-4 w-4" />
                You are on the list — check your inbox to confirm.
              </span>
            ) : null}
            {status === 'error' ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-destructive">
                <AlertCircle aria-hidden className="h-4 w-4" />
                That did not go through. Try again in a moment.
              </span>
            ) : null}
          </p>

          {note && status === 'idle' ? (
            <p className="mt-2 text-xs text-muted-foreground">{note}</p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
