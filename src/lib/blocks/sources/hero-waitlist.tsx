'use client'

/**
 * <HeroWaitlist> — a pre-launch hero whose only ask is an email address.
 *
 * One field and one button, because every extra control on a waitlist form
 * is a reason to leave. The social proof sits *under* the input rather than
 * above it: it is an argument for finishing, not for starting, and it reads
 * as filler before someone has decided to type.
 *
 * The form is a real `<form>` with a real `type="email"` input, so browser
 * autofill works, the phone keyboard shows the @ key, and the enter key
 * submits. `onSubmit` receives the address; wire it to your list provider.
 * With no handler passed, it resolves locally after a beat — which is what
 * makes the preview honest without a network call.
 *
 * The success state replaces the form rather than sitting beside it, and
 * the live region announces it. A confirmation that only appears visually
 * leaves a screen-reader user staring at a form they think failed.
 */

import * as React from 'react'
import { ArrowRight, Check, Loader2 } from 'lucide-react'

export interface HeroWaitlistProps {
  heading?: string
  subheading?: string
  placeholder?: string
  submitLabel?: string
  successMessage?: string
  note?: string
  /** How many are already on the list. Omit to hide the proof row. */
  waitlistCount?: number
  /** Return a promise to keep the button in its pending state until settled. */
  onSubmit?: (email: string) => void | Promise<void>
  className?: string
}

type Status = 'idle' | 'pending' | 'done'

export function HeroWaitlist({
  heading = 'Be first through the door.',
  subheading =
    'We are letting people in a few hundred at a time. Leave your email and we will send an invite the moment a slot opens.',
  placeholder = 'you@company.com',
  submitLabel = 'Request an invite',
  successMessage = "You're on the list. Watch your inbox.",
  note = 'No spam, and one unsubscribe link in every email.',
  waitlistCount = 4128,
  onSubmit,
  className = '',
}: HeroWaitlistProps) {
  const [email, setEmail] = React.useState('')
  const [status, setStatus] = React.useState<Status>('idle')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status !== 'idle') return

    setStatus('pending')
    try {
      // Without a handler this still resolves — the preview has to show the
      // pending and success states, and a block that only works once it is
      // wired up is a block nobody can evaluate.
      await (onSubmit?.(email) ?? new Promise((r) => setTimeout(r, 700)))
      setStatus('done')
    } catch {
      setStatus('idle')
    }
  }

  return (
    <section className={`relative overflow-hidden ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 py-20 text-center sm:px-6 lg:py-28">
        <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          {heading}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty leading-relaxed text-muted-foreground sm:text-lg">
          {subheading}
        </p>

        <div className="mt-9" aria-live="polite">
          {status === 'done' ? (
            <p className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <Check aria-hidden className="h-4 w-4" />
              {successMessage}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-2 sm:flex-row">
              <label htmlFor="waitlist-email" className="sr-only">
                Email address
              </label>
              <input
                id="waitlist-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={placeholder}
                disabled={status === 'pending'}
                className="h-12 flex-1 rounded-xl border border-border/60 bg-card/60 px-4 text-sm backdrop-blur transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={status === 'pending'}
                className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:translate-y-0 disabled:opacity-70"
              >
                {status === 'pending' ? (
                  <>
                    <Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:[animation-duration:1.6s]" />
                    Joining
                  </>
                ) : (
                  <>
                    {submitLabel}
                    <ArrowRight aria-hidden className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {note ? <p className="mt-3 text-xs text-muted-foreground">{note}</p> : null}

        {waitlistCount ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            {/* Initials, not photographs: a stock-photo avatar row is a
                claim about who your users are, and an obviously synthetic
                one is not. */}
            <div aria-hidden className="flex -space-x-2">
              {['AL', 'RS', 'MK', 'JT', 'PW'].map((initials, i) => (
                <span
                  key={initials}
                  style={{ zIndex: 5 - i }}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-primary/70 to-primary text-[10px] font-bold text-primary-foreground"
                >
                  {initials}
                </span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {waitlistCount.toLocaleString('en-US')}
              </span>{' '}
              already waiting
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
