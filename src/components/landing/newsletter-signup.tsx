'use client'

/**
 * <NewsletterSignup> — email capture band.
 *
 * Sits before the footer. Single email input + subscribe button.
 *
 * The submit handler used to be `setTimeout(() => setStatus('done'), 800)`.
 * It showed "You're in. Talk soon." and stored nothing — under a heading
 * promising one email when new effects land, and beside a promise of
 * one-click unsubscribe, neither of which anything could keep. It also
 * receives the "Join the waitlist" traffic from any pricing tier that is
 * not purchasable, so the visitors most worth hearing from were the ones
 * being dropped.
 *
 * It now POSTs to /api/newsletter, which writes to Firestore and records
 * what was consented to. Two consequences worth keeping:
 *
 *   Failure is visible. If the address is not stored, the form says so
 *   and keeps the field's contents. A success state that does not depend
 *   on success is the bug this component used to be.
 *
 *   The promises under the field stay true. "Unsubscribe anytime" is
 *   backed by a token issued at signup and a route that honours it.
 */

import * as React from 'react'
import { Mail, Check, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react'
import { Reveal } from '@/components/reveal'

/** Which surface the signup came from, for knowing what converts. */
interface NewsletterSignupProps {
  source?: 'landing' | 'pricing' | 'footer' | 'docs'
}

export function NewsletterSignup({ source = 'landing' }: NewsletterSignupProps) {
  const [email, setEmail] = React.useState('')
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'done' | 'error'>(
    'idle',
  )
  const [error, setError] = React.useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }

      if (!res.ok) {
        // Show the server's sentence when it has one — it says whether the
        // address was rejected or the list was unreachable, and those call
        // for different things from the reader.
        setError(
          data.error ||
            'That did not go through. Please try again in a moment.',
        )
        setStatus('error')
        return
      }

      setStatus('done')
    } catch {
      setError(
        'We could not reach the server, so nothing was saved. Check your connection and try again.',
      )
      setStatus('error')
    }
  }

  return (
    <section
      id="newsletter"
      className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-emerald-600/5 p-8 text-center backdrop-blur sm:p-12">
          {/* decorative blobs */}
          <div
            aria-hidden
            className="fx-aurora-blob pointer-events-none absolute -top-20 -left-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
          />
          <div
            aria-hidden
            className="fx-aurora-blob pointer-events-none absolute -bottom-20 -right-10 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl"
            style={{ animationDelay: '4s' }}
          />

          <div className="relative">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Mail className="h-6 w-6" />
            </div>
            <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              One email when we drop new effects
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              No spam, no promotions, no digests. Just a heads-up when
              there&apos;s something new to play with. Unsubscribe in one click.
            </p>

            {status === 'done' ? (
              <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" />
                You&apos;re in. Talk soon.
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  disabled={status === 'loading'}
                  aria-invalid={status === 'error'}
                  aria-describedby={status === 'error' ? 'newsletter-error' : undefined}
                  className="fx-newsletter-input flex-1 rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none disabled:opacity-50"
                  aria-label="Email address"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-100 disabled:opacity-50"
                >
                  {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
                  {status !== 'loading' && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            )}

            {/*
              role="alert" so the failure is announced rather than merely
              drawn. The field keeps its value, so recovering is one click
              on Subscribe, not retyping an address.
            */}
            {status === 'error' ? (
              <p
                id="newsletter-error"
                role="alert"
                className="mx-auto mt-3 flex max-w-md items-start gap-2 text-left text-sm text-destructive"
              >
                <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                No spam, ever
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                Unsubscribe anytime
              </span>
              {/*
                "Joined by 1,200+ developers" was here. Nothing counts that
                number — it was invented, and it sat directly under an email
                field, which is exactly where a reader is deciding whether to
                trust us. The two promises either side of it are real and
                checkable, and they are the ones that do the work.
              */}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
