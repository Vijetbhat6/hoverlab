'use client'

/**
 * <AuthLoginCard> — a centred email/password sign-in card.
 *
 * The password field's reveal toggle is a real <button> with an aria-label
 * that changes with state, not an icon swapped inside the input. A reveal
 * control that screen readers announce as "button" and nothing else is the
 * single most common accessibility defect in sign-in forms.
 *
 * `autoComplete` values matter more here than anywhere else in an app:
 * `username` and `current-password` are what tell a password manager this
 * is a login rather than a registration, and getting them wrong is why
 * saved credentials silently stop filling.
 */

import * as React from 'react'
import { Eye, EyeOff, Loader2, Github, Chrome } from 'lucide-react'

export interface AuthLoginCardProps {
  heading?: string
  subheading?: string
  /** Reject to surface the error message. */
  onSubmit?: (values: { email: string; password: string }) => Promise<void>
  onSocial?: (provider: 'github' | 'google') => void
  signupHref?: string
  forgotHref?: string
  className?: string
}

export function AuthLoginCard({
  heading = 'Welcome back',
  subheading = 'Sign in to pick up where you left off.',
  onSubmit,
  onSocial,
  signupHref = '/signup',
  forgotHref = '/forgot-password',
  className = '',
}: AuthLoginCardProps) {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [visible, setVisible] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return

    setBusy(true)
    setError(null)
    try {
      await onSubmit?.({ email, password })
    } catch {
      // Deliberately vague: naming which half was wrong tells an attacker
      // whether the address exists.
      setError('That email and password combination did not work.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`flex min-h-96 w-full items-center justify-center p-6 ${className}`}>
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card/80 p-7 shadow-sm backdrop-blur">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
          {subheading ? (
            <p className="mt-1.5 text-sm text-muted-foreground">{subheading}</p>
          ) : null}
        </div>

        {/* Social first — most returning users came in that way. */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onSocial?.('github')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Github aria-hidden className="h-4 w-4" />
            GitHub
          </button>
          <button
            type="button"
            onClick={() => onSocial?.('google')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Chrome aria-hidden className="h-4 w-4" />
            Google
          </button>
        </div>

        <div className="my-6 flex items-center gap-3">
          <span aria-hidden className="h-px flex-1 bg-border/60" />
          <span className="text-xs text-muted-foreground">or continue with email</span>
          <span aria-hidden className="h-px flex-1 bg-border/60" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label htmlFor="login-password" className="block text-sm font-medium">
                Password
              </label>
              <a
                href={forgotHref}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Forgot?
              </a>
            </div>

            <div className="relative">
              <input
                id="login-password"
                type={visible ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 pr-11 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
              />
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {visible ? (
                  <EyeOff aria-hidden className="h-4 w-4" />
                ) : (
                  <Eye aria-hidden className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Reserved space, so an error does not shove the button down. */}
          <p aria-live="polite" className="min-h-5 text-sm text-destructive">
            {error}
          </p>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : null}
            {busy ? 'Signing in' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here?{' '}
          <a href={signupHref} className="font-semibold text-foreground hover:underline">
            Create an account
          </a>
        </p>
      </div>
    </div>
  )
}
