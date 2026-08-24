'use client'

/**
 * <NewsletterInline> — the list prompt, at the moment something was taken.
 *
 * The band before the footer catches people who are still deciding. This
 * catches the ones who already decided: somebody who has just downloaded a
 * whole project is at the highest-intent moment this site produces, and it
 * is the only moment where "tell me when there are more of these" is an
 * obviously reasonable thing to be asked.
 *
 * Deliberately small and deliberately dismissible. A modal here would tax
 * the exact action the product wants people to take, and a prompt that
 * cannot be closed is one people learn to route around.
 *
 * Renders nothing for a signed-in user. We already have their address, and
 * asking a customer for something they gave us at signup reads as a product
 * that does not know who they are.
 */

import * as React from 'react'
import { ArrowRight, Check, Mail, X } from 'lucide-react'

import { useAuth } from '@/components/auth-provider'
import { track } from '@/lib/analytics'

export function NewsletterInline({
  source,
  className,
}: {
  /** Where this instance sits, for the analytics event. */
  source: string
  className?: string
}) {
  const { user, loading } = useAuth()
  const [email, setEmail] = React.useState('')
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'done' | 'error'>(
    'idle',
  )
  const [dismissed, setDismissed] = React.useState(false)

  if (loading || user || dismissed) return null

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!email.includes('@')) return
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })
      if (!res.ok) {
        setStatus('error')
        return
      }
      setStatus('done')
      track('newsletter_subscribed', { source })
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <p
        className={`inline-flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 ${className ?? ''}`}
      >
        <Check aria-hidden className="h-3.5 w-3.5" />
        On the list. Nothing else to do.
      </p>
    )
  }

  return (
    <div
      className={`relative rounded-xl border border-border/60 bg-muted/30 p-4 ${className ?? ''}`}
    >
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="absolute right-2 top-2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X aria-hidden className="h-3.5 w-3.5" />
      </button>

      <p className="flex items-center gap-2 pr-6 text-sm font-medium">
        <Mail aria-hidden className="h-4 w-4 text-primary" />
        Want to hear when there are more?
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        One email when something new lands. No digests, no promotions,
        unsubscribe in a click.
      </p>

      <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          disabled={status === 'loading'}
          aria-label="Email address"
          className="h-9 flex-1 rounded-lg border border-border/60 bg-background px-3 text-sm outline-none transition-colors focus-visible:border-primary/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {status === 'loading' ? 'Adding' : 'Keep me posted'}
          {status !== 'loading' ? <ArrowRight aria-hidden className="h-3.5 w-3.5" /> : null}
        </button>
      </form>

      {status === 'error' ? (
        <p role="alert" className="mt-2 text-xs text-destructive">
          That did not go through. Try again.
        </p>
      ) : null}
    </div>
  )
}
