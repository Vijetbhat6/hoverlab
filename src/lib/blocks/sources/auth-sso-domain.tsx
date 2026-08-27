'use client'

/**
 * <AuthSsoDomain> — email first, then whatever that email's company uses.
 *
 * Authentication had login, signup, OTP, forgot, reset and two-factor:
 * six screens that all assume the account belongs to the person typing.
 * The moment a customer has an IT department that assumption breaks, and
 * the sign-in screen has to ask one question before it can know what to
 * show. Nothing in the catalog asked it.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * The password field is not disabled — it is *absent* until the domain is
 * known, and when SSO is required it never appears at all, with the
 * reason in its place. A greyed-out password box beside "your organisation
 * requires SSO" invites ten minutes of trying to type into it, and every
 * support ticket that follows starts with "the password field wasn't
 * working". Removing an input is honest; disabling one is a riddle.
 *
 * THE DOMAIN IS ECHOED BACK
 *
 * "Continue with Meridian Foods SSO" rather than "Continue with SSO".
 * Someone who mistypes their address at a company with two tenants finds
 * out here, at the button, rather than after a redirect to an identity
 * provider that shows them a login page for the wrong company.
 *
 * PERSONAL ADDRESSES ARE A NORMAL ANSWER
 *
 * A gmail.com address matching no tenant is the common case, not an
 * error. It falls through to the password path with no warning colour and
 * no scolding — the only difference is which second step appears.
 *
 * ACCESSIBILITY: one `<form>` with a real submit, so Enter works at every
 * stage; the step change is announced through `aria-live`; the back
 * control is a button that restores focus to the email field, because a
 * step that cannot be undone from the keyboard is a trap.
 */

import * as React from 'react'
import { ArrowLeft, ArrowRight, Building2, KeyRound, Loader2, ShieldCheck } from 'lucide-react'

export interface SsoTenant {
  /** Email domain, lower-case, without the @. */
  domain: string
  name: string
  /** What the redirect actually goes to — worth naming before it happens. */
  provider: string
  /** When true, the password path is not offered at all. */
  enforced?: boolean
}

export interface AuthSsoDomainProps {
  tenants?: SsoTenant[]
  className?: string
}

const DEFAULT_TENANTS: SsoTenant[] = [
  { domain: 'meridianfoods.com', name: 'Meridian Foods', provider: 'Okta', enforced: true },
  { domain: 'halden.co', name: 'Halden Group', provider: 'Microsoft Entra ID' },
]

type Step = 'email' | 'sso' | 'password'

export function AuthSsoDomain({ tenants = DEFAULT_TENANTS, className = '' }: AuthSsoDomainProps) {
  /*
   * Opens on the second step, with a domain already recognised.
   *
   * The first step is an email field, which is what every sign-in screen
   * looks like and says nothing about what this one does. The answer —
   * "Meridian Foods manages accounts on this domain, and there is no
   * password field because they require SSO" — is the component. "Use a
   * different email" walks back to the empty state.
   */
  const [email, setEmail] = React.useState('you@meridianfoods.com')
  const [step, setStep] = React.useState<Step>('sso')
  const [tenant, setTenant] = React.useState<SsoTenant | null>(tenants[0] ?? null)
  const [checking, setChecking] = React.useState(false)
  const emailRef = React.useRef<HTMLInputElement>(null)

  const domain = email.split('@')[1]?.trim().toLowerCase() ?? ''

  function lookUp(event: React.FormEvent) {
    event.preventDefault()
    if (step !== 'email') return
    setChecking(true)
    /*
      A real deployment asks the server here; the delay is kept because
      the interesting design question is what the screen does while it
      does not yet know, and a demo that answers instantly hides it.
    */
    window.setTimeout(() => {
      const match = tenants.find((t) => t.domain === domain) ?? null
      setTenant(match)
      setStep(match ? 'sso' : 'password')
      setChecking(false)
    }, 550)
  }

  function back() {
    setStep('email')
    setTenant(null)
    /* Focus follows, or the back button is decorative for keyboard users. */
    window.setTimeout(() => emailRef.current?.focus(), 0)
  }

  return (
    <section className={`mx-auto w-full max-w-md px-4 py-16 sm:px-6 ${className}`}>
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-7">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start with your work email — how you sign in depends on what your company
          has set up.
        </p>

        <form onSubmit={lookUp} className="mt-6 space-y-4">
          <div>
            <label htmlFor="sso-email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="sso-email"
              ref={emailRef}
              type="email"
              required
              autoComplete="username"
              value={email}
              readOnly={step !== 'email'}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@meridianfoods.com"
              className={`mt-1.5 h-10 w-full rounded-lg border border-field bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring ${
                step !== 'email' ? 'text-muted-foreground' : ''
              }`}
            />
          </div>

          {/* The step change is announced; the visual change alone is not
              available to a screen-reader user who just pressed Enter. */}
          <div aria-live="polite">
            {step === 'email' ? (
              <button
                type="submit"
                disabled={checking || !email.includes('@')}
                className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {checking ? (
                  <>
                    <Loader2 aria-hidden className="h-4 w-4 motion-safe:animate-spin" />
                    Checking your organisation
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight aria-hidden className="h-4 w-4" />
                  </>
                )}
              </button>
            ) : null}

            {step === 'sso' && tenant ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 p-3">
                  <Building2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    <strong className="font-semibold text-foreground">{tenant.name}</strong>{' '}
                    manages accounts on {tenant.domain}.{' '}
                    {tenant.enforced
                      ? 'They require single sign-on, so there is no password to enter here.'
                      : 'You can use single sign-on or your password.'}
                  </p>
                </div>

                {/* Named, so a mistyped domain is caught before the redirect. */}
                <button
                  type="button"
                  className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <ShieldCheck aria-hidden className="h-4 w-4" />
                  Continue with {tenant.name} SSO
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  Takes you to {tenant.provider}
                </p>

                {/* Absent, not disabled, when SSO is enforced. */}
                {!tenant.enforced ? (
                  <button
                    type="button"
                    onClick={() => setStep('password')}
                    className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <KeyRound aria-hidden className="h-4 w-4" />
                    Use a password instead
                  </button>
                ) : null}
              </div>
            ) : null}

            {step === 'password' ? (
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="sso-password"
                    className="block text-sm font-medium text-foreground"
                  >
                    Password
                  </label>
                  <input
                    id="sso-password"
                    type="password"
                    autoComplete="current-password"
                    className="mt-1.5 h-10 w-full rounded-lg border border-field bg-background px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Sign in
                </button>
                {/* A personal address is a normal answer, not a warning. */}
                <p className="text-xs text-muted-foreground">
                  {tenant
                    ? `${tenant.name} allows passwords as well as SSO.`
                    : `No organisation is set up for ${domain || 'that domain'} — this is an individual account.`}
                </p>
              </div>
            ) : null}
          </div>

          {step !== 'email' ? (
            <button
              type="button"
              onClick={back}
              className="inline-flex items-center gap-1.5 rounded text-xs font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
              Use a different email
            </button>
          ) : null}
        </form>
      </div>
    </section>
  )
}
