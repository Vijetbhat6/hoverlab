'use client'

/**
 * <AuthSignupSplit> — registration form beside a proof panel.
 *
 * The panel is `hidden lg:flex`: below that width it is dropped entirely
 * rather than stacked above the form. Pushing a testimonial above the
 * fields on a phone means the first thing a user who came to sign up has to
 * do is scroll past marketing.
 *
 * Password rules are stated up front and validated live. Hiding the
 * requirements until submission rejects the form is how you get users who
 * try four passwords and leave.
 */

import * as React from 'react'
import { Check, Loader2, Quote, Sparkles } from 'lucide-react'

export interface AuthSignupSplitProps {
  heading?: string
  subheading?: string
  quote?: { text: string; name: string; role: string }
  onSubmit?: (values: { name: string; email: string; password: string }) => Promise<void>
  loginHref?: string
  className?: string
}

/** Each rule is a predicate so the checklist and the submit gate agree. */
const RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'One number', test: (v) => /\d/.test(v) },
  { label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
]

export function AuthSignupSplit({
  heading = 'Create your account',
  subheading = 'Free to start. No card required.',
  quote = {
    text: 'We shipped our marketing site in four days instead of three weeks. Same team, same headcount.',
    name: 'Dana Whitfield',
    role: 'Head of Design, Globex',
  },
  onSubmit,
  loginHref = '/login',
  className = '',
}: AuthSignupSplitProps) {
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  const passed = RULES.map((r) => r.test(password))
  const allPassed = passed.every(Boolean)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (busy || !allPassed) return
    setBusy(true)
    try {
      await onSubmit?.({ name, email, password })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`grid min-h-96 w-full grid-cols-1 lg:grid-cols-2 ${className}`}>
      {/* ---------------------------------------------------------- *
       *  Form
       * ---------------------------------------------------------- */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
          {subheading ? (
            <p className="mt-1.5 text-sm text-muted-foreground">{subheading}</p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="signup-name" className="mb-1.5 block text-sm font-medium">
                Full name
              </label>
              <input
                id="signup-name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium">
                Work email
              </label>
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                required
                autoComplete="new-password"
                aria-describedby="signup-rules"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary"
              />

              <ul id="signup-rules" className="mt-3 space-y-1.5">
                {RULES.map((rule, i) => (
                  <li
                    key={rule.label}
                    className={`flex items-center gap-2 text-xs transition-colors ${
                      passed[i] ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${
                        passed[i] ? 'bg-emerald-500/15' : 'bg-muted'
                      }`}
                    >
                      {passed[i] ? <Check className="h-2.5 w-2.5" /> : null}
                    </span>
                    {rule.label}
                    <span className="sr-only">{passed[i] ? '— met' : '— not yet met'}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="submit"
              disabled={busy || !allPassed}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:[animation-duration:1.6s]" /> : null}
              {busy ? 'Creating account' : 'Create account'}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              By continuing you agree to the Terms and Privacy Policy.
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <a href={loginHref} className="font-semibold text-foreground hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------------- *
       *  Proof panel — dropped below lg rather than stacked
       * ---------------------------------------------------------- */}
      <div className="relative hidden items-center justify-center overflow-hidden border-l border-border/60 bg-gradient-to-br from-primary/10 via-card to-emerald-500/5 p-10 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
        />

        <figure className="relative max-w-sm">
          <Quote aria-hidden className="h-8 w-8 text-primary/40" />
          <blockquote className="mt-4 text-lg font-medium leading-relaxed text-balance">
            {quote.text}
          </blockquote>
          <figcaption className="mt-5 text-sm">
            <span className="block font-semibold">{quote.name}</span>
            <span className="block text-muted-foreground">{quote.role}</span>
          </figcaption>

          <div className="mt-8 flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm backdrop-blur">
            <Sparkles aria-hidden className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-muted-foreground">
              Set up in under two minutes — nothing to configure.
            </span>
          </div>
        </figure>
      </div>
    </div>
  )
}
