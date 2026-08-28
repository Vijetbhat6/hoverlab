'use client'

/**
 * Shared auth form for both /login and /signup.
 *
 * Behavior:
 *  - mode="login"  → email + password, primary CTA "Sign in"
 *  - mode="signup" → name (optional) + email + password, primary CTA "Create account"
 *
 * On success:
 *  - Calls the optional onAuthenticated callback (used to trigger data sync).
 *  - Reads the `redirect` query param and navigates there, defaulting to
 *    `/library`.
 *
 * Errors from the API are surfaced inline via the Alert component.
 */

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Fingerprint, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { track } from '@/lib/analytics'

import { PasskeyCancelled, useAuth } from '@/components/auth-provider'
import { AuthShell } from '@/components/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Mode = 'login' | 'signup'

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const params = useSearchParams()
  const { login, signup, loginWithPasskey, resetPassword } = useAuth()

  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPw, setShowPw] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [resetting, setResetting] = React.useState(false)
  const [passkeying, setPasskeying] = React.useState(false)
  const [passkeysAvailable, setPasskeysAvailable] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const isSignup = mode === 'signup'

  /**
   * Whether to offer the passkey button at all.
   *
   * Decided after mount, never during render: `window.PublicKeyCredential`
   * does not exist on the server, so branching on it in the render body
   * would produce markup the client immediately contradicts. Starting at
   * `false` means the server and the first client render agree, and the
   * button appears a tick later on the browsers that can honour it.
   */
  React.useEffect(() => {
    if (isSignup) return
    let cancelled = false
    import('@simplewebauthn/browser').then(({ browserSupportsWebAuthn }) => {
      if (!cancelled) setPasskeysAvailable(browserSupportsWebAuthn())
    })
    return () => {
      cancelled = true
    }
  }, [isSignup])

  async function onPasskey() {
    setError(null)
    setPasskeying(true)
    try {
      await loginWithPasskey()
      track('login_completed', { method: 'passkey' })
      toast.success('Welcome back!')
      const redirect = params.get('redirect') || '/library'
      router.replace(redirect)
      router.refresh()
    } catch (err) {
      // A dismissed prompt is not a failure. Saying nothing at all would be
      // confusing — the button was pressed and then nothing happened — so it
      // gets a toast rather than the red alert reserved for real problems.
      if (err instanceof PasskeyCancelled) {
        toast.message(err.message)
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      }
    } finally {
      setPasskeying(false)
    }
  }

  /**
   * Firebase owns password reset end to end — it sends the email, hosts the
   * page and expires the link — so this sends to whatever is already typed
   * in the email field rather than routing to a page of our own.
   *
   * The confirmation is identical whether or not the address is registered:
   * saying "no such account" would turn this button into a way to test which
   * email addresses have accounts.
   */
  async function onForgotPassword() {
    if (!email.trim()) {
      setError('Enter your email address first, then choose Forgot password.')
      return
    }
    setError(null)
    setResetting(true)
    try {
      await resetPassword(email)
      toast.success(
        'If an account exists for that email, a reset link is on its way.',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setResetting(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (isSignup) {
        await signup(email, password, name.trim() || undefined)
        track('signup_completed', { method: 'email' })
        toast.success('Account created. Your work is now saved to your account.')
      } else {
        await login(email, password)
        track('login_completed', { method: 'email' })
        toast.success('Welcome back!')
      }
      const redirect = params.get('redirect') || '/library'
      router.replace(redirect)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title={isSignup ? 'Create your account' : 'Welcome back'}
      description={
        isSignup
          ? 'Save your favorites and bundle across devices.'
          : 'Sign in to access your saved effects and bundle.'
      }
      note={
        <>
          By continuing, you agree to save your favorites and bundle to your
          account.
          <br />
          You can sign out anytime — your local data stays on this device too.
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {/*
            Above the email field, not below the password one. A passkey is
            the faster path for anyone who has set one up, and burying it
            under the form they were trying to avoid defeats the point — but
            it stays a secondary button, because most visitors have no
            passkey and the primary action must remain the one that works
            for them.
          */}
          {passkeysAvailable ? (
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onPasskey}
                disabled={passkeying || submitting}
              >
                {passkeying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Fingerprint className="mr-2 h-4 w-4" />
                )}
                {passkeying ? 'Waiting for your passkey…' : 'Sign in with a passkey'}
              </Button>

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  or
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
            </div>
          ) : null}

          {isSignup ? (
            <div className="space-y-2">
              <Label htmlFor="auth-name">Name (optional)</Label>
              <Input
                id="auth-name"
                type="text"
                autoComplete="name"
                placeholder="Ada Lovelace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                disabled={submitting}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="auth-password">Password</Label>
              <span className="flex items-center gap-3">
                {isSignup ? (
                  <span className="text-xs text-muted-foreground">
                    Min 8 characters
                  </span>
                ) : (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-60"
                    onClick={onForgotPassword}
                    disabled={resetting || submitting}
                    tabIndex={-1}
                  >
                    {resetting ? 'Sending…' : 'Forgot password?'}
                  </button>
                )}
                {/*
                  Show/Hide belongs on both forms. Sign-up used to force
                  `type="text"` unconditionally and render no toggle, so a new
                  account's password sat in plain sight on screen with no way
                  to mask it — the one place shoulder-surfing costs the most,
                  since it is the password being chosen.
                */}
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  onClick={() => setShowPw((v) => !v)}
                  tabIndex={-1}
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </span>
            </div>
            <Input
              id="auth-password"
              type={showPw ? 'text' : 'password'}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={submitting}
            />
          </div>
        </CardContent>

        <CardFooter className="mt-6 flex-col gap-3">
          <Button
            type="submit"
            className="w-full"
            disabled={submitting || passkeying}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSignup ? 'Creating account…' : 'Signing in…'}
              </>
            ) : isSignup ? (
              'Create account'
            ) : (
              'Sign in'
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isSignup ? (
              <>
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <Link
                  href="/signup"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Create one
                </Link>
              </>
            )}
          </p>
        </CardFooter>
      </form>
    </AuthShell>
  )
}
